
/**
 * SpaCy Mock API Implementation
 * Provides a mock implementation of the SpaCy API for development and testing
 */

import { Entity, SpacyOptions, SpacyProcessResult, ENTITY_DESCRIPTIONS } from './types';

// Default SpaCy API endpoint
export const DEFAULT_SPACY_ENDPOINT = 'https://api.explosion.ai/spacy';

/**
 * Mock function that simulates a call to SpaCy API
 * In a real implementation, this would be replaced with a fetch call to the actual API
 */
export const mockSpacyApiCall = async (text: string, options: SpacyOptions): Promise<SpacyProcessResult> => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  // This is a simplified mock that extracts potential entities based on capitalization
  // In reality, SpaCy uses much more sophisticated NLP techniques
  const words = text.split(/\s+/);
  const entities: Entity[] = [];
  let position = 0;

  const possibleLabels = Object.keys(ENTITY_DESCRIPTIONS);
  
  for (const word of words) {
    // Skip punctuation and short words
    if (word.length <= 2 || /^[,.;!?]/.test(word)) {
      position += word.length + 1;
      continue;
    }

    // Simple rule: capitalized words might be entities (very simplified!)
    if (/^[A-Z]/.test(word)) {
      const start = text.indexOf(word, position);
      const end = start + word.length;
      
      // Randomly assign an entity label for demonstration
      const label = possibleLabels[Math.floor(Math.random() * possibleLabels.length)];
      
      entities.push({
        text: word,
        label,
        start,
        end,
        description: ENTITY_DESCRIPTIONS[label]
      });
    }
    
    position += word.length + 1;
  }

  // For specific words, assign more predictable entities
  const specificEntities: Record<string, string> = {
    'today': 'DATE',
    'tomorrow': 'DATE',
    'yesterday': 'DATE',
    '$': 'MONEY',
    '₹': 'MONEY',
    '%': 'PERCENT',
    'kg': 'QUANTITY',
    'January': 'DATE',
    'February': 'DATE',
    'March': 'DATE',
    'April': 'DATE',
    'May': 'DATE',
    'June': 'DATE',
    'July': 'DATE',
    'August': 'DATE',
    'September': 'DATE',
    'October': 'DATE',
    'November': 'DATE',
    'December': 'DATE',
  };

  for (const [keyword, label] of Object.entries(specificEntities)) {
    const regex = new RegExp(keyword, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label,
        start: match.index,
        end: match.index + match[0].length,
        description: ENTITY_DESCRIPTIONS[label]
      });
    }
  }

  // Number detection (very simplified)
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  let numberMatch;
  
  while ((numberMatch = numberRegex.exec(text)) !== null) {
    entities.push({
      text: numberMatch[0],
      label: 'CARDINAL',
      start: numberMatch.index,
      end: numberMatch.index + numberMatch[0].length,
      description: ENTITY_DESCRIPTIONS['CARDINAL']
    });
  }

  return {
    entities,
    text,
    success: true
  };
};

/**
 * Enhanced mock implementation of processText function to extract product details
 * Ensure this is exported with the exact name 'mockProcessText' to match the import in api.ts
 */
export const mockProcessText = (text: string): Entity[] => {
  // Enhanced implementation to extract entities for product management
  const entities: Entity[] = [];
  
  // Extract product name (nouns after "add" or before units)
  const productNameRegex = /(?:add|create|make)\s+(?:\d+\s+[a-zA-Z]+\s+of\s+)?([a-zA-Z\s]+)(?=\s+(?:in|on|at|with|of|for|₹|\$)|\s+\d+|\s+rack|\s+expiry)/i;
  const nameMatch = text.match(productNameRegex);
  
  if (nameMatch && nameMatch[1]) {
    const productName = nameMatch[1].trim();
    entities.push({
      text: productName,
      label: 'PRODUCT',
      start: nameMatch.index! + nameMatch[0].indexOf(productName),
      end: nameMatch.index! + nameMatch[0].indexOf(productName) + productName.length,
      description: ENTITY_DESCRIPTIONS['PRODUCT'] || 'Product name'
    });
  }
  
  // Extract quantity with units (kg, g, l, ml, etc.)
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pieces|pcs|packets|boxes)/i;
  const quantityMatch = text.match(quantityRegex);
  
  if (quantityMatch) {
    entities.push({
      text: quantityMatch[0],
      label: 'QUANTITY',
      start: quantityMatch.index!,
      end: quantityMatch.index! + quantityMatch[0].length,
      description: ENTITY_DESCRIPTIONS['QUANTITY'] || 'Product quantity'
    });
  }
  
  // Extract position/rack information
  const positionRegex = /(?:rack|position|shelf|loc|location)\s*(\d+|[a-zA-Z]+)/i;
  const positionMatch = text.match(positionRegex);
  
  if (positionMatch) {
    entities.push({
      text: positionMatch[0],
      label: 'POSITION',
      start: positionMatch.index!,
      end: positionMatch.index! + positionMatch[0].length,
      description: ENTITY_DESCRIPTIONS['POSITION'] || 'Product position or rack'
    });
  }
  
  // Extract price information (₹, $, etc.)
  const priceRegex = /(?:price|cost|₹|\$)\s*(\d+(?:\.\d+)?)/i;
  const priceMatch = text.match(priceRegex);
  
  if (priceMatch) {
    entities.push({
      text: priceMatch[0],
      label: 'MONEY',
      start: priceMatch.index!,
      end: priceMatch.index! + priceMatch[0].length,
      description: ENTITY_DESCRIPTIONS['MONEY'] || 'Product price'
    });
  }
  
  // Extract expiry date
  const expiryRegex = /(?:expiry|expires|expiration|exp)\s+(?:date|on)?\s*([a-zA-Z]+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i;
  const expiryMatch = text.match(expiryRegex);
  
  if (expiryMatch) {
    entities.push({
      text: expiryMatch[0],
      label: 'DATE',
      start: expiryMatch.index!,
      end: expiryMatch.index! + expiryMatch[0].length,
      description: ENTITY_DESCRIPTIONS['DATE'] || 'Product expiry date'
    });
  }
  
  // Command type detection (add product, create bill, search product)
  if (/\b(?:add|create|make)\s+(?:a\s+)?product\b/i.test(text)) {
    entities.push({
      text: text.match(/\b(?:add|create|make)\s+(?:a\s+)?product\b/i)![0],
      label: 'COMMAND',
      start: text.match(/\b(?:add|create|make)\s+(?:a\s+)?product\b/i)!.index!,
      end: text.match(/\b(?:add|create|make)\s+(?:a\s+)?product\b/i)!.index! + text.match(/\b(?:add|create|make)\s+(?:a\s+)?product\b/i)![0].length,
      description: 'Command to add a product'
    });
  } 
  else if (/\b(?:create|make|start|new)\s+(?:a\s+)?bill\b/i.test(text)) {
    entities.push({
      text: text.match(/\b(?:create|make|start|new)\s+(?:a\s+)?bill\b/i)![0],
      label: 'COMMAND',
      start: text.match(/\b(?:create|make|start|new)\s+(?:a\s+)?bill\b/i)!.index!,
      end: text.match(/\b(?:create|make|start|new)\s+(?:a\s+)?bill\b/i)!.index! + text.match(/\b(?:create|make|start|new)\s+(?:a\s+)?bill\b/i)![0].length,
      description: 'Command to create a bill'
    });
  }
  else if (/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i.test(text)) {
    entities.push({
      text: text.match(/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i)![0],
      label: 'COMMAND',
      start: text.match(/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i)!.index!,
      end: text.match(/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i)!.index! + text.match(/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i)![0].length,
      description: 'Command to search for a product'
    });
  }
  
  return entities;
};
