import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Search, AlertTriangle } from 'lucide-react';
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

  const handleFileSelect = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const jsonContent = JSON.parse(text);
      const cards = JsonParser.parseJsonToCards(jsonContent, file.name);
      
      const fileData = {
        name: file.name,
        content: jsonContent,
        size: file.size,
        lastModified: new Date().toISOString(),
        cards,
      };
      
      createFileMutation.mutate(fileData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid JSON file',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [createFileMutation, toast]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-black">JSON Editor</h1>
              <span className="text-sm text-gray-500">v1.0</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => document.getElementById('file-input')?.click()}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                data-testid="button-import"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              
              <button
                onClick={handleExportFull}
                disabled={!currentFile}
                className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                data-testid="button-export"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search JSON..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-search"
                />
                <Search className="absolute right-3 top-1.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Bar */}
        {currentFile && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-500" data-testid="text-filename">
                  {currentFile.name}
                </span>
              </div>
              <div className="text-sm text-gray-500">
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
        )}

        {/* Content */}
        {!currentFile ? (
          <FileDropzone onFileSelect={handleFileSelect} isLoading={isImporting} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => (
              <JsonCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                onExport={() => handleExportCard(card)}
              />
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
