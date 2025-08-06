import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Search, AlertTriangle, Copy, Clipboard } from 'lucide-react';
import { JsonCard } from '@/components/json-card';
import { EditorModal } from '@/components/editor-modal';
import { FileDropzone } from '@/components/file-dropzone';
import { JsonParser } from '@/lib/json-parser';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { JsonFile } from '@shared/schema';

export default function JsonEditor() {
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current file
  const { data: currentFile, isLoading } = useQuery<JsonFile>({
    queryKey: ['/api/json-files', currentFileId],
    enabled: !!currentFileId,
  });

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (fileData: any) => {
      const response = await apiRequest('POST', '/api/json-files', fileData);
      return response.json();
    },
    onSuccess: (data: JsonFile) => {
      setCurrentFileId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/json-files'] });
      toast({
        title: 'Success',
        description: 'JSON file imported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to import JSON file',
        variant: 'destructive',
      });
    },
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<JsonFile> }) => {
      const response = await apiRequest('PATCH', `/api/json-files/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/json-files', currentFileId] });
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    },
  });

  // Generic function to handle JSON import from any source
  const handleJsonImport = useCallback(async (content: any, fileName: string = 'imported.json', fileSize?: number) => {
    setIsImporting(true);
    try {
      let parsedContent;
      if (typeof content === 'string') {
        parsedContent = JSON.parse(content);
      } else {
        parsedContent = content;
      }
      
      const cards = JsonParser.parseJsonToCards(parsedContent, fileName);
      const actualSize = fileSize || JSON.stringify(parsedContent).length;
      
      const fileData = {
        name: fileName,
        content: parsedContent,
        size: actualSize,
        lastModified: new Date().toISOString(),
        cards,
      };
      
      createFileMutation.mutate(fileData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON content or parsing error',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [createFileMutation, toast]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      await handleJsonImport(text, file.name, file.size);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive',
      });
    }
  }, [handleJsonImport, toast]);

  // Copy/Paste functionality
  const handlePasteJson = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        await handleJsonImport(text, `pasted-${Date.now()}.json`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to read from clipboard or invalid JSON',
        variant: 'destructive',
      });
    }
  }, [handleJsonImport, toast]);

  const handleCopyFullJson = useCallback(async () => {
    if (!currentFile) return;
    
    try {
      const jsonString = JSON.stringify(currentFile.content, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: 'Success',
        description: 'JSON copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [currentFile, toast]);

  // Global drag and drop handlers
  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!e.relatedTarget || !document.body.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleGlobalDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer?.files || []);
    const jsonFile = files.find(file => 
      file.type === 'application/json' || 
      file.name.endsWith('.json')
    );
    
    if (jsonFile) {
      await handleFileSelect(jsonFile);
      return;
    }
    
    // Try to get text content from drag
    const text = e.dataTransfer?.getData('text/plain');
    if (text && text.trim()) {
      try {
        await handleJsonImport(text, `dropped-${Date.now()}.json`);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Dropped content is not valid JSON',
          variant: 'destructive',
        });
      }
    }
  }, [handleFileSelect, handleJsonImport, toast]);

  // Keyboard shortcut for paste
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.target || 
        (e.target as HTMLElement).tagName !== 'INPUT' && 
        (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      handlePasteJson();
    }
  }, [handlePasteJson]);

  // Set up global event listeners
  useEffect(() => {
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDrop, handleKeyDown]);

  const handleCardClick = useCallback((card: any) => {
    setSelectedCard(card);
    setIsEditorOpen(true);
  }, []);

  const handleCardSave = useCallback((content: any) => {
    if (!currentFile || !selectedCard) return;
    
    const updatedCards = currentFile.cards.map(card => 
      card.id === selectedCard.id 
        ? { ...card, content, isValid: true, warnings: [] }
        : card
    );
    
    // Reconstruct the full JSON from cards
    const updatedContent = { ...currentFile.content };
    // This is simplified - in a real app you'd need to properly merge the content back
    
    updateFileMutation.mutate({
      id: currentFile.id,
      updates: { cards: updatedCards, content: updatedContent }
    });
    
    setIsEditorOpen(false);
    setSelectedCard(null);
  }, [currentFile, selectedCard, updateFileMutation]);

  const handleExportFull = useCallback(() => {
    if (!currentFile) return;
    
    const blob = new Blob([JSON.stringify(currentFile.content, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentFile]);

  const handleExportCard = useCallback((card?: any) => {
    const cardToExport = card || selectedCard;
    if (!cardToExport) return;
    
    const blob = new Blob([JSON.stringify(cardToExport.content, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cardToExport.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedCard]);

  const handleImportPartial = useCallback((content: any) => {
    // In a real app, this would merge the content intelligently
    handleCardSave(content);
  }, [handleCardSave]);

  const filteredCards = currentFile?.cards.filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalWarnings = currentFile?.cards.reduce((acc, card) => 
    acc + (card.warnings?.length || 0), 0
  ) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-500 border-dashed">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">Drop JSON Content</h3>
              <p className="text-gray-500">Drop files or JSON text anywhere to import</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-semibold text-black">JSON Editor</h1>
              <span className="hidden sm:inline text-sm text-gray-500">v1.0</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePasteJson}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                data-testid="button-paste"
                title="Paste JSON from clipboard (Ctrl+V)"
              >
                <Clipboard className="w-4 h-4" />
                <span className="hidden sm:inline">Paste</span>
              </button>
              
              <button
                onClick={() => document.getElementById('file-input')?.click()}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                data-testid="button-import"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              
              <button
                onClick={handleCopyFullJson}
                disabled={!currentFile}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                data-testid="button-copy"
                title="Copy full JSON to clipboard"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              
              <button
                onClick={handleExportFull}
                disabled={!currentFile}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                data-testid="button-export"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search JSON..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 sm:w-48 lg:w-64 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-search"
                />
                <Search className="absolute right-3 top-1.5 w-4 h-4 text-gray-400" />
              </div>
              
              <button
                onClick={() => setSearchQuery('')}
                className="sm:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
                data-testid="button-search-mobile"
              >
                <Search className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Mobile search bar */}
          <div className="sm:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search JSON..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="input-search-mobile"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Status Bar */}
        {currentFile && (
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-none" data-testid="text-filename">
                    {currentFile.name}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  <span data-testid="text-file-size">{(currentFile.size / 1024).toFixed(1)} KB</span> • 
                  <span data-testid="text-card-count"> {currentFile.cards.length} cards</span>
                </div>
              </div>
              
              {totalWarnings > 0 && (
                <div className="flex items-center space-x-2 px-2 py-1 bg-orange-50 rounded-md">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-600" data-testid="text-warnings">
                    {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {!currentFile ? (
          <FileDropzone onFileSelect={handleFileSelect} isLoading={isImporting} />
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 auto-rows-max">
            {filteredCards.map((card, index) => (
              <div 
                key={card.id}
                className={`${
                  // Bento box style - varying heights and occasional full width
                  index === 0 ? 'sm:col-span-2 sm:row-span-1' : // First card spans full width
                  index % 5 === 4 ? 'sm:col-span-2' : // Every 5th card spans full width
                  index % 3 === 0 ? 'sm:row-span-2' : // Every 3rd card is taller
                  ''
                }`}
              >
                <JsonCard
                  card={{
                    ...card,
                    content: card.content || {}
                  }}
                  onClick={() => handleCardClick(card)}
                  onExport={() => handleExportCard(card)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        data-testid="input-file-hidden"
      />

      {/* Editor Modal */}
      <EditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        onSave={handleCardSave}
        onExportCard={() => handleExportCard()}
        onImportPartial={handleImportPartial}
      />
    </div>
  );
}
