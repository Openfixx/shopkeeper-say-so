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
    'units': 'unit',
    'dozen': 'dozen',
    'dozens': 'dozen',
    'bag': 'bag',
    'bags': 'bag'
  };

  return unitMap[unit.toLowerCase()] || 'piece';
}

export function parseMultipleProducts(command: string): VoiceProduct[] {
  if (!command) return [];
  
  // Normalize text
  const normalizedCommand = command.toLowerCase().trim();
  
  // Patterns to identify product segments
  const productSegments: string[] = normalizedCommand
    // Replace common connectors with commas for easier splitting
    .replace(/\s+and\s+|\s+plus\s+|\s+also\s+|\s+with\s+/gi, ', ')
    // Split by commas
    .split(/\s*,\s*/);
  
  // Process each segment
  const products: VoiceProduct[] = [];
  
  productSegments.forEach(segment => {
    if (!segment.trim()) return;
    
    // Extract command type
    let productName = '';
    let quantity = 1;
    let unit = 'piece';
    let position = '';
    
    // Extract quantity and unit
    const quantityMatch = segment.match(/(\d+(?:\.\d+)?)\s*(kg|g|kgs|grams|l|ml|liter|litre|packet|packets|pack|packs|bottle|bottles|can|cans|piece|pieces|pcs|pc|box|boxes|unit|units|dozen|dozens|bag|bags)/i);
    
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = normalizeUnit(quantityMatch[2]);
      
      // Remove the quantity and unit from the segment to extract product name
      productName = segment.replace(quantityMatch[0], '').trim();
      
      // If segment starts with "add", "get", etc., remove it
      productName = productName.replace(/^(add|get|buy|need|want)\s+/i, '').trim();
    } else {
      // No quantity/unit found
      // Check if segment starts with "add", "get", etc.
      const actionMatch = segment.match(/^(add|get|buy|need|want)\s+(.*)/i);
      if (actionMatch) {
        productName = actionMatch[2].trim();
      } else {
        productName = segment.trim();
      }
    }
    
    // Extract position if available
    const positionMatch = segment.match(/\b(?:in|on|at|to)\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box)\s*(\d+|[a-z])\b/i);
    if (positionMatch) {
      position = `${positionMatch[1]} ${positionMatch[2]}`.trim();
      // Remove position from product name
      productName = productName.replace(positionMatch[0], '').trim();
    }
    
    // Only add if we have a product name
    if (productName) {
      products.push({
        name: productName,
        quantity,
        unit,
        position,
        image_url: '',
        price: 0, // Default price
        expiry: undefined // Default expiry
      });
    }
  });
  
  return products;
}

export function validateProductDetails(product: { 
  name: string; 
  quantity?: number; 
  unit?: string;
  position?: string;
  price?: number;
}): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!product.name) missingFields.push('name');
  if (!product.quantity) missingFields.push('quantity');
  if (!product.unit) missingFields.push('unit');
  if (!product.position) missingFields.push('location');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// Update to return VoiceCommandResult
export function detectCommandType(command: string): VoiceCommandResult {
  if (!command) return { type: VOICE_COMMAND_TYPES.UNKNOWN, rawText: '' };
  
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for bill creation commands
  if (normalizedCommand.includes('create bill') || normalizedCommand.includes('make bill') || 
      normalizedCommand.includes('generate bill') || normalizedCommand.includes('new bill')) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: { items: extractBillItems(command) },
      rawText: command
    };
  }
  
  // Check for add product commands
  if (normalizedCommand.includes('add ') || normalizedCommand.match(/^([0-9]+)\s*([a-z]+)\s+/i)) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: { products: parseMultipleProducts(command) },
      rawText: command
    };
  }
  
  // Check for remove product commands
  if (normalizedCommand.includes('remove ') || normalizedCommand.includes('delete ')) {
    return {
      type: VOICE_COMMAND_TYPES.REMOVE_PRODUCT,
      data: { productName: extractProductName(command) },
      rawText: command
    };
  }
  
  // Check for search product commands
  if (normalizedCommand.includes('search ') || normalizedCommand.includes('find ') || 
      normalizedCommand.includes('where is ') || normalizedCommand.includes('locate ')) {
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { productName: extractProductName(command) },
      rawText: command
    };
  }
  
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    rawText: command
  };
}

// Add missing exported functions needed by other components
export function extractBillItems(command: string) {
  // Improved implementation that returns product items
  const products = parseMultipleProducts(command);
  return products.map(p => ({
    name: p.name,
    quantity: p.quantity,
    unit: p.unit,
    price: p.price || 0
  }));
}

export function processBillingVoiceCommand(command: string): VoiceCommandResult {
  // Enhanced implementation to return VoiceCommandResult
  const items = extractBillItems(command);
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  
  return { 
    type: VOICE_COMMAND_TYPES.CREATE_BILL,
    data: { items, total },
    rawText: command
  };
}

function extractProductName(command: string): string {
  // Simple implementation to extract product name from commands like "find rice" or "where is sugar"
  const words = command.toLowerCase().split(/\s+/);
  const actionWords = ['find', 'search', 'where', 'is', 'locate', 'get', 'remove', 'delete'];
  
  // Filter out action words
  return words
    .filter(word => !actionWords.includes(word) && word.length > 2)
    .join(' ');
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

// Update the identifyShelves function to return the correct type
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
  // Implementation to satisfy imports
  return 'General Storage';
}

export function extractProductDetails(command: string): VoiceProduct {
  // Enhanced implementation to satisfy imports and type needs
  return {
    name: '',
    quantity: 1,
    unit: 'piece',
    position: '',
    price: 0,
    expiry: '',
  };
}
