
import Fuse from 'fuse.js';
import { suggestLocationForProduct } from './voiceCommandUtils';

export interface MultiProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  position?: string;
}

const fuseOptions = {
  keys: ['name'],
  threshold: 0.4,
  ignoreLocation: true,
  findAllMatches: true,
};

/**
 * Extracts just the product name from a command like "add 2 kg rice"
 * focusing only on the main product and ignoring quantity, unit, etc.
 */
const extractProductName = (text: string): string => {
  // First, clean up common command words
  let cleanedText = text.replace(/^(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\s+/i, '');
  
  // Basic pattern for quantity + unit + product name
  const quantityPattern = /^\d+(\.\d+)?\s+(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles|can|cans|sachet|sachets)\s+/i;
  
  // Clean up quantity and unit if present
  cleanedText = cleanedText.replace(quantityPattern, '');
  
  // Remove location information if present
  cleanedText = cleanedText.replace(/\s+(at|in|on)\s+(shelf|rack|position|section|aisle|row|cabinet|drawer|bin|box)\s+\d+/i, '');
  cleanedText = cleanedText.replace(/\s+(for|at|price|cost)\s+(\d+|₹\d+|rs\d+)/i, '');
  
  // Further cleanup common conjunctions or phrases in multi-product commands
  cleanedText = cleanedText.replace(/\s+and\s+.*$/, '');
  cleanedText = cleanedText.replace(/\s*,\s*.*$/, '');
  
  return cleanedText.trim();
};

/**
 * Extracts position from commands like "at shelf 7" or "on rack 3"
 */
const extractPosition = (text: string): string | undefined => {
  const positionMatch = text.match(/(at|in|on)?\s*(shelf|rack|position|section|aisle|row|cabinet|drawer|bin|box)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  
  if (positionMatch) {
    const numberMap: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    
    const locationType = positionMatch[2];
    let locationNum = positionMatch[3];
    
    // Convert word numbers to digits if needed
    if (numberMap[locationNum.toLowerCase()]) {
      locationNum = numberMap[locationNum.toLowerCase()];
    }
    
    return `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNum}`;
  }
  
  return undefined;
};

// Dictionary of common units and their canonical form
const unitNormalizer = {
  'kg': ['kg', 'kilo', 'kilos', 'kilogram', 'kilograms'],
  'g': ['g', 'gram', 'grams', 'gm', 'gms'],
  'l': ['l', 'liter', 'litre', 'liters', 'litres', 'lt', 'ltr', 'ltrs'],
  'ml': ['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres'],
  'packet': ['packet', 'packets', 'pack', 'packs', 'sachet', 'sachets'],
  'bottle': ['bottle', 'bottles', 'btl', 'btls'],
  'can': ['can', 'cans', 'tin', 'tins'],
  'box': ['box', 'boxes', 'carton', 'cartons'],
  'piece': ['piece', 'pieces', 'pc', 'pcs', 'unit', 'units', 'item', 'items']
};

// Normalize unit to canonical form
const normalizeUnit = (unit: string): string => {
  const lowerUnit = unit.toLowerCase();
  for (const [canonical, variations] of Object.entries(unitNormalizer)) {
    if (variations.includes(lowerUnit)) {
      return canonical;
    }
  }
  return lowerUnit; // Return as is if no match found
};

/**
 * Convert number words to digits (e.g., "three" to 3)
 */
const wordToNumber = (word: string): number | undefined => {
  const numberMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
  };
  
  return numberMap[word.toLowerCase()];
};

/**
 * Parse a multi-product voice command like:
 * "Add 2 kg rice for ₹100, 3 litre milk for ₹90, 5 packs of biscuits for ₹50" 
 * 
 * Returns array of MultiProduct items.
 */
export const parseMultiProductCommand = (command: string, productList: {name: string}[] = []): MultiProduct[] => {
  if (!command) return [];
  
  console.log("Parsing command:", command);

  // Clean up the command string - broader pattern matching for various command phrases
  const cleanedCommand = command
    .replace(/add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload/gi, '')
    .trim();

  // Split input by commas, "and", or other separators to handle various speaking patterns
  const parts = cleanedCommand.split(/,|\sand\s|also|plus|along with|together with|with|as well as|besides|additionally|moreover/i);
  console.log("Parts after splitting:", parts);

  const fuse = new Fuse(productList, fuseOptions);
  const results: MultiProduct[] = [];
  
  // Extract the general location that might apply to all products
  const generalLocationMatch = command.match(/(at|in|on)\s+(shelf|rack|position|section|aisle|row|cabinet|drawer|bin|box)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  let generalLocation: string | undefined;
  
  if (generalLocationMatch) {
    const locationType = generalLocationMatch[2];
    let locationNumber = generalLocationMatch[3];
    
    // Convert word numbers to digits if needed
    const numValue = wordToNumber(locationNumber);
    if (numValue !== undefined) {
      locationNumber = numValue.toString();
    }
    
    generalLocation = `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNumber}`;
  }

  for (const part of parts) {
    console.log("Processing part:", part);
    const trimmedPart = part.trim();
    if (!trimmedPart) continue; // Skip empty parts
    
    // First try to match the standard pattern: quantity + unit + product + price
    // e.g., "5 kg rice", "3 packets of biscuits for ₹30"
    const standardPattern = /(\d+|one|two|three|four|five)\s*(kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|unit|units|box|boxes|dozen|carton)\s*(?:of\s+)?([a-z\s]+?)(?:\s+(?:for|at|₹|rs|rupees|price|cost|worth|valued at)\s*(\d+))?$/i;
    
    // Alternative pattern for product first: product + quantity + unit
    // e.g., "rice 5 kg", "milk 2 liters"
    const alternativePattern = /([a-z\s]+?)\s+(\d+|one|two|three|four|five)\s*(kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|unit|units|box|boxes|dozen|carton)(?:\s+(?:for|at|₹|rs|rupees|price|cost|worth|valued at)\s*(\d+))?$/i;
    
    // Simple pattern for just product name (defaults will be applied)
    const simplePattern = /([a-z\s]+)$/i;
    
    let productMatch = trimmedPart.match(standardPattern);
    let isAlternativePattern = false;
    
    if (!productMatch) {
      productMatch = trimmedPart.match(alternativePattern);
      isAlternativePattern = !!productMatch;
      
      if (!productMatch) {
        productMatch = trimmedPart.match(simplePattern);
      }
    }
    
    if (productMatch) {
      console.log("Pattern match result:", productMatch);
      
      let name, quantity, unit, price;
      
      // Parse based on which pattern matched
      if (isAlternativePattern) {
        // Alternative pattern: product first, then quantity and unit
        name = productMatch[1].trim().toLowerCase();
        
        // Convert word numbers to digits if needed
        if (isNaN(Number(productMatch[2]))) {
          const numValue = wordToNumber(productMatch[2]);
          quantity = numValue !== undefined ? numValue : 1;
        } else {
          quantity = Number(productMatch[2]);
        }
        
        unit = normalizeUnit(productMatch[3]);
        price = productMatch[4] ? Number(productMatch[4]) : undefined;
      } else if (productMatch.length >= 3) {
        // Standard pattern: quantity, unit, then product
        // Convert word numbers to digits if needed
        if (isNaN(Number(productMatch[1]))) {
          const numValue = wordToNumber(productMatch[1]);
          quantity = numValue !== undefined ? numValue : 1;
        } else {
          quantity = Number(productMatch[1]);
        }
        
        unit = productMatch[2] ? normalizeUnit(productMatch[2]) : 'piece';
        name = productMatch[3] ? productMatch[3].trim().toLowerCase() : '';
        price = productMatch[4] ? Number(productMatch[4]) : undefined;
      } else {
        // Simple pattern: just product name
        name = productMatch[1].trim().toLowerCase();
        quantity = 1; // Default quantity
        unit = 'piece'; // Default unit
      }
      
      // Try to find a product match in the product list
      if (productList.length > 0 && name) {
        const fuseResult = fuse.search(name);
        if (fuseResult.length > 0) {
          name = fuseResult[0].item.name;
        }
      }
      
      // Extract position specific to this part if mentioned
      let position = extractPosition(trimmedPart) || generalLocation;
      
      // If no position was found, suggest one based on product type
      if (!position && name) {
        position = suggestLocationForProduct(name);
      }
      
      // Add the parsed product to results
      if (name) {
        results.push({
          name,
          quantity,
          unit,
          price,
          position
        });
      }
    } else {
      // Fallback for when no pattern matches
      // Try to extract at least a product name
      console.log("No pattern match, trying fallback extraction");
      
      // Remove any command words and try to get just the product name
      const cleanName = extractProductName(trimmedPart);
      
      if (cleanName) {
        // Try to find this product in the product list
        let matchedName = cleanName;
        if (productList.length > 0) {
          const fuseResult = fuse.search(cleanName);
          if (fuseResult.length > 0) {
            matchedName = fuseResult[0].item.name;
          }
        }
        
        // Use suggested location
        const position = generalLocation || suggestLocationForProduct(matchedName);
        
        results.push({
          name: matchedName,
          quantity: 1, // Default quantity 
          unit: 'piece', // Default unit
          position
        });
      }
    }
  }

  console.log("Final parsed results:", results);
  return results;
};
