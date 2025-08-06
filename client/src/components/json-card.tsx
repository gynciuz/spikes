import { Download, MoreHorizontal, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { JsonParser } from '@/lib/json-parser';
import { useToast } from '@/hooks/use-toast';

interface JsonCardProps {
  card: {
    id: string;
    title: string;
    description: string;
    content: any;
    type: 'object' | 'array' | 'primitive';
    isValid: boolean;
    warnings?: string[];
  };
  onClick: () => void;
  onExport: () => void;
}

export function JsonCard({ card, onClick, onExport }: JsonCardProps) {
  const { toast } = useToast();
  const preview = JsonParser.formatJsonPreview(card.content, 5);
  const hasWarnings = card.warnings && card.warnings.length > 0;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const jsonString = JSON.stringify(card.content, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: 'Success',
        description: 'Card content copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 border border-gray-100 touch-manipulation"
      onClick={onClick}
      data-testid={`card-${card.id}`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-1 truncate" data-testid={`text-card-title-${card.id}`}>
              {card.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2" data-testid={`text-card-description-${card.id}`}>
              {card.description}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
            {hasWarnings && (
              <div className="w-2 h-2 bg-orange-400 rounded-full" data-testid={`indicator-warning-${card.id}`} />
            )}
            <button
              className="p-1.5 sm:p-1 hover:bg-gray-50 rounded-md transition-colors touch-manipulation"
              onClick={handleCopy}
              data-testid={`button-copy-${card.id}`}
              title="Copy card content to clipboard"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1.5 sm:p-1 hover:bg-gray-50 rounded-md transition-colors touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              data-testid={`button-export-${card.id}`}
              title="Export card as JSON file"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button className="hidden sm:block p-1 hover:bg-gray-50 rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 font-mono text-xs sm:text-sm overflow-hidden">
          <pre className="whitespace-pre-wrap text-gray-700 overflow-hidden leading-relaxed" data-testid={`preview-${card.id}`}>
            {preview}
          </pre>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 sm:mt-4 gap-2 text-xs">
          <span className="text-gray-500" data-testid={`stats-${card.id}`}>
            {card.type === 'object' && `${Object.keys(card.content).length} properties`}
            {card.type === 'array' && `${card.content.length} items`}
            {card.type === 'primitive' && 'Primitive value'}
          </span>
          <div className="flex items-center space-x-2">
            {hasWarnings ? (
              <span className="flex items-center space-x-1 text-orange-500" data-testid={`status-warning-${card.id}`}>
                <AlertTriangle className="w-3 h-3" />
                <span className="truncate">{card.warnings![0]}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-green-500" data-testid={`status-valid-${card.id}`}>
                <CheckCircle className="w-3 h-3" />
                <span>Valid JSON</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
