
import Fuse from 'fuse.js';

export interface MultiProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  position?: string; // Added this property to fix the TypeScript error
}

const fuseOptions = {
  keys: ['name'],
  threshold: 0.4,
  ignoreLocation: true,
  findAllMatches: true,
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
      
      // Clean name and strip leading connectors like "of", "some", etc.
      const name = nameRaw.trim().toLowerCase().replace(/^(of|some|the|a|an)\s+/i, '');
      console.log("Extracted name (raw):", name);

      // Use fuse to get best matching product from list
      let matchedName = name;
      if (productList.length > 0) {
        console.log("Searching for match in product list...");
        const fuseResult = fuse.search(name);
        console.log("Fuse search results:", fuseResult);
        
        if (fuseResult.length > 0) {
          matchedName = fuseResult[0].item.name.toLowerCase();
          console.log("Matched to existing product:", matchedName);
        }
      }

      // Handle position/location information if present
      let position: string | undefined;
      const positionMatch = part.match(/(shelf|rack|position|section|aisle|row|cabinet|drawer|bin|box)\s+(\w+)/i);
      if (positionMatch) {
        position = positionMatch[0];
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
        
        // Try to separate unit from name
        const unitMatch = namePart.match(/^(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles)\s+([\w\s]+)/i);
        
        if (unitMatch) {
          results.push({
            name: unitMatch[2].trim().toLowerCase(),
            quantity: quantity,
            unit: unitMatch[1].toLowerCase(),
            price: undefined
          });
        } else {
          results.push({
            name: namePart.toLowerCase(),
            quantity: quantity,
            unit: 'unit',
            price: undefined
          });
        }
      } else {
        // Last resort - just take the whole part as a product name
        // Attempt to extract product name by removing common phrases
        const simpleName = part.trim()
          .toLowerCase()
          .replace(/^(please|kindly|could you|can you|i want|i need|i would like|get me|add|insert|put|include)\s+/i, '')
          .replace(/\s+(please|now|for me|to inventory|to stock|to list)$/i, '');
        
        if (simpleName) {
          results.push({
            name: simpleName,
            quantity: 1,
            unit: 'unit',
            price: undefined
          });
        }
      }
    }
  });

  console.log("Final parsed results:", results);
  return results;
};
