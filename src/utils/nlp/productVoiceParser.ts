
/**
 * Product Voice Command Parser
 * 
 * A specialized NLP engine for processing voice commands related to products
 * in an e-commerce or inventory management context.
 */

import Fuse from 'fuse.js';
import { levenshtein } from './levenshteinDistance';

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

// Common product words to help with extraction
const PRODUCT_INDICATORS = ["product", "item", "goods", "merchandise", "stock"];

// Intent classification keywords
const INTENT_KEYWORDS = {
  add_product: [
    "add", "create", "new", "insert", "put", "register", "include", "log", "record",
    "enter", "save", "store", "place", "set up", "make", "bring", "stock", "upload"
  ],
  remove_product: [
    "remove", "delete", "take out", "eliminate", "get rid", "discard", "cancel",
    "dispose", "trash", "erase"
  ],
  update_product: [
    "update", "modify", "change", "edit", "alter", "adjust", "revise", "amend",
    "correct"
  ],
  search_product: [
    "search", "find", "look for", "locate", "where is", "show", "check",
    "query", "get", "fetch"
  ]
};

// Interface for product entity
export interface ProductEntity {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  position?: string;
  variant?: {
    size?: string;
    color?: string;
    type?: string;
  };
  confidence: number;
}

// Interface for parsed command result
export interface ParsedVoiceCommand {
  intent: string;
  products: ProductEntity[];
  rawText: string;
  needsClarification?: boolean;
  clarificationOptions?: string[];
  clarificationQuestion?: string;
}

/**
 * Normalize text for processing
 */
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with space
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();
};

/**
 * Detect intent from voice command
 */
export const detectIntent = (text: string): string => {
  const normalizedText = normalizeText(text);
  
  // Check for each intent type
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(normalizedText)) {
        return intent;
      }
    }
  }
  
  // Default to add_product if we detect product-like patterns but no clear intent
  const hasQuantityPattern = /\b\d+\s+(kg|g|l|ml|pcs|box|pack|dozen|bottle|piece|unit)s?\b/i.test(normalizedText);
  if (hasQuantityPattern) {
    return "add_product";
  }
  
  return "unknown";
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
  const quantityUnitPattern = /(\d+(\.\d+)?)\s+(kg|g|l|ml|pcs|box|pack|dozen|bottle|piece|unit|pieces|units|boxes|packs|bottles|kilos?|grams?|liters?)/i;
  const match = text.match(quantityUnitPattern);
  
  if (match) {
    const quantity = parseFloat(match[1]);
    let unit = match[3].toLowerCase();
    
    // Normalize the unit
    for (const [normalizedUnit, variants] of Object.entries(UNITS)) {
      if (variants.some(v => unit.startsWith(v))) {
        unit = normalizedUnit;
        break;
      }
    }
    
    return { quantity, unit };
  }
  
  // Try to find number words followed by units
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const numberInfo = extractNumber(words[i]);
    if (numberInfo) {
      // Check if the next word is a unit
      const potentialUnit = words[i+1];
      for (const [normalizedUnit, variants] of Object.entries(UNITS)) {
        if (variants.some(v => potentialUnit.startsWith(v)) || potentialUnit.startsWith(normalizedUnit)) {
          return {
            quantity: numberInfo.value,
            unit: normalizedUnit
          };
        }
      }
    }
  }
  
  // If we found a number but no unit, assume "pieces"
  const numberInfo = extractNumber(text);
  if (numberInfo) {
    return {
      quantity: numberInfo.value,
      unit: "pcs"
    };
  }
  
  return null;
};

/**
 * Extract product variants (size, color)
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
    "tiny", "huge", "big"
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
 * Extract product details from text segment
 */
const extractProductDetails = (
  text: string,
  productList: { name: string }[]
): ProductEntity | null => {
  // Extract quantity and unit
  const quantityAndUnit = extractQuantityAndUnit(text);
  
  // Clean the text by removing intent keywords
  let cleanedText = text.toLowerCase();
  for (const keywords of Object.values(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      cleanedText = cleanedText.replace(new RegExp(`\\b${keyword}\\b`, 'i'), ' ');
    }
  }
  
  // Remove quantity and unit information
  if (quantityAndUnit) {
    cleanedText = cleanedText
      .replace(new RegExp(`\\b${quantityAndUnit.quantity}\\b`, 'g'), ' ')
      .replace(new RegExp(`\\b${quantityAndUnit.unit}\\b`, 'i'), ' ');
      
    // Also try to remove variant forms of the unit
    for (const variants of Object.values(UNITS)) {
      for (const variant of variants) {
        cleanedText = cleanedText.replace(new RegExp(`\\b${variant}\\b`, 'i'), ' ');
      }
    }
  }
  
  // Remove common conjunctions and prepositions
  cleanedText = cleanedText
    .replace(/\b(and|or|with|of|the|a|an|for|to|in|on|at|by|from|this|that|these|those)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  // If we've cleaned too much, return null
  if (cleanedText.length < 2) {
    return null;
  }
  
  // Extract variant information
  const { name: productName, variant } = extractVariants(cleanedText);
  
  // Find best product match
  const { name: matchedName, confidence } = findBestProductMatch(productName, productList);
  
  return {
    name: matchedName,
    quantity: quantityAndUnit?.quantity || 1,
    unit: quantityAndUnit?.unit || "pcs",
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
  for (const keywords of Object.values(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`^\\s*${keyword}\\s+`, 'i');
      cleanedText = cleanedText.replace(regex, '');
    }
  }
  
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
const needsClarification = (products: ProductEntity[]): { 
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
 * Parse voice command into structured data
 */
export const parseProductVoiceCommand = (
  command: string,
  productList: { name: string }[]
): ParsedVoiceCommand => {
  // Detect intent
  const intent = detectIntent(command);
  
  // Basic validation
  if (!command || command.trim().length === 0) {
    return {
      intent: "unknown",
      products: [],
      rawText: command
    };
  }
  
  // Split into product segments
  const segments = splitIntoProductSegments(command);
  
  // Extract products from each segment
  const products: ProductEntity[] = [];
  
  for (const segment of segments) {
    const product = extractProductDetails(segment, productList);
    if (product) {
      products.push(product);
    }
  }
  
  // Check if clarification is needed
  const { needsClarification: needsClarity, productIndex } = needsClarification(products);
  
  if (needsClarity && productIndex >= 0) {
    const options = generateClarificationOptions(products[productIndex].name, productList);
    
    return {
      intent,
      products,
      rawText: command,
      needsClarification: true,
      clarificationOptions: options,
      clarificationQuestion: `Did you mean ${options.join(', ')} or something else?`
    };
  }
  
  return {
    intent,
    products,
    rawText: command
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
  const parsedCommand = parseProductVoiceCommand(command, productList);
  
  // Validate against inventory if provided
  if (inventory && inventory.length > 0) {
    return validateProducts(parsedCommand, inventory);
  }
  
  return parsedCommand;
};
