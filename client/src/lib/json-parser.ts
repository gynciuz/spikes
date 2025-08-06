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
    
    if (Array.isArray(content)) {
      this.addSimpleArrayPreview(content, preview, maxLines);
    } else if (typeof content === 'object' && content !== null) {
      this.addSimpleObjectPreview(content, preview, maxLines);
    } else {
      preview.push(`📄 Simple value: ${this.formatPrimitiveValue(content)}`);
    }
    
    return preview.slice(0, maxLines).join('\n');
  }

  private static addSimpleArrayPreview(arr: any[], preview: string[], maxLines: number): void {
    if (arr.length === 0) {
      preview.push('📦 Empty list');
      return;
    }

    if (arr.length === 1) {
      preview.push('📦 Contains 1 item');
    } else {
      preview.push(`📦 Contains ${arr.length} items`);
    }

    // Describe what's inside in simple terms
    const firstItem = arr[0];
    if (typeof firstItem === 'string') {
      preview.push(`📝 List of text values`);
      preview.push(`   First item: "${firstItem.length > 30 ? firstItem.substring(0, 30) + '...' : firstItem}"`);
    } else if (typeof firstItem === 'number') {
      preview.push(`🔢 List of numbers`);
      preview.push(`   First number: ${firstItem}`);
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = Object.keys(firstItem);
      preview.push(`📋 List of information cards`);
      if (keys.length > 0) {
        const keyNames = keys.slice(0, 3).join(', ');
        preview.push(`   Each card has: ${keyNames}${keys.length > 3 ? '...' : ''}`);
      }
    } else {
      preview.push(`📊 List of various items`);
    }
    
    if (arr.length > 1) {
      preview.push(`   (and ${arr.length - 1} more similar items)`);
    }
  }

  private static addSimpleObjectPreview(obj: Record<string, any>, preview: string[], maxLines: number): void {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      preview.push('📂 Empty information card');
      return;
    }

    if (keys.length === 1) {
      preview.push('📂 Information card with 1 piece of data');
    } else {
      preview.push(`📂 Information card with ${keys.length} pieces of data`);
    }

    // Show what kind of information this contains
    const examples: string[] = [];
    const maxExamples = Math.min(4, keys.length, maxLines - 2);
    
    for (let i = 0; i < maxExamples; i++) {
      const key = keys[i];
      const value = obj[key];
      const friendlyName = this.makeKeyFriendly(key);
      
      if (typeof value === 'string') {
        examples.push(`   ${friendlyName}: "${value.length > 25 ? value.substring(0, 25) + '...' : value}"`);
      } else if (typeof value === 'number') {
        examples.push(`   ${friendlyName}: ${value}`);
      } else if (typeof value === 'boolean') {
        examples.push(`   ${friendlyName}: ${value ? 'Yes' : 'No'}`);
      } else if (Array.isArray(value)) {
        examples.push(`   ${friendlyName}: List with ${value.length} items`);
      } else if (typeof value === 'object' && value !== null) {
        examples.push(`   ${friendlyName}: More detailed information`);
      } else {
        examples.push(`   ${friendlyName}: Some data`);
      }
    }
    
    preview.push(...examples);
    
    if (keys.length > maxExamples) {
      preview.push(`   ... and ${keys.length - maxExamples} more pieces of information`);
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

  private static makeKeyFriendly(key: string): string {
    // Convert technical keys to friendly names
    const friendlyMappings: Record<string, string> = {
      'id': 'ID Number',
      'user_id': 'User ID',
      'userId': 'User ID', 
      'name': 'Name',
      'firstName': 'First Name',
      'first_name': 'First Name',
      'lastName': 'Last Name', 
      'last_name': 'Last Name',
      'email': 'Email',
      'phone': 'Phone',
      'address': 'Address',
      'created_at': 'Created Date',
      'createdAt': 'Created Date',
      'updated_at': 'Updated Date',
      'updatedAt': 'Updated Date',
      'price': 'Price',
      'amount': 'Amount',
      'quantity': 'Quantity',
      'status': 'Status',
      'isActive': 'Is Active',
      'is_active': 'Is Active'
    };

    // Return friendly name if available
    if (friendlyMappings[key]) {
      return friendlyMappings[key];
    }

    // Convert camelCase and snake_case to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
