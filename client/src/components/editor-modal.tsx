import { useEffect, useRef, useState } from 'react';
import { X, Download, Upload, Save, FileText, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    description: string;
    content: any;
    isValid: boolean;
    warnings?: string[];
  } | null;
  onSave: (content: any) => void;
  onExportCard: () => void;
  onImportPartial: (content: any) => void;
}

export function EditorModal({ 
  isOpen, 
  onClose, 
  card, 
  onSave, 
  onExportCard, 
  onImportPartial 
}: EditorModalProps) {
  const [editorContent, setEditorContent] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card && isOpen) {
      const formatted = JSON.stringify(card.content, null, 2);
      setEditorContent(formatted);
      setHasChanges(false);
      setIsValid(true);
      setErrors([]);
    }
  }, [card, isOpen]);

  const validateJson = (content: string) => {
    try {
      JSON.parse(content);
      setIsValid(true);
      setErrors([]);
      return true;
    } catch (error) {
      setIsValid(false);
      setErrors([error instanceof Error ? error.message : 'Invalid JSON']);
      return false;
    }
  };

  const handleContentChange = (value: string) => {
    setEditorContent(value);
    setHasChanges(true);
    validateJson(value);
  };

  const handleSave = () => {
    if (isValid && editorContent.trim()) {
      try {
        const parsed = JSON.parse(editorContent);
        onSave(parsed);
        setHasChanges(false);
      } catch (error) {
        setErrors(['Failed to parse JSON before saving']);
      }
    }
  };

  const handleImportPartial = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setEditorContent(JSON.stringify(parsed, null, 2));
        setHasChanges(true);
        validateJson(content);
      } catch (error) {
        setErrors(['Invalid JSON file']);
      }
    };
    reader.readAsText(file);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(editorContent);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditorContent(formatted);
    } catch (error) {
      // Do nothing if JSON is invalid
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(editorContent);
      const minified = JSON.stringify(parsed);
      setEditorContent(minified);
    } catch (error) {
      // Do nothing if JSON is invalid
    }
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                data-testid="button-close-editor"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-black" data-testid="text-editor-title">
                  {card.title}
                </h2>
                <p className="text-sm text-gray-500" data-testid="text-editor-description">
                  {card.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleImportPartial}
                className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                data-testid="button-import-partial"
              >
                <Upload className="w-4 h-4" />
                <span>Import Partial</span>
              </button>
              
              <button
                onClick={onExportCard}
                className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                data-testid="button-export-card"
              >
                <Download className="w-4 h-4" />
                <span>Export Card</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-save-changes"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Changes
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm resize-none outline-none"
                  placeholder="Enter JSON content..."
                  data-testid="textarea-json-editor"
                />
                {!isValid && (
                  <div className="p-3 bg-red-50 border-t border-red-200">
                    <div className="text-sm text-red-600">
                      {errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="w-80 border-l border-gray-100 bg-gray-50 p-6 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Validation Status */}
                <div>
                  <h4 className="text-sm font-semibold text-black mb-3">Validation</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isValid 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isValid ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium" data-testid="text-validation-status">
                        {isValid ? 'Valid JSON' : 'Invalid JSON'}
                      </span>
                    </div>
                    {hasChanges && (
                      <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded-lg">
                        Unsaved changes
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div>
                  <h4 className="text-sm font-semibold text-black mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={formatJson}
                      className="w-full text-left px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition-colors"
                      data-testid="button-format-json"
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Format JSON
                    </button>
                    <button
                      onClick={minifyJson}
                      className="w-full text-left px-3 py-2 text-sm text-black hover:bg-white rounded-lg transition-colors"
                      data-testid="button-minify-json"
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Minify JSON
                    </button>
                  </div>
                </div>
                
                {/* Card Info */}
                <div>
                  <h4 className="text-sm font-semibold text-black mb-3">Card Information</h4>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="p-2 bg-white rounded-lg">
                      <div className="font-medium">Type</div>
                      <div>{card.content && typeof card.content}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg">
                      <div className="font-medium">Size</div>
                      <div>{JSON.stringify(card.content).length} characters</div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileImport}
          data-testid="input-import-partial"
        />
      </DialogContent>
    </Dialog>
  );
}
