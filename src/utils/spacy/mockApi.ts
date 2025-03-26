
import { SpacyEntity } from './types';

/**
 * Mock implementation of SpaCy NLP processing
 * This simulates what a real SpaCy API would return
 */
export const mockProcessText = (text: string): SpacyEntity[] => {
  const entities: SpacyEntity[] = [];
  
  // Pattern matching for product quantities with numbers (both digits and words)
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|g|liter|l|ml|pieces|pcs|box|boxes|packet|packets)/gi;
  let match;
  
  while ((match = quantityRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'QUANTITY',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Measurements, as of weight or distance'
    });
  }
  
  // Pattern matching for money/price
  const moneyRegex = /(?:(?:price|cost|at|for)\s+)?(?:₹|\$|rs\.?)?\s*(\d+(?:\.\d+)?)\b(?!\s*(?:kg|g|liter|l|ml|pieces|pcs))/gi;
  while ((match = moneyRegex.exec(text)) !== null) {
    // Skip if this looks like it's part of a quantity
    if (!text.substring(match.index - 10, match.index).match(/rack|position|shelf/i)) {
      entities.push({
        text: match[0],
        label: 'MONEY',
        start: match.index,
        end: match.index + match[0].length,
        description: 'Monetary values, including unit'
      });
    }
  }
  
  // Pattern matching for dates including month names
  const dateRegex = /\b(?:expiry|expires|expiration|exp)(?:\s+(?:date|on))?\s+([a-zA-Z]+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})\b|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'DATE',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Absolute or relative dates or periods'
    });
  }
  
  // Pattern matching for rack/position with numbers
  const rackRegex = /\b(?:rack|position|shelf|loc|location)\s*(\d+|[a-zA-Z]+)\b/gi;
  while ((match = rackRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'POSITION',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Storage position or location'
    });
  }
  
  // Extract product names (after we've identified other entities)
  // Common grocery items
  const productNames = [
    'sugar', 'rice', 'salt', 'flour', 'oil', 'milk', 'bread', 'butter', 'cheese', 
    'vegetables', 'fruits', 'coffee', 'tea', 'chocolate', 'cereal', 'pasta', 'sauce',
    'juice', 'water', 'soda', 'chips', 'biscuits', 'cookies', 'candy', 'spices',
    'honey', 'jam', 'peanut butter', 'nuts', 'beans', 'lentils', 'meat', 'chicken',
    'fish', 'shrimp', 'eggs', 'yogurt', 'cream', 'ice cream'
  ];
  
  // Look for product terms after "add" or similar words
  const addProductRegex = /\b(?:add|create|make)\s+(?:a\s+)?(?:new\s+)?(?:product\s+)?([a-zA-Z\s]+?)(?=\s+(?:in|on|at|with|of|for|to|rack|\d|₹|\$|price|expiry|expiration)|$)/i;
  const addMatch = text.match(addProductRegex);
  if (addMatch && addMatch[1]) {
    const potentialProduct = addMatch[1].trim().toLowerCase();
    if (productNames.some(product => potentialProduct.includes(product))) {
      entities.push({
        text: addMatch[1].trim(),
        label: 'PRODUCT',
        start: text.indexOf(addMatch[1]),
        end: text.indexOf(addMatch[1]) + addMatch[1].length,
        description: 'Product name'
      });
    }
  }
  
  // If no product found with the above pattern, try another approach
  if (!entities.some(e => e.label === 'PRODUCT')) {
    productNames.forEach(product => {
      const productRegex = new RegExp(`\\b${product}\\b`, 'gi');
      while ((match = productRegex.exec(text)) !== null) {
        // Check if this product is not already part of another entity
        const overlapping = entities.some(e => 
          (match.index >= e.start && match.index < e.end) || 
          (match.index + match[0].length > e.start && match.index + match[0].length <= e.end)
        );
        
        if (!overlapping) {
          entities.push({
            text: match[0],
            label: 'PRODUCT',
            start: match.index,
            end: match.index + match[0].length,
            description: 'Product name'
          });
        }
      }
    });
  }
  
  // Sort entities by their position in the text
  return entities.sort((a, b) => a.start - b.start);
};
