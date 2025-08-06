import { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function FileDropzone({ onFileSelect, isLoading }: FileDropzoneProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (jsonFile) {
      onFileSelect(jsonFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="text-center py-8 sm:py-16 px-4">
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors cursor-pointer touch-manipulation"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
        data-testid="file-dropzone"
      >
        {isLoading ? (
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
        )}
      </div>
      
      <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">No JSON File Loaded</h3>
      <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-md mx-auto">Import a JSON file to start editing and organizing your data</p>
      <div className="text-xs sm:text-sm text-gray-400 mb-6 max-w-lg mx-auto">
        <p>You can also:</p>
        <ul className="mt-2 space-y-1">
          <li>• Paste JSON with <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+V</kbd></li>
          <li>• Drag & drop JSON files anywhere</li>
          <li>• Drag & drop JSON text content</li>
        </ul>
      </div>
      
      <button
        className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 touch-manipulation"
        onClick={() => document.getElementById('file-input')?.click()}
        disabled={isLoading}
        data-testid="button-choose-file"
      >
        <FileText className="w-4 h-4" />
        <span>Choose File</span>
      </button>
      
      <input
        id="file-input"
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileInput}
        data-testid="input-file"
      />
    </div>
  );
}
