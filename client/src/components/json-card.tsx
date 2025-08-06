import { Download, MoreHorizontal, AlertTriangle, CheckCircle, Copy, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { JsonParser } from '@/lib/json-parser';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const preview = JsonParser.formatJsonPreview(card.content, 8);
  const rawJson = JSON.stringify(card.content, null, 2);
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons
    if ((e.target as Element).closest('button')) {
      return;
    }
    
    if (isExpanded) {
      // If card is expanded, open editor
      onClick();
    } else {
      // If card is collapsed, expand it
      setIsExpanded(true);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 touch-manipulation ${
        isExpanded ? 'hover:-translate-y-1' : 'hover:-translate-y-0.5'
      }`}
      onClick={handleCardClick}
      data-testid={`card-${card.id}`}
    >
      <div className="p-4 sm:p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-1 truncate" data-testid={`text-card-title-${card.id}`}>
              {card.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-1" data-testid={`text-card-description-${card.id}`}>
              {card.description}
            </p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
            {hasWarnings && (
              <div className="w-2 h-2 bg-orange-400 rounded-full" data-testid={`indicator-warning-${card.id}`} />
            )}
            
            <button
              onClick={handleToggleExpand}
              className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
              data-testid={`button-expand-${card.id}`}
              title={isExpanded ? "Collapse card" : "Expand card"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleFlip}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isFlipped 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`button-flip-${card.id}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isFlipped ? 'Show Preview' : 'Show Raw JSON'}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                  data-testid={`button-copy-${card.id}`}
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport();
                  }}
                  className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                  data-testid={`button-export-${card.id}`}
                  title="Export as JSON file"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100" data-testid={`preview-${card.id}`}>
              {isFlipped ? (
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words overflow-x-auto">
                  {rawJson}
                </pre>
              ) : (
                <div className="space-y-1">
                  {preview.split('\n').map((line, index) => {
                    if (line.startsWith('   ') && line.includes(':')) {
                      // Parse label: value pairs for better alignment
                      const colonIndex = line.indexOf(':');
                      const label = line.substring(3, colonIndex).trim();
                      const value = line.substring(colonIndex + 1).trim();
                      
                      return (
                        <div key={index} className="flex justify-between items-start text-sm font-sans">
                          <span className="text-gray-600 font-medium min-w-0 flex-1">
                            {label}:
                          </span>
                          <span className="text-gray-800 ml-4 break-words text-right">
                            {value}
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className={`font-sans ${
                        line.startsWith('📦') || line.startsWith('📂') || line.startsWith('📄') 
                          ? 'text-blue-700 font-semibold text-sm mb-1' 
                          : line.startsWith('📝') || line.startsWith('🔢') || line.startsWith('📋') 
                          ? 'text-green-700 font-medium text-sm' 
                          : 'text-gray-600 text-sm'
                      }`}>
                        {line.trim() && (
                          <span className="whitespace-pre-wrap break-words">
                            {line}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Status Footer */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500" data-testid={`stats-${card.id}`}>
                {card.type === 'object' && `${Object.keys(card.content).length} properties`}
                {card.type === 'array' && `${card.content.length} items`}
                {card.type === 'primitive' && 'Single value'}
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
                    <span>Valid</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
