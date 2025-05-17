import Fuse from 'fuse.js';
import { VoiceProduct, VOICE_COMMAND_TYPES, CommandResult } from '@/types/voice';

// Common product locations for suggestions
const PRODUCT_LOCATIONS = {
  'rice': 'Rack 2',
  'sugar': 'Rack 1',
  'flour': 'Rack 2',
  'milk': 'Fridge',
  'oil': 'Rack 3',
  'salt': 'Rack 1',
  'spice': 'Rack 4',
  'vegetable': 'Fridge',
  'fruit': 'Fridge',
  'bread': 'Shelf 1',
  'biscuit': 'Shelf 2',
  'cookie': 'Shelf 2',
  'chocolate': 'Shelf 3',
  'candy': 'Shelf 3',
  'snack': 'Shelf 2'
};

// Export all required functions
export const validateProductDetails = (product: {
  name?: string;
  quantity?: number;
  unit?: string;
  position?: string;
  price?: number;
}) => {
  const missingFields = [];

  if (!product.name) {
    missingFields.push('product name');
  }

  if (!product.quantity || product.quantity <= 0) {
    missingFields.push('quantity');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

export const suggestLocationForProduct = (productName: string): string => {
  // Convert to lowercase for matching
  const lowerName = productName.toLowerCase();
  
  // Check for direct matches with product types
  for (const [product, location] of Object.entries(PRODUCT_LOCATIONS)) {
    if (lowerName.includes(product)) {
      return location;
    }
  }
  
  // Default location if no match found
  return 'General Storage';
};

// Improved multi-product parser that better handles complex sentence structures
export const parseMultipleProducts = (command: string, productList: { name: string }[] = []): VoiceProduct[] => {
  const results: VoiceProduct[] = [];
  
  // Clean up the command and remove leading action words
  const cleanedCommand = command.replace(/^(add|create|insert|put|place)\s+/i, '').trim();
  
  // Extract global location that might apply to all products
  let globalLocation: string | undefined;
  const locationMatch = command.match(/(on|at|in)\s+(rack|shelf|box|cabinet|fridge|freezer|section|aisle)\s+(\w+)/i);
  
  if (locationMatch) {
    const [, preposition, locationType, locationNumber] = locationMatch;
    globalLocation = `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNumber}`;
  }
  
  // First try to split by common delimiters for multiple products
  const productSegments = cleanedCommand.split(/\s*,\s*|\s+and\s+|\s+plus\s+|\s+also\s+|\s+with\s+/i);
  
  // Process each segment as a potential product with quantity and unit
  productSegments.forEach(segment => {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) return;
    
    // Dictionary for word numbers
    const wordNumbers: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    // Try different patterns to extract product info
    let quantity = 1; // Default quantity
    let unit = 'piece'; // Default unit
    let name = '';
    
    // Pattern 1: "<number><unit> <product>" (e.g., "5kg rice")
    const pattern1 = trimmedSegment.match(/^(\d+)\s*([a-zA-Z]+)\s+([a-zA-Z\s]+)$/i);
    
    // Pattern 2: "<number> <unit> of <product>" (e.g., "5 packets of milk")
    const pattern2 = trimmedSegment.match(/^(\d+)\s+([a-zA-Z]+)(?:\s+of)?\s+([a-zA-Z\s]+)$/i);
    
    // Pattern 3: "<word_number> <unit> <product>" (e.g., "two packet salt")
    const pattern3 = trimmedSegment.match(/^(one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z]+)(?:\s+of)?\s+([a-zA-Z\s]+)$/i);
    
    // Pattern 4: "<product> <number><unit>" (e.g., "rice 5kg")
    const pattern4 = trimmedSegment.match(/^([a-zA-Z\s]+)\s+(\d+)\s*([a-zA-Z]+)$/i);
    
    // Pattern 5: "<product> <word_number> <unit>" (e.g., "salt two packet")
    const pattern5 = trimmedSegment.match(/^([a-zA-Z\s]+)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z]+)$/i);
    
    // Pattern 6: just "<number> <product>" (e.g., "5 rice")
    const pattern6 = trimmedSegment.match(/^(\d+)\s+([a-zA-Z\s]+)$/i);
    
    // Pattern 7: just "<word_number> <product>" (e.g., "two rice")
    const pattern7 = trimmedSegment.match(/^(one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z\s]+)$/i);
    
    if (pattern1) {
      quantity = parseInt(pattern1[1], 10);
      unit = normalizeUnit(pattern1[2]);
      name = pattern1[3].trim();
    } else if (pattern2) {
      quantity = parseInt(pattern2[1], 10);
      unit = normalizeUnit(pattern2[2]);
      name = pattern2[3].trim();
    } else if (pattern3) {
      quantity = wordNumbers[pattern3[1].toLowerCase()];
      unit = normalizeUnit(pattern3[2]);
      name = pattern3[3].trim();
    } else if (pattern4) {
      name = pattern4[1].trim();
      quantity = parseInt(pattern4[2], 10);
      unit = normalizeUnit(pattern4[3]);
    } else if (pattern5) {
      name = pattern5[1].trim();
      quantity = wordNumbers[pattern5[2].toLowerCase()];
      unit = normalizeUnit(pattern5[3]);
    } else if (pattern6) {
      quantity = parseInt(pattern6[1], 10);
      name = pattern6[2].trim();
    } else if (pattern7) {
      quantity = wordNumbers[pattern7[1].toLowerCase()];
      name = pattern7[2].trim();
    } else {
      // If no pattern matches, use the whole segment as the name
      name = trimmedSegment;
    }
    
    // If we have a product list, try to match the extracted name with it
    if (productList.length > 0 && name) {
      const fuse = new Fuse(productList, {
        keys: ['name'],
        threshold: 0.4,  // Lower threshold for stricter matching
        includeScore: true
      });
      
      const matches = fuse.search(name);
      if (matches.length > 0) {
        name = matches[0].item.name;
      }
    }
    
    // Extract location specific to this segment if mentioned
    let position: string | undefined;
    const segmentLocationMatch = trimmedSegment.match(/(on|at|in)\s+(rack|shelf|box|cabinet|fridge|freezer|section|aisle)\s+(\w+)/i);
    
    if (segmentLocationMatch) {
      const [, preposition, locationType, locationNumber] = segmentLocationMatch;
      position = `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNumber}`;
    } else {
      // If no specific location, use the global location or suggest one
      position = globalLocation || suggestLocationForProduct(name);
    }
    
    // Clean up product name by removing location information
    name = name.replace(/(on|at|in)\s+(rack|shelf|box|cabinet|fridge|freezer|section|aisle)\s+\w+/i, '').trim();
    
    // Add the product to results
    results.push({
      name,
      quantity,
      unit, // Now unit is always defined
      position,
      image_url: '' // Initialize with empty string to match interface
    });
  });
  
  return results;
};

// Export normalizeUnit to fix lib/voice.ts error
export const normalizeUnit = (unit: string): string => {
  const lowerUnit = unit.toLowerCase();
  
  // Common unit mappings
  const unitMap: Record<string, string> = {
    'kg': 'kg',
    'kilo': 'kg',
    'kilos': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'l': 'liter',
    'ltr': 'liter',
    'litre': 'liter',
    'litres': 'liter',
    'liter': 'liter',
    'liters': 'liter',
    'ml': 'ml',
    'milliliter': 'ml',
    'millilitre': 'ml',
    'packet': 'packet',
    'pack': 'packet',
    'packets': 'packet',
    'packs': 'packet',
    'bottle': 'bottle',
    'bottles': 'bottle',
    'pcs': 'piece',
    'pc': 'piece',
    'piece': 'piece',
    'pieces': 'piece',
    'unit': 'piece',
    'units': 'piece',
    'box': 'box',
    'boxes': 'box',
    'carton': 'box',
    'cartons': 'box'
  };
  
  return unitMap[lowerUnit] || unit;
};

export const extractBillItems = (command: string) => {
  // We'll use our existing parser and convert the result to the format expected by BillingDialog
  const products = parseMultipleProducts(command);
  return products.map(product => ({
    name: product.name,
    quantity: product.quantity
  }));
};

export const processBillingVoiceCommand = (command: string) => {
  const commandType = detectCommandType(command);
  return {
    type: commandType.type,
    items: extractBillItems(command)
  };
};

export const detectCommandType = (command: string) => {
  const lowerCommand = command.toLowerCase();
  
  // Check for billing patterns
  if (/bill|invoice|checkout|receipt|payment|total|calculate|finalize|complete|sale|purchase/i.test(lowerCommand)) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: {
        items: extractBillItems(command)
      }
    };
  }
  
  // Check for add product patterns
  if (/add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock/i.test(lowerCommand)) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: {
        items: extractBillItems(command)
      }
    };
  }
  
  // Check for remove product patterns
  if (/remove|delete|take out|eliminate|get rid|discard|cancel|dispose|trash|erase/i.test(lowerCommand)) {
    return {
      type: VOICE_COMMAND_TYPES.REMOVE_PRODUCT,
      data: {
        items: extractBillItems(command)
      }
    };
  }
  
  // Check for search product patterns
  if (/search|find|look for|locate|where is|show me|check|query|get|fetch/i.test(lowerCommand)) {
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: {
        items: extractBillItems(command)
      }
    };
  }
  
  // Default to unknown
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    data: null
  };
};

export const extractProductDetails = (command: string) => {
  const products = parseMultipleProducts(command);
  return products.length > 0 ? products[0] : null;
};

// Update the identifyShelves function to include shelfCoordinates
export const identifyShelves = (imageUrl: string) => {
  // Mock implementation for shelf detection based on image
  // In a real implementation, this would use computer vision to identify shelves
  
  // Create mock shelf coordinates based on a typical shelf layout
  const mockCoordinates = [
    { top: 10, left: 5, width: 90, height: 15 },
    { top: 30, left: 5, width: 90, height: 15 },
    { top: 50, left: 5, width: 90, height: 15 },
    { top: 70, left: 5, width: 90, height: 15 }
  ];
  
  // Check if we have a specific shelf mention in the command
  const shelfMatch = imageUrl.match(/(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s*(\d+|[a-z])/i);
  
  if (shelfMatch) {
    const shelfType = shelfMatch[1].charAt(0).toUpperCase() + shelfMatch[1].slice(1).toLowerCase();
    const shelfNumber = shelfMatch[2];
    
    return {
      type: shelfType,
      number: shelfNumber,
      label: `${shelfType} ${shelfNumber}`,
      shelfCoordinates: mockCoordinates // Add shelfCoordinates to the return value
    };
  }
  
  // Default return with coordinates
  return {
    type: "Generic",
    number: "1",
    label: "Generic Shelf",
    shelfCoordinates: [{ top: 0, left: 0, width: 0, height: 0 }] // Add default value
  };
};
