
/**
 * Enhanced Product Parser
 * A robust system for parsing product information from voice commands
 * with support for expiry dates, locations, and advanced NLP features
 */

import { extractLocation } from './locationParser';
import { extractExpiryDate } from './dateParser';
import { levenshtein } from './levenshteinDistance';
import { detectCommandIntent, CommandIntent, extractBillOptions, isMultiProductCommand } from './commandTypeDetector';
import Fuse from 'fuse.js';

// Product entity interface with enhanced features
export interface EnhancedProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  position?: string;  // Storage location
  expiry?: string;    // Expiry date in YYYY-MM-DD format
  variant?: {
    size?: string;
    color?: string;
    type?: string;
  };
  confidence: number;
}

// Voice command parsing result interface
export interface ParsedVoiceCommand {
  intent: CommandIntent;
  products: EnhancedProduct[];
  rawText: string;
  billOptions?: Record<string, any>;
  needsClarification?: boolean;
  clarificationOptions?: string[];
  clarificationQuestion?: string;
  detectedLocation?: string;
}

// Dictionary for product synonyms
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  "coca-cola": ["coke", "cola", "soda", "soft drink", "coke bottle"],
  "pepsi": ["pepsi cola", "blue cola", "blue soda"],
  "rice": ["basmati rice", "jasmine rice", "white rice", "brown rice"],
  "milk": ["dairy milk", "cow milk", "soy milk", "almond milk", "oat milk"],
  "bread": ["loaf", "bun", "roll", "toast", "bread loaf", "sliced bread"],
  "flour": ["all-purpose flour", "wheat flour", "maida", "atta"],
  "apple": ["red apple", "green apple", "fruit"],
  "banana": ["yellow banana", "fruit"],
  "sugar": ["white sugar", "brown sugar", "sweetener"],
  "salt": ["table salt", "sea salt", "rock salt"],
  "oil": ["cooking oil", "vegetable oil", "olive oil", "sunflower oil"],
  "butter": ["dairy butter", "margarine", "spread"],
  "cheese": ["cheddar", "mozzarella", "dairy product"]
};

// Unit standardization mapping
const UNIT_MAPPING: Record<string, string> = {
  "kg": "kg",
  "kgs": "kg",
  "kilos": "kg",
  "kilogram": "kg",
  "kilograms": "kg",
  "g": "g",
  "gram": "g",
  "grams": "g",
  "l": "l",
  "liter": "l",
  "liters": "l",
  "litre": "l",
  "litres": "l",
  "ml": "ml",
  "milliliter": "ml",
  "milliliters": "ml",
  "millilitre": "ml",
  "millilitres": "ml",
  "piece": "pc",
  "pieces": "pc",
  "pc": "pc",
  "pcs": "pc",
  "unit": "unit",
  "units": "unit",
  "pack": "pack",
  "packs": "pack",
  "packet": "pack",
  "packets": "pack",
  "box": "box",
  "boxes": "box",
  "bottle": "bottle",
  "bottles": "bottle",
  "carton": "carton",
  "cartons": "carton",
  "dozen": "dozen",
  "dozens": "dozen"
};

/**
 * Process and normalize a unit string
 * @param unit The unit string to normalize
 * @returns Normalized unit string
 */
const normalizeUnit = (unit: string): string => {
  if (!unit) return 'unit';
  
  const lowercaseUnit = unit.toLowerCase().trim();
  return UNIT_MAPPING[lowercaseUnit] || lowercaseUnit;
};

/**
 * Extract numbers including word representations
 */
const extractNumber = (text: string): { value: number, original: string } | null => {
  // Dictionary for number words
  const numberWords: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100
  };
  
  // Try to match a digit
  const digitMatch = text.match(/\b(\d+(\.\d+)?)\b/);
  if (digitMatch) {
    return {
      value: parseFloat(digitMatch[1]),
      original: digitMatch[1]
    };
  }
  
  // Try to match number words
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (numberWords[word] !== undefined) {
      return {
        value: numberWords[word],
        original: word
      };
    }
  }
  
  return null;
};

/**
 * Extract quantity and unit from text
 */
const extractQuantityAndUnit = (text: string): { quantity: number; unit: string; } | null => {
  // First try the pattern "X units"
  const quantityUnitPattern = /(\d+(\.\d+)?)\s+(kg|g|l|ml|pc|pcs|piece|pieces|unit|units|pack|packs|box|boxes|bottle|bottles|carton|cartons|dozen|dozens|kilos?|grams?|liters?|litres?)/i;
  const match = text.match(quantityUnitPattern);
  
  if (match) {
    const quantity = parseFloat(match[1]);
    let unit = match[3].toLowerCase();
    
    return { quantity, unit: normalizeUnit(unit) };
  }
  
  // Try to find number words followed by units
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const numberInfo = extractNumber(words[i]);
    if (numberInfo) {
      // Check if the next word is a unit
      const potentialUnit = words[i+1];
      if (UNIT_MAPPING[potentialUnit]) {
        return {
          quantity: numberInfo.value,
          unit: normalizeUnit(potentialUnit)
        };
      }
    }
  }
  
  // If we found a number but no unit, assume "pieces"
  const numberInfo = extractNumber(text);
  if (numberInfo) {
    return {
      quantity: numberInfo.value,
      unit: "pc"
    };
  }
  
  return null;
};

/**
 * Extract product price
 */
const extractPrice = (text: string): number | undefined => {
  // Patterns for price extraction
  const pricePatterns = [
    // With currency symbol
    /(?:price|cost|at|for|worth|valued at)\s*(?:₹|rs|rupees|inr)?\s*(\d+(?:\.\d+)?)/i,
    /(?:₹|rs|rupees|inr)\s*(\d+(?:\.\d+)?)/i,
    // With currency mention after
    /(\d+(?:\.\d+)?)\s*(?:₹|rs|rupees|inr)\b/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  return undefined;
};

/**
 * Extract product variants (size, color, type)
 */
const extractVariants = (productName: string): { 
  name: string; 
  variant: { size?: string; color?: string; type?: string; }; 
} => {
  const colors = [
    "red", "blue", "green", "yellow", "black", "white", "purple", "orange", 
    "pink", "brown", "gray", "grey", "silver", "gold"
  ];
  
  const sizes = [
    "small", "medium", "large", "xl", "xxl", "xs", "extra large", "extra small",
    "tiny", "huge", "big", "regular", "family size", "king size", "mini"
  ];
  
  const types = [
    "organic", "fresh", "frozen", "canned", "dried", "packaged", "processed",
    "raw", "cooked", "baked", "fried", "grilled", "steamed", "broiled",
    "premium", "regular", "lite", "light", "diet", "fat-free", "low-fat",
    "whole", "half", "quarter"
  ];
  
  const variant: { size?: string; color?: string; type?: string; } = {};
  let cleanedName = productName;
  
  // Check for colors
  for (const color of colors) {
    const colorRegex = new RegExp(`\\b${color}\\b`, 'i');
    if (colorRegex.test(productName)) {
      variant.color = color;
      cleanedName = cleanedName.replace(colorRegex, '');
    }
  }
  
  // Check for sizes
  for (const size of sizes) {
    const sizeRegex = new RegExp(`\\b${size}\\b`, 'i');
    if (sizeRegex.test(productName)) {
      variant.size = size;
      cleanedName = cleanedName.replace(sizeRegex, '');
    }
  }
  
  // Check for types
  for (const type of types) {
    const typeRegex = new RegExp(`\\b${type}\\b`, 'i');
    if (typeRegex.test(productName)) {
      variant.type = type;
      cleanedName = cleanedName.replace(typeRegex, '');
    }
  }
  
  return {
    name: cleanedName.replace(/\s+/g, ' ').trim(),
    variant
  };
};

/**
 * Find the best product match using fuzzy matching
 */
const findBestProductMatch = (
  productName: string,
  productList: { name: string }[],
  threshold = 0.6
): { name: string; confidence: number } => {
  // First check exact match
  const exactMatch = productList.find(p => 
    p.name.toLowerCase() === productName.toLowerCase()
  );
  
  if (exactMatch) {
    return { name: exactMatch.name, confidence: 1.0 };
  }
  
  // Check for synonym match
  for (const [canonicalName, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
    if (synonyms.some(syn => syn.toLowerCase() === productName.toLowerCase())) {
      const matchedProduct = productList.find(p => 
        p.name.toLowerCase() === canonicalName.toLowerCase()
      );
      
      if (matchedProduct) {
        return { name: matchedProduct.name, confidence: 0.9 };
      }
    }
  }
  
  // Use fuzzy matching as a fallback
  const fuse = new Fuse(productList, {
    keys: ['name'],
    threshold: threshold,
    includeScore: true
  });
  
  const result = fuse.search(productName);
  
  if (result.length > 0) {
    // Convert Fuse score (0 is perfect match) to confidence (1 is perfect match)
    const score = result[0].score || 0.5;
    const confidence = 1 - score;
    
    return { 
      name: result[0].item.name,
      confidence: confidence
    };
  }
  
  // If no match is found, just return the original with low confidence
  return { name: productName, confidence: 0.3 };
};

/**
 * Extract clean product text by removing intent, quantity, units, etc.
 */
const extractCleanProductText = (text: string): string => {
  // Remove common command words
  let cleanedText = text.toLowerCase().replace(/^(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\s+/i, '');
  
  // Remove quantities and units
  cleanedText = cleanedText.replace(/\b\d+(\.\d+)?\s*(kg|g|l|ml|pc|pcs|piece|pieces|unit|units|pack|packs|box|boxes|bottle|bottles|carton|cartons|dozen|dozens|kilos?|grams?|liters?|litres?)\b/i, '');
  
  // Remove expiry date mentions
  cleanedText = cleanedText.replace(/\b(?:expir(?:y|ing|es|ed)?|valid\s+(?:until|till)|use\s+by|best\s+before|good\s+(?:until|till)|sell\s+by)\s+[a-z0-9\s,]+\b/i, '');
  
  // Remove location mentions
  cleanedText = cleanedText.replace(/\b(?:in|at|on|from)\s+(?:the)?\s+(?:shelf|aisle|rack|section|storage|store room|back room|warehouse|pantry|fridge|refrigerator|freezer|cooler)\s*(?:number|#|no\.?)?\s*\d*\b/i, '');
  
  // Remove price mentions
  cleanedText = cleanedText.replace(/\b(?:price|cost|at|for|worth|valued at)\s*(?:₹|rs|rupees|inr)?\s*\d+(?:\.\d+)?\b/i, '');
  cleanedText = cleanedText.replace(/\b(?:₹|rs|rupees|inr)\s*\d+(?:\.\d+)?\b/i, '');
  
  // Remove common prepositions and conjunctions
  cleanedText = cleanedText.replace(/\b(and|or|with|of|the|a|an|for|to|in|on|at|by|from|this|that|these|those)\b/gi, ' ');
  
  // Clean up extra spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
};

/**
 * Extract product details from a text segment
 */
const extractProductDetails = (
  text: string,
  productList: { name: string }[]
): EnhancedProduct | null => {
  // Extract quantity and unit
  const quantityAndUnit = extractQuantityAndUnit(text);
  
  // Extract clean product name text
  const cleanProductText = extractCleanProductText(text);
  
  // If we've cleaned too much, return null
  if (cleanProductText.length < 2) {
    return null;
  }
  
  // Extract variant information
  const { name: productName, variant } = extractVariants(cleanProductText);
  
  // Find best product match
  const { name: matchedName, confidence } = findBestProductMatch(productName, productList);
  
  // Extract price information
  const price = extractPrice(text);
  
  // Extract location information
  const position = extractLocation(text);
  
  // Extract expiry date
  const expiry = extractExpiryDate(text);
  
  return {
    name: matchedName,
    quantity: quantityAndUnit?.quantity || 1,
    unit: quantityAndUnit?.unit || "pc",
    price,
    position,
    expiry,
    variant: Object.keys(variant).length > 0 ? variant : undefined,
    confidence
  };
};

/**
 * Split text into potential product segments
 */
const splitIntoProductSegments = (text: string): string[] => {
  // Remove the intent part
  let cleanedText = text;
  
  // Remove common command prefixes
  cleanedText = cleanedText.replace(/^(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\s+/i, '');
  
  // Split by common separators
  const segments = cleanedText
    .split(/,|;|and\s+|\s+and|\s+also|\s+plus|\s+as well as|\s+together with|\s+along with|\s+with|\s+\+/i)
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0);
  
  return segments.length > 0 ? segments : [cleanedText];
};

/**
 * Determine if clarification is needed based on confidence scores
 */
const needsClarification = (products: EnhancedProduct[]): { 
  needsClarification: boolean; 
  productIndex: number; 
} => {
  for (let i = 0; i < products.length; i++) {
    if (products[i].confidence < 0.5) {
      return { needsClarification: true, productIndex: i };
    }
  }
  return { needsClarification: false, productIndex: -1 };
};

/**
 * Generate clarification options for ambiguous products
 */
const generateClarificationOptions = (
  productName: string,
  productList: { name: string }[]
): string[] => {
  // Use fuzzy search to find similar products
  const fuse = new Fuse(productList, {
    keys: ['name'],
    threshold: 0.6,
    includeScore: true
  });
  
  const results = fuse.search(productName);
  
  // Take top 3 results for clarification
  return results
    .slice(0, 3)
    .map(result => result.item.name);
};

/**
 * Parse voice command into structured data with enhanced features
 */
export const parseEnhancedVoiceCommand = (
  command: string,
  productList: { name: string }[]
): ParsedVoiceCommand => {
  // Detect intent
  const intent = detectCommandIntent(command);
  
  // Basic validation
  if (!command || command.trim().length === 0) {
    return {
      intent: CommandIntent.UNKNOWN,
      products: [],
      rawText: command
    };
  }
  
  // For bill generation commands, return bill intent with options
  if (intent === CommandIntent.GENERATE_BILL) {
    const billOptions = extractBillOptions(command);
    
    return {
      intent,
      products: [],
      rawText: command,
      billOptions
    };
  }
  
  // For product-related intents, extract product information
  const products: EnhancedProduct[] = [];
  
  // Check if it's a multi-product command
  if (isMultiProductCommand(command)) {
    // Split into product segments
    const segments = splitIntoProductSegments(command);
    
    // Extract products from each segment
    for (const segment of segments) {
      const product = extractProductDetails(segment, productList);
      if (product) {
        products.push(product);
      }
    }
  } else {
    // Single product command
    const product = extractProductDetails(command, productList);
    if (product) {
      products.push(product);
    }
  }
  
  // Check if clarification is needed for any product
  const { needsClarification: needsClarity, productIndex } = needsClarification(products);
  
  if (needsClarity && productIndex >= 0) {
    const options = generateClarificationOptions(products[productIndex].name, productList);
    
    return {
      intent,
      products,
      rawText: command,
      needsClarification: true,
      clarificationOptions: options,
      clarificationQuestion: `Did you mean ${options.join(', ')} or something else?`,
      detectedLocation: products.find(p => p.position)?.position
    };
  }
  
  // Find any detected location from all products
  const detectedLocation = products.find(p => p.position)?.position;
  
  return {
    intent,
    products,
    rawText: command,
    detectedLocation
  };
};

/**
 * Validate products against inventory
 */
export const validateProducts = (
  parsedCommand: ParsedVoiceCommand,
  inventory: { name: string; quantity: number }[]
): ParsedVoiceCommand => {
  // Mark products that are not in inventory
  const validatedProducts = parsedCommand.products.map(product => {
    const inventoryItem = inventory.find(item => 
      item.name.toLowerCase() === product.name.toLowerCase()
    );
    
    if (!inventoryItem) {
      return {
        ...product,
        confidence: 0, // Mark as invalid
        notInInventory: true
      };
    }
    
    return product;
  });
  
  // Check if any product needs clarification due to validation
  const invalidProduct = validatedProducts.find(p => p.confidence === 0);
  
  if (invalidProduct) {
    return {
      ...parsedCommand,
      products: validatedProducts,
      needsClarification: true,
      clarificationOptions: [],
      clarificationQuestion: `Product "${invalidProduct.name}" not found in inventory. Would you like to add it as a new product?`
    };
  }
  
  return {
    ...parsedCommand,
    products: validatedProducts
  };
};

/**
 * Process voice command with clarification if needed
 */
export const processVoiceCommand = async (
  command: string,
  productList: { name: string }[],
  inventory?: { name: string; quantity: number }[]
): Promise<ParsedVoiceCommand> => {
  // Parse the command
  const parsedCommand = parseEnhancedVoiceCommand(command, productList);
  
  // Validate against inventory if provided
  if (inventory && inventory.length > 0) {
    return validateProducts(parsedCommand, inventory);
  }
  
  return parsedCommand;
};
