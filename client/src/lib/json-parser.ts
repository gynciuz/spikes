export interface JsonCard {
  id: string;
  title: string;
  description: string;
  path: string;
  content: any;
  type: 'object' | 'array' | 'primitive';
  isValid: boolean;
  warnings?: string[];
}

export class JsonParser {
  static parseJsonToCards(jsonContent: any, fileName: string): JsonCard[] {
    const cards: JsonCard[] = [];
    
    if (typeof jsonContent !== 'object' || jsonContent === null) {
      return [{
        id: 'root',
        title: fileName,
        description: 'Root value',
        path: '$',
        content: jsonContent,
        type: 'primitive',
        isValid: true
      }];
    }

    this.extractCards(jsonContent, cards, '$');
    return cards;
  }

  private static extractCards(obj: any, cards: JsonCard[], path: string, depth: number = 0): void {
    if (depth > 3) return; // Prevent infinite recursion

    if (Array.isArray(obj)) {
      cards.push({
        id: this.generateId(path),
        title: this.pathToTitle(path),
        description: `Array with ${obj.length} items`,
        path,
        content: obj,
        type: 'array',
        isValid: this.validateJson(obj),
        warnings: this.getWarnings(obj)
      });

      // Don't recurse into array items to avoid too many cards
      return;
    }

    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      
      // Create card for this object if it has meaningful content
      if (keys.length > 0) {
        cards.push({
          id: this.generateId(path),
          title: this.pathToTitle(path),
          description: `Object with ${keys.length} properties`,
          path,
          content: obj,
          type: 'object',
          isValid: this.validateJson(obj),
          warnings: this.getWarnings(obj)
        });
      }

      // Recursively process nested objects
      for (const key of keys) {
        const value = obj[key];
        const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
        
        if ((typeof value === 'object' && value !== null) || Array.isArray(value)) {
          this.extractCards(value, cards, newPath, depth + 1);
        }
      }
    }
  }

  private static generateId(path: string): string {
    return btoa(path).replace(/[/+=]/g, '').substring(0, 8);
  }

  private static pathToTitle(path: string): string {
    if (path === '$') return 'Root Object';
    
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Convert camelCase or snake_case to Title Case
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static validateJson(obj: any): boolean {
    try {
      JSON.stringify(obj);
      return true;
    } catch {
      return false;
    }
  }

  private static getWarnings(obj: any): string[] {
    const warnings: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      // Check for potentially problematic patterns
      if (Array.isArray(obj) && obj.length === 0) {
        warnings.push('Empty array');
      }
      
      if (!Array.isArray(obj) && Object.keys(obj).length === 0) {
        warnings.push('Empty object');
      }
      
      // Check for undefined values (which become null in JSON)
      const hasNullValues = JSON.stringify(obj).includes('null');
      if (hasNullValues) {
        warnings.push('Contains null values');
      }
    }
    
    return warnings;
  }

  static formatJsonPreview(content: any, maxLines: number = 6): string {
    try {
      const formatted = JSON.stringify(content, null, 2);
      const lines = formatted.split('\n');
      
      if (lines.length <= maxLines) {
        return formatted;
      }
      
      return lines.slice(0, maxLines - 1).join('\n') + '\n  ...';
    } catch {
      return String(content);
    }
  }
}
