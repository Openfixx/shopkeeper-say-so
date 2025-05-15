
import Fuse from 'fuse.js';

// Product interface for parsed voice commands
export interface VoiceProduct {
  name: string;
  quantity: number;
  unit?: string;
  position?: string;
  price?: number;
}

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

/**
 * Validate product details
 */
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

/**
 * Suggest a location for a product based on its name
 */
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

/**
 * Parse multiple products from a single voice command
 * Handles commands like "Add 5kg rice, 2kg sugar, and 3 packets of milk"
 */
export const parseMultipleProducts = (command: string, productList: { name: string }[] = []): VoiceProduct[] => {
  const results: VoiceProduct[] = [];
  
  // Clean up the command
  const cleanedCommand = command.replace(/^(add|create|insert|put|place)\s+/i, '').trim();
  
  // Split by common delimiters (comma, and, plus)
  const productSegments = cleanedCommand.split(/,|\s+and\s+|\s+plus\s+|\s+also\s+/i);
  
  // Extract location that might apply to all products
  let generalLocation: string | undefined;
  const locationMatch = command.match(/(on|at|in)\s+(rack|shelf|box|cabinet|fridge|freezer|section|aisle)\s+(\w+)/i);
  
  if (locationMatch) {
    const [, , locationType, locationNumber] = locationMatch;
    generalLocation = `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNumber}`;
  }
  
  // Process each segment as a product with quantity and unit
  productSegments.forEach(segment => {
    const trimmed = segment.trim();
    if (!trimmed) return;
    
    // Match patterns like: "5kg rice", "3 packets of milk", "2 sugar"
    const quantityUnitMatch = trimmed.match(/^(\d+)\s*([a-zA-Z]+)?\s+(?:of\s+)?(.+)$/i) || 
                              trimmed.match(/^(\d+)\s+(.+)$/i);
                              
    if (quantityUnitMatch) {
      const quantity = parseInt(quantityUnitMatch[1], 10);
      
      let unit = 'piece';
      let name = '';
      
      // Check if we have a unit specified
      if (quantityUnitMatch[2] && quantityUnitMatch[3]) {
        // Format: "5kg rice"
        unit = normalizeUnit(quantityUnitMatch[2]);
        name = quantityUnitMatch[3].trim();
      } else {
        // Format: "2 sugar"
        name = quantityUnitMatch[2].trim();
      }
      
      // Match with product list if available
      if (productList.length > 0) {
        const fuse = new Fuse(productList, {
          keys: ['name'],
          threshold: 0.4
        });
        
        const matches = fuse.search(name);
        if (matches.length > 0) {
          name = matches[0].item.name;
        }
      }
      
      // Get location from the segment or use general location
      let position = generalLocation;
      
      // If no general location, suggest one based on product type
      if (!position) {
        position = suggestLocationForProduct(name);
      }
      
      results.push({
        name,
        quantity,
        unit,
        position
      });
    } else {
      // For segments without clear quantity patterns, try to extract what we can
      const words = trimmed.split(/\s+/);
      
      // Check if first word is a number
      let quantity = 1;
      let name = trimmed;
      
      if (/^\d+$/.test(words[0])) {
        quantity = parseInt(words[0], 10);
        name = words.slice(1).join(' ');
      }
      
      results.push({
        name,
        quantity,
        unit: 'piece',
        position: generalLocation || suggestLocationForProduct(name)
      });
    }
  });
  
  return results;
};

/**
 * Normalize unit name to standard format
 */
function normalizeUnit(unit: string): string {
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
}
