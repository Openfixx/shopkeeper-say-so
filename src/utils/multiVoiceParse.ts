
import Fuse from 'fuse.js';

export interface MultiProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
}

const fuseOptions = {
  keys: ['name'],
  threshold: 0.4, // Increased threshold for better matching
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

  // Split input by commas to separate products
  const parts = command.split(',');
  console.log("Parts after splitting:", parts);

  const fuse = new Fuse(productList, fuseOptions);
  const results: MultiProduct[] = [];

  parts.forEach(part => {
    console.log("Processing part:", part);
    
    // Attempt to parse quantity, unit, name, and price from each part
    // Pattern to capture: quantity, unit, name, price (price optional)
    const regex = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box)?\s*([\w\s]+?)(?:\s*(?:for|at|₹|rs|rupees)\s*(\d+(?:\.\d+)?))?$/i;

    const match = part.trim().match(regex);
    if (match) {
      console.log("Regex match:", match);
      let [, quantityStr, unit, nameRaw, priceStr] = match;
      // Clean name
      const name = nameRaw.trim().toLowerCase();
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

      results.push({
        name: matchedName,
        quantity: quantityStr ? parseFloat(quantityStr) : undefined,
        unit: unit ? unit.toLowerCase() : undefined,
        price: priceStr ? parseFloat(priceStr) : undefined,
      });
    } else {
      // Try a simpler approach for cases where the regex fails
      console.log("Regex failed, trying simpler approach");
      
      // Try to extract just "add X" pattern
      const simpleMatch = part.trim().match(/add\s+(.+?)(?=$|for|at|price)/i);
      if (simpleMatch && simpleMatch[1]) {
        const simpleName = simpleMatch[1].trim().toLowerCase();
        console.log("Simple match name:", simpleName);
        
        let matchedName = simpleName;
        if (productList.length > 0) {
          const fuseResult = fuse.search(simpleName);
          if (fuseResult.length > 0) {
            matchedName = fuseResult[0].item.name.toLowerCase();
          }
        }
        
        // Extract price if present
        const priceMatch = part.trim().match(/(?:for|at|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i);
        const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
        
        results.push({
          name: matchedName,
          quantity: 1, // Default quantity
          unit: 'unit', // Default unit
          price
        });
      }
    }
  });

  console.log("Final parsed results:", results);
  return results;
};
