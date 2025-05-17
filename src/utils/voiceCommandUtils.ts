
import { VoiceProduct, VoiceCommandResult, VOICE_COMMAND_TYPES } from '@/types/voice';

export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'kg': 'kilogram',
    'g': 'gram',
    'kgs': 'kilogram',
    'grams': 'gram',
    'kilos': 'kilogram',
    'kilo': 'kilogram',
    'kilograms': 'kilogram',
    'kilogram': 'kilogram',
    'l': 'liter',
    'ml': 'milliliter',
    'liter': 'liter',
    'litre': 'liter',
    'liters': 'liter',
    'litres': 'liter',
    'milliliter': 'milliliter',
    'millilitre': 'milliliter',
    'milliliters': 'milliliter',
    'millilitres': 'milliliter',
    'packet': 'packet',
    'packets': 'packet',
    'pack': 'packet',
    'packs': 'packet',
    'bottle': 'bottle',
    'bottles': 'bottle',
    'can': 'can',
    'cans': 'can',
    'sachet': 'sachet',
    'sachets': 'sachet',
    'piece': 'piece',
    'pieces': 'piece',
    'pcs': 'piece',
    'pc': 'piece',
    'box': 'box',
    'boxes': 'box',
    'unit': 'unit',
    'units': 'unit'
  };

  return unitMap[unit.toLowerCase()] || 'piece';
}

export function parseMultipleProducts(command: string): VoiceProduct[] {
  if (!command) return [];
  
  console.log('Parsing command:', command);
  
  // Clean up the command and standardize format
  const cleanCommand = command
    .toLowerCase()
    .replace(/^\s*(add|add to inventory|create|put|get|buy)\s+/i, '')
    .trim();
    
  // Split by common separators (and, comma)
  const segments = cleanCommand.split(/\s*,\s*|\s+and\s+/);
  
  // Process each segment
  const products: VoiceProduct[] = [];
  
  for (let segment of segments) {
    segment = segment.trim();
    if (!segment) continue;
    
    // Extract quantity and unit
    let quantity = 1;
    let unit = 'piece';
    let position = '';
    let productName = segment;
    
    // Match patterns like "2 kg rice" or "3 bottles of water"
    const quantityPattern = /^(\d+(?:\.\d+)?)\s*(kg|g|kgs|grams|l|ml|liter|litre|packet|packets|pack|packs|bottle|bottles|can|cans|piece|pieces|pcs|pc|box|boxes|unit|units|dozen)s?\s+(?:of\s+)?(.+)$/i;
    const quantityMatch = segment.match(quantityPattern);
    
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = normalizeUnit(quantityMatch[2]);
      productName = quantityMatch[3].trim();
    } else {
      // Try to match plain product name
      const simpleMatch = segment.match(/^([a-z\s]+)$/i);
      if (simpleMatch) {
        productName = simpleMatch[1].trim();
      }
    }
    
    // Extract position if present
    const positionMatch = productName.match(/\s+(?:in|on|at)\s+((?:rack|shelf|section|aisle|row|cabinet|drawer)\s+\w+)/i);
    if (positionMatch) {
      position = positionMatch[1];
      // Remove position from product name
      productName = productName.replace(positionMatch[0], '').trim();
    }
    
    // Further clean product name
    productName = productName
      .replace(/^\s*(some|the)\s+/, '')
      .replace(/\s+(please|thanks|thank you)\s*$/, '')
      .trim();
    
    if (productName) {
      products.push({
        name: productName,
        quantity,
        unit,
        position: position || 'General Storage',
        price: 0,
        image_url: ''
      });
    }
  }
  
  console.log('Parsed products:', products);
  return products;
}

export function detectCommandType(command: string): VoiceCommandResult {
  if (!command) return { type: VOICE_COMMAND_TYPES.UNKNOWN, rawText: '' };
  
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for add product commands
  if (normalizedCommand.includes('add ') || 
      normalizedCommand.match(/^(\d+)\s+([a-z]+)\s+/i) ||
      normalizedCommand.includes('product') || 
      normalizedCommand.includes('get') || 
      normalizedCommand.includes('buy')) {
    
    const products = parseMultipleProducts(command);
    
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: { products },
      rawText: command
    };
  }
  
  // Check for bill commands
  if (normalizedCommand.includes('bill') || 
      normalizedCommand.includes('invoice')) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      rawText: command
    };
  }
  
  // Check for search commands
  if (normalizedCommand.includes('search') || 
      normalizedCommand.includes('find') || 
      normalizedCommand.includes('look for')) {
    
    // Extract search term
    const searchMatch = normalizedCommand.match(/(?:search|find|look\s+for)\s+(.+)/i);
    const searchTerm = searchMatch ? searchMatch[1].trim() : '';
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { searchTerm },
      rawText: command
    };
  }
  
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    rawText: command
  };
}

// Helper functions needed by other components
export function extractProductName(command: string): string {
  const products = parseMultipleProducts(command);
  return products.length > 0 ? products[0].name : '';
}

export function extractBillItems(command: string) {
  return parseMultipleProducts(command);
}

export function validateProductDetails(product: { 
  name: string; 
  quantity?: number; 
  unit?: string;
  position?: string;
}) {
  const missingFields = [];
  
  if (!product.name) missingFields.push('name');
  if (!product.quantity) missingFields.push('quantity');
  if (!product.unit) missingFields.push('unit');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

export interface ShelfCoordinate {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface IdentifyShelvesResult {
  shelfCoordinates: ShelfCoordinate[];
}

export function identifyShelves(imageUrl: string): IdentifyShelvesResult {
  // For now, return a mock implementation with 3 shelves
  return {
    shelfCoordinates: [
      { top: 10, left: 10, width: 80, height: 20 },
      { top: 40, left: 10, width: 80, height: 20 },
      { top: 70, left: 10, width: 80, height: 20 }
    ]
  };
}

export function suggestLocationForProduct(product: string) {
  return 'General Storage';
}
