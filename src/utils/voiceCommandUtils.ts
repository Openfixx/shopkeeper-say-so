
import { VoiceProduct, VoiceCommandResult, VOICE_COMMAND_TYPES } from '@/types/voice';

// Normalize unit to standard form
export function normalizeUnit(unit: string): string {
  // Convert to lowercase for consistent comparison
  const lcUnit = unit.toLowerCase();
  
  // Weight units
  if (/^(kg|kgs|kilo|kilos|kilogram|kilograms)$/.test(lcUnit)) {
    return 'kg';
  }
  if (/^(g|gram|grams|gm|gms)$/.test(lcUnit)) {
    return 'g';
  }
  
  // Volume units
  if (/^(l|liter|litre|liters|litres)$/.test(lcUnit)) {
    return 'liter';
  }
  if (/^(ml|milliliter|millilitre|milliliters|millilitres)$/.test(lcUnit)) {
    return 'ml';
  }
  
  // Package units
  if (/^(packet|packets|pack|packs|sachet|sachets)$/.test(lcUnit)) {
    return 'packet';
  }
  if (/^(bottle|bottles|btl|btls)$/.test(lcUnit)) {
    return 'bottle';
  }
  if (/^(can|cans)$/.test(lcUnit)) {
    return 'can';
  }
  if (/^(box|boxes|carton|cartons)$/.test(lcUnit)) {
    return 'box';
  }
  
  // Count units
  if (/^(piece|pieces|pc|pcs|unit|units)$/.test(lcUnit)) {
    return 'piece';
  }
  if (/^(dozen|dozens|doz)$/.test(lcUnit)) {
    return 'dozen';
  }
  
  // Default to piece if unknown
  return 'piece';
}

// Enhanced method to parse multiple products from voice command
export function parseMultipleProducts(command: string): VoiceProduct[] {
  if (!command) return [];
  
  console.log('Parsing command:', command);
  
  // Clean up the command and standardize format
  const cleanCommand = command
    .toLowerCase()
    .replace(/^\s*(add|add to inventory|create|put|get|buy|need)\s+/i, '')
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
    let price = 0;
    
    // Match patterns like "2 kg rice" or "3 bottles of water"
    // Enhanced pattern to capture more variations
    const quantityPattern = /^(\d+(?:\.\d+)?)\s*(kg|g|kgs|grams|l|ml|liter|litre|packet|packets|pack|packs|bottle|bottles|can|cans|piece|pieces|pcs|pc|box|boxes|unit|units|dozen)s?\s+(?:of\s+)?(.+)$/i;
    const quantityMatch = segment.match(quantityPattern);
    
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = normalizeUnit(quantityMatch[2]);
      productName = quantityMatch[3].trim();
    } else {
      // Try to match written numbers like "two packets of sugar"
      const wordNumberPattern = /^(one|two|three|four|five|six|seven|eight|nine|ten)\s+(kg|g|kgs|grams|l|ml|liter|litre|packet|packets|pack|packs|bottle|bottles|can|cans|piece|pieces|pcs|pc|box|boxes|unit|units|dozen)s?\s+(?:of\s+)?(.+)$/i;
      const wordMatch = segment.match(wordNumberPattern);
      
      if (wordMatch) {
        const numberMap: Record<string, number> = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        
        quantity = numberMap[wordMatch[1].toLowerCase()] || 1;
        unit = normalizeUnit(wordMatch[2]);
        productName = wordMatch[3].trim();
      } else {
        // Try to match plain product name
        const simpleMatch = segment.match(/^([a-z\s]+)$/i);
        if (simpleMatch) {
          productName = simpleMatch[1].trim();
        }
      }
    }
    
    // Extract position/location if present
    const positionMatch = productName.match(/\s+(?:in|on|at|from)\s+((?:rack|shelf|section|aisle|row|cabinet|drawer|fridge|freezer|pantry)\s+\w+|(?:kitchen|pantry|bathroom|storage|garage))/i);
    if (positionMatch) {
      position = positionMatch[1].charAt(0).toUpperCase() + positionMatch[1].slice(1);
      // Remove position from product name
      productName = productName.replace(positionMatch[0], '').trim();
    }
    
    // Extract price if present
    const priceMatch = productName.match(/\s+(?:at|for|price|costing|worth|value)\s+(\d+(?:\.\d+)?)\s*(?:dollars|rupees|Rs\.?|$)/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
      productName = productName.replace(priceMatch[0], '').trim();
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
        price,
        image_url: ''
      });
    }
  }
  
  console.log('Parsed products:', products);
  return products;
}

// Detect command type from voice input
export function detectCommandType(command: string): VoiceCommandResult {
  if (!command) return { type: VOICE_COMMAND_TYPES.UNKNOWN, rawText: '' };
  
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for add product commands
  if (normalizedCommand.includes('add ') || 
      normalizedCommand.match(/^(\d+)\s+([a-z]+)\s+/i) ||
      normalizedCommand.includes('product') || 
      normalizedCommand.includes('get') || 
      normalizedCommand.includes('buy') ||
      normalizedCommand.includes('need')) {
    
    const products = parseMultipleProducts(command);
    
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: { products },
      rawText: command
    };
  }
  
  // Check for bill commands
  if (normalizedCommand.includes('bill') || 
      normalizedCommand.includes('invoice') ||
      normalizedCommand.includes('receipt')) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      rawText: command
    };
  }
  
  // Check for search commands
  if (normalizedCommand.includes('search') || 
      normalizedCommand.includes('find') || 
      normalizedCommand.includes('look for') ||
      normalizedCommand.includes('where is')) {
    
    // Extract search term
    const searchMatch = normalizedCommand.match(/(?:search|find|look\s+for|where\s+is)\s+(.+)/i);
    const searchTerm = searchMatch ? searchMatch[1].trim() : '';
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { searchTerm },
      rawText: command
    };
  }
  
  // Check for remove product commands
  if (normalizedCommand.includes('remove') || 
      normalizedCommand.includes('delete') ||
      normalizedCommand.includes('take out')) {
    
    // Attempt to extract product name from removal command
    const removeMatch = normalizedCommand.match(/(?:remove|delete|take\s+out)\s+(.+)/i);
    const productName = removeMatch ? removeMatch[1].trim() : '';
    
    return {
      type: VOICE_COMMAND_TYPES.REMOVE_PRODUCT,
      data: { 
        products: productName ? [{ name: productName, quantity: 1, unit: 'piece' }] : []
      },
      rawText: command
    };
  }
  
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    rawText: command
  };
}

// Extract product name from command
export function extractProductName(command: string): string {
  const products = parseMultipleProducts(command);
  return products.length > 0 ? products[0].name : '';
}

// Extract bill items from command
export function extractBillItems(command: string): VoiceProduct[] {
  return parseMultipleProducts(command);
}

// Extract product details from command
export async function extractProductDetails(command: string): Promise<VoiceProduct> {
  // Parse the command to extract product details
  const products = parseMultipleProducts(command);
  
  if (products.length > 0) {
    return products[0]; // Return the first product found
  }
  
  // Return a default product if none was found
  return {
    name: '',
    quantity: 0,
    unit: 'piece',
    position: '',
    price: 0,
    image_url: ''
  };
}

// Process billing voice command
export function processBillingVoiceCommand(command: string): VoiceProduct[] {
  if (!command) return [];
  
  console.log('Processing billing command:', command);
  
  // Clean up the command for billing purposes
  const cleanCommand = command
    .toLowerCase()
    .replace(/^\s*(add|bill|create|invoice|add to bill)\s+/i, '')
    .trim();
    
  return parseMultipleProducts(cleanCommand);
}

// Validate product details
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
  // Simple map of products to suggested locations
  const suggestions: Record<string, string> = {
    'rice': 'Pantry',
    'sugar': 'Pantry',
    'flour': 'Pantry',
    'salt': 'Kitchen',
    'milk': 'Refrigerator',
    'butter': 'Refrigerator',
    'yogurt': 'Refrigerator',
    'cheese': 'Refrigerator',
    'eggs': 'Refrigerator',
    'bread': 'Kitchen',
    'cereal': 'Pantry',
    'pasta': 'Pantry',
    'noodles': 'Pantry',
    'oil': 'Kitchen',
    'vinegar': 'Kitchen',
    'spices': 'Kitchen',
    'canned goods': 'Pantry',
    'frozen': 'Freezer'
  };
  
  // Lookup based on product name
  const lowerProduct = product.toLowerCase();
  for (const [key, location] of Object.entries(suggestions)) {
    if (lowerProduct.includes(key)) {
      return location;
    }
  }
  
  return 'General Storage';
}
