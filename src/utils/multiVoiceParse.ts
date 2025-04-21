
import Fuse from 'fuse.js';

export interface MultiProduct {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
}

const fuseOptions = {
  keys: ['name'],
  threshold: 0.3,
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

  // Split input by commas to separate products
  const parts = command.split(',');

  const fuse = new Fuse(productList, fuseOptions);
  const results: MultiProduct[] = [];

  parts.forEach(part => {
    // Attempt to parse quantity, unit, name, and price from each part
    // Pattern to capture: quantity, unit, name, price (price optional)
    const regex = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|litres|pack|packs|piece|pieces|pcs|units?)?\s*([\w\s]+?)(?:\s*(?:for|at|₹|rs|rupees)\s*(\d+(?:\.\d+)?))?$/i;

    const match = part.trim().match(regex);
    if (match) {
      let [, quantityStr, unit, nameRaw, priceStr] = match;
      // Clean name
      const name = nameRaw.trim().toLowerCase();

      // Use fuse to get best matching product from list
      let matchedName = name;
      if (productList.length > 0) {
        const fuseResult = fuse.search(name);
        if (fuseResult.length > 0) {
          matchedName = fuseResult[0].item.name.toLowerCase();
        }
      }

      results.push({
        name: matchedName,
        quantity: quantityStr ? parseFloat(quantityStr) : undefined,
        unit: unit ? unit.toLowerCase() : undefined,
        price: priceStr ? parseFloat(priceStr) : undefined,
      });
    }
  });

  return results;
};
