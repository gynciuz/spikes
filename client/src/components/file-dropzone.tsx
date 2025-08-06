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
    <div className="text-center py-16">
      <div
        className="w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
        data-testid="file-dropzone"
      >
        {isLoading ? (
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <Upload className="w-12 h-12 text-gray-400" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-black mb-2">No JSON File Loaded</h3>
      <p className="text-gray-500 mb-6">Import a JSON file to start editing and organizing your data</p>
      
      <button
        className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
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
