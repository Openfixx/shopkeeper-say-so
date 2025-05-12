
import Fuse from 'fuse.js';

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
  const quantityPattern = /^\d+(\.\d+)?\s+(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles)\s+/i;
  
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

/**
 * Parse a multi-product voice command like:
 * "Add 2 kg rice for ₹100, 3 litre milk for ₹90, 5 packs of biscuits for ₹50" 
 * 
 * Returns array of MultiProduct items.
 */
export const parseMultiProductCommand = (command: string, productList: {name: string}[]): MultiProduct[] => {
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

  parts.forEach(part => {
    console.log("Processing part:", part);
    if (!part.trim()) return; // Skip empty parts
    
    // Enhanced regex to handle various formats with more flexible patterns
    // Pattern to capture: quantity, unit, name, price (all optional except name)
    const regex = /(\d+(?:\.\d+)?)?(?:\s*(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles))?\s*([\w\s]+?)(?:\s*(?:for|at|₹|rs|rupees|price|cost|worth|valued at|priced at)\s*(\d+(?:\.\d+)?))?$/i;

    const match = part.trim().match(regex);
    if (match) {
      console.log("Regex match:", match);
      let [, quantityStr, unit, nameRaw, priceStr] = match;
      
      // Extract the clean product name
      const cleanName = extractProductName(part.trim());
      console.log("Extracted clean name:", cleanName);
      
      // Extract position if present
      const position = extractPosition(part);
      console.log("Extracted position:", position);
      
      // Use fuse to get best matching product from list
      let matchedName = cleanName;
      if (productList.length > 0) {
        console.log("Searching for match in product list...");
        const fuseResult = fuse.search(cleanName);
        console.log("Fuse search results:", fuseResult);
        
        if (fuseResult.length > 0) {
          matchedName = fuseResult[0].item.name.toLowerCase();
          console.log("Matched to existing product:", matchedName);
        }
      }

      results.push({
        name: matchedName,
        quantity: quantityStr ? parseFloat(quantityStr) : 1,
        unit: unit ? unit.toLowerCase() : 'unit',
        price: priceStr ? parseFloat(priceStr) : undefined,
        position: position
      });
    } else {
      // Alternative approach for when regex fails - more lenient pattern matching
      const simpleQuantityMatch = part.match(/(\d+(?:\.\d+)?)\s+([\w\s]+)/);
      if (simpleQuantityMatch) {
        const quantity = parseFloat(simpleQuantityMatch[1]);
        const namePart = simpleQuantityMatch[2].trim();
        
        // Extract clean product name from this part
        const cleanName = extractProductName(part.trim());
        
        // Try to separate unit from name
        const unitMatch = namePart.match(/^(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles)\s+([\w\s]+)/i);
        
        // Extract position if present
        const position = extractPosition(part);
        
        if (unitMatch) {
          results.push({
            name: unitMatch[2].trim().toLowerCase(),
            quantity: quantity,
            unit: unitMatch[1].toLowerCase(),
            position: position
          });
        } else {
          results.push({
            name: cleanName.toLowerCase(),
            quantity: quantity,
            unit: 'unit',
            position: position
          });
        }
      } else {
        // Last resort - just take the whole part as a product name
        // Attempt to extract product name by removing common phrases
        const simpleName = extractProductName(part.trim());
        
        // Extract position if present
        const position = extractPosition(part);
        
        if (simpleName) {
          results.push({
            name: simpleName.toLowerCase(),
            quantity: 1,
            unit: 'unit',
            position: position
          });
        }
      }
    }
  });

  console.log("Final parsed results:", results);
  return results;
};
