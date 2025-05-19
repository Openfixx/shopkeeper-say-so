
import Fuse from 'fuse.js';

export interface EnhancedProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  position?: string;
  expiry?: string;
  category?: string;
}

// Define product language data
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  "coca-cola": ["coke", "cola", "soda", "soft drink", "coke bottle"],
  "pepsi": ["pepsi cola", "blue cola", "blue soda"],
  "rice": ["basmati rice", "jasmine rice", "white rice", "brown rice"],
  "milk": ["dairy milk", "cow milk", "soy milk", "almond milk", "oat milk"],
  "bread": ["loaf", "bun", "roll", "toast"],
  "flour": ["all-purpose flour", "wheat flour", "maida", "atta"],
  "apple": ["red apple", "green apple", "fruit"],
  "banana": ["yellow banana", "fruit"],
  "sugar": ["white sugar", "brown sugar", "sweetener"],
  "salt": ["table salt", "sea salt", "rock salt"],
  "oil": ["cooking oil", "vegetable oil", "olive oil", "sunflower oil"],
  "butter": ["dairy butter", "margarine", "spread"],
  "cheese": ["cheddar", "mozzarella", "dairy product"]
};

// Define units for quantity measurement
const UNITS: Record<string, string[]> = {
  "kg": ["kilograms", "kilos", "kgs", "kilogram"],
  "g": ["grams", "gram", "gm", "gs"],
  "l": ["liters", "litres", "ltr", "ltrs", "lt", "lts"],
  "ml": ["milliliters", "millilitres", "millilit"],
  "pcs": ["pieces", "piece", "pc", "pcs", "units", "unit"],
  "box": ["boxes", "bx", "bxs"],
  "pack": ["packs", "packet", "packets"],
  "dozen": ["dozens", "doz"],
  "bottle": ["bottles", "btl", "btls"]
};

// Extract product name from text
const extractProductName = (text: string, productList: { name: string }[]): { name: string; confidence: number } => {
  // Normalize text
  const normalizedText = text.toLowerCase().trim();
  
  // First check for exact matches in product list
  for (const product of productList) {
    if (product.name.toLowerCase() === normalizedText) {
      return { name: product.name, confidence: 1.0 };
    }
  }
  
  // Then check product synonyms
  for (const [canonicalName, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
    if (synonyms.includes(normalizedText)) {
      // Check if canonical name is in our product list
      const matchedProduct = productList.find(p => 
        p.name.toLowerCase() === canonicalName.toLowerCase()
      );
      
      if (matchedProduct) {
        return { name: matchedProduct.name, confidence: 0.9 };
      }
      return { name: canonicalName, confidence: 0.8 };
    }
  }
  
  // Use fuzzy search as fallback
  const fuse = new Fuse(productList, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true
  });
  
  const results = fuse.search(normalizedText);
  
  if (results.length > 0) {
    // Convert Fuse score to confidence
    const confidence = 1 - (results[0].score || 0.5);
    return { 
      name: results[0].item.name,
      confidence 
    };
  }
  
  // Return original text if no match found
  return { name: normalizedText, confidence: 0.5 };
};

// Extract quantity and unit from text
const extractQuantityAndUnit = (text: string): { quantity: number; unit: string } | null => {
  // Match patterns like "5 kg", "5kg", "5 kilograms", etc.
  const quantityRegex = /(\d+(?:\.\d+)?)\s*([a-z]+)?/i;
  const match = text.match(quantityRegex);
  
  if (match) {
    const quantity = parseFloat(match[1]);
    let unit = (match[2] || '').toLowerCase();
    
    // Normalize unit
    for (const [normalizedUnit, variants] of Object.entries(UNITS)) {
      if (unit === normalizedUnit || variants.some(v => unit === v || unit.startsWith(v))) {
        unit = normalizedUnit;
        break;
      }
    }
    
    // Default to pieces if no recognized unit
    if (!Object.keys(UNITS).includes(unit)) {
      unit = 'pcs';
    }
    
    return { quantity, unit };
  }
  
  return null;
};

// Extract price from text
const extractPrice = (text: string): number | null => {
  // Match price patterns like "$5", "5 dollars", "5.99"
  const priceRegex = /\$?(\d+(?:\.\d+)?)\s*(?:dollars?|usd|each|per)?/i;
  const match = text.match(priceRegex);
  
  if (match) {
    return parseFloat(match[1]);
  }
  
  return null;
};

// Extract location from text
const extractLocation = (text: string): string | null => {
  // Match location patterns in parentheses or after "at", "in", "on", "shelf"
  const locationRegex = /(?:\(([^)]+)\))|(?:(?:at|in|on|shelf)\s+([a-z0-9\s]+))/i;
  const match = text.match(locationRegex);
  
  if (match) {
    return (match[1] || match[2]).trim();
  }
  
  return null;
};

// Split input text into product segments
const splitIntoProductSegments = (text: string): string[] => {
  // Remove common command prefixes
  const cleanedText = text
    .replace(/^(?:add|create|put|place|get|make)\s+/i, '')
    .trim();
  
  // Split by common separators
  return cleanedText
    .split(/,|;|and\s+|\s+and|\s+also|\s+plus|\s+as well as|\s+together with|\s+along with|\s+with|\s+\+/i)
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0);
};

// Interface for parsing result
export interface ParseResult {
  products: EnhancedProduct[];
  rawText: string;
}

// Main parser function
export const parseEnhancedVoiceCommand = (
  text: string,
  productList: { name: string }[]
): ParseResult => {
  const segments = splitIntoProductSegments(text);
  const products: EnhancedProduct[] = [];
  
  for (const segment of segments) {
    // Extract product details from each segment
    const { name } = extractProductName(segment, productList);
    const quantityInfo = extractQuantityAndUnit(segment);
    const price = extractPrice(segment);
    const position = extractLocation(segment);
    
    // Create product object
    const product: EnhancedProduct = {
      name,
      quantity: quantityInfo?.quantity || 1,
      unit: quantityInfo?.unit || 'pcs',
      price: price || undefined,
      position: position || undefined
    };
    
    products.push(product);
  }
  
  return {
    products,
    rawText: text
  };
};
