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
      return this.createStructuredPreview(content, maxLines);
    } catch {
      return String(content);
    }
  }

  private static createStructuredPreview(content: any, maxLines: number): string {
    const preview: string[] = [];
    const type = this.getContentType(content);
    
    // Add type and structure information
    preview.push(`📋 ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    if (Array.isArray(content)) {
      this.addArrayPreview(content, preview, maxLines - 2);
    } else if (typeof content === 'object' && content !== null) {
      this.addObjectPreview(content, preview, maxLines - 2);
    } else {
      preview.push(`${this.formatPrimitiveValue(content)}`);
    }
    
    return preview.slice(0, maxLines).join('\n');
  }

  private static addArrayPreview(arr: any[], preview: string[], remainingLines: number): void {
    preview.push(`📊 ${arr.length} items`);
    
    if (arr.length === 0) {
      preview.push('⚪ Empty array');
      return;
    }

    // Show data type distribution
    const typeStats = this.getTypeDistribution(arr);
    const typeInfo = Object.entries(typeStats)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
    
    if (typeInfo && remainingLines > 1) {
      preview.push(`🔍 Contains: ${typeInfo}`);
      remainingLines--;
    }

    // Show sample items with structure
    const sampleCount = Math.min(3, arr.length, remainingLines);
    for (let i = 0; i < sampleCount; i++) {
      const item = arr[i];
      const itemPreview = this.formatItemPreview(item, i);
      preview.push(`  ${itemPreview}`);
    }
    
    if (arr.length > sampleCount) {
      preview.push(`  ... and ${arr.length - sampleCount} more`);
    }
  }

  private static addObjectPreview(obj: Record<string, any>, preview: string[], remainingLines: number): void {
    const keys = Object.keys(obj);
    preview.push(`🗂️ ${keys.length} properties`);
    
    if (keys.length === 0) {
      preview.push('⚪ Empty object');
      return;
    }

    // Show key relationships and hierarchy
    const relationships = this.analyzeRelationships(obj);
    if (relationships.length > 0 && remainingLines > 1) {
      preview.push(`🔗 ${relationships.join(', ')}`);
      remainingLines--;
    }

    // Show key structure with values
    const keyPreviewCount = Math.min(4, keys.length, remainingLines);
    for (let i = 0; i < keyPreviewCount; i++) {
      const key = keys[i];
      const value = obj[key];
      const keyPreview = this.formatKeyPreview(key, value);
      preview.push(`  ${keyPreview}`);
    }
    
    if (keys.length > keyPreviewCount) {
      preview.push(`  ... and ${keys.length - keyPreviewCount} more`);
    }
  }

  private static getContentType(content: any): string {
    if (Array.isArray(content)) return 'array';
    if (content === null) return 'null value';
    if (typeof content === 'object') return 'object';
    return typeof content;
  }

  private static getTypeDistribution(arr: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    arr.forEach(item => {
      let type: string = typeof item;
      if (Array.isArray(item)) type = 'array';
      else if (item === null) type = 'null';
      else if (typeof item === 'object') type = 'object';
      
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }

  private static formatItemPreview(item: any, index: number): string {
    const prefix = `[${index}]`;
    
    if (Array.isArray(item)) {
      return `${prefix} Array(${item.length})`;
    } else if (typeof item === 'object' && item !== null) {
      const keys = Object.keys(item);
      const keyPreview = keys.slice(0, 2).join(', ');
      const more = keys.length > 2 ? `, +${keys.length - 2}` : '';
      return `${prefix} {${keyPreview}${more}}`;
    } else {
      return `${prefix} ${this.formatPrimitiveValue(item)}`;
    }
  }

  private static formatKeyPreview(key: string, value: any): string {
    const keyDisplay = `${key}:`;
    
    if (Array.isArray(value)) {
      return `${keyDisplay} Array(${value.length})`;
    } else if (typeof value === 'object' && value !== null) {
      const subKeys = Object.keys(value);
      return `${keyDisplay} Object(${subKeys.length})`;
    } else {
      return `${keyDisplay} ${this.formatPrimitiveValue(value)}`;
    }
  }

  private static formatPrimitiveValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 30 ? `"${value.substring(0, 27)}..."` : `"${value}"`;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else if (value === null) {
      return 'null';
    } else {
      return String(value);
    }
  }

  private static analyzeRelationships(obj: Record<string, any>): string[] {
    const relationships: string[] = [];
    const keys = Object.keys(obj);
    
    // Detect common relationship patterns
    const hasId = keys.some(key => key.toLowerCase().includes('id'));
    const hasNested = keys.some(key => typeof obj[key] === 'object' && obj[key] !== null);
    const hasArrays = keys.some(key => Array.isArray(obj[key]));
    
    if (hasId) relationships.push('Has identifiers');
    if (hasNested) relationships.push('Nested structure');
    if (hasArrays) relationships.push('Contains collections');
    
    // Detect naming patterns that suggest relationships
    const relationalKeys = keys.filter(key => 
      key.toLowerCase().endsWith('_id') || 
      key.toLowerCase().endsWith('id') ||
      key.toLowerCase().includes('ref') ||
      key.toLowerCase().includes('link')
    );
    
    if (relationalKeys.length > 0) {
      relationships.push(`${relationalKeys.length} references`);
    }
    
    return relationships;
  }
}
