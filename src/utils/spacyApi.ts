
/**
 * SpaCy API Integration
 * This file re-exports all SpaCy-related functionality from the spacy/ directory
 */

// Define the types here to fix the TypeScript errors
export interface SpacyEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  ent_id?: string;
}

export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  description?: string;
}

export interface SpacyProcessResult {
  success: boolean;
  text: string;
  entities: Entity[];
  error?: string;
}

// Import the actual implementations
import { getEntityColor } from './spacy/entityColors';

export { getEntityColor };

/**
 * Process text with SpaCy NLP
 * This is the main function that should be used by components
 */
export const processWithSpacy = async (text: string): Promise<SpacyProcessResult> => {
  try {
    const { processText } = await import('./spacy/api');
    const result = await processText(text);
    console.log('SpaCy NLP result:', result);
    return result;
  } catch (error) {
    console.error('Error processing text with SpaCy:', error);
    // Fall back to mock processing if the API call fails
    const { mockProcessText } = await import('./spacy/mockApi');
    const mockEntities = mockProcessText(text);
    return {
      success: true,
      text,
      entities: mockEntities,
      error: undefined
    };
  }
};

/**
 * Extract specific entities from SpaCy results
 */
export const extractEntities = (entities: Entity[], type: string) => {
  return entities.filter(entity => entity.label === type);
};

/**
 * Extract product details from SpaCy entities
 */
export const extractProductDetailsFromEntities = (entities: Entity[]) => {
  const details: {
    name?: string;
    quantity?: number;
    unit?: string;
    position?: string;
    price?: number;
    expiry?: string;
  } = {};

  // Extract product name
  const productEntities = extractEntities(entities, 'PRODUCT');
  if (productEntities.length > 0) {
    details.name = productEntities[0].text;
  }

  // Extract quantity
  const quantityEntities = extractEntities(entities, 'QUANTITY');
  if (quantityEntities.length > 0) {
    const quantityText = quantityEntities[0].text;
    const quantityMatch = quantityText.match(/(\d+(?:\.\d+)?)\s*(kg|g|liter|l|ml|pieces|pcs|packet|packets|box|boxes)/i);
    if (quantityMatch) {
      details.quantity = parseFloat(quantityMatch[1]);
      details.unit = quantityMatch[2].toLowerCase();
    }
  }

  // Extract position/rack
  const positionEntities = extractEntities(entities, 'POSITION');
  if (positionEntities.length > 0) {
    const positionText = positionEntities[0].text;
    // Extract just the number from "rack X"
    const rackMatch = positionText.match(/\b(?:rack|position|shelf|loc|location)\s*(\d+|[a-zA-Z]+)\b/i);
    if (rackMatch && rackMatch[1]) {
      details.position = `Rack ${rackMatch[1]}`;
    } else {
      details.position = positionText;
    }
  }

  // Extract price
  const moneyEntities = extractEntities(entities, 'MONEY');
  if (moneyEntities.length > 0) {
    const priceText = moneyEntities[0].text;
    const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      details.price = parseFloat(priceMatch[1]);
    }
  }

  // Extract expiry date
  const dateEntities = extractEntities(entities, 'DATE');
  if (dateEntities.length > 0) {
    details.expiry = dateEntities[0].text.replace(/\b(?:expiry|expires|expiration|exp)(?:\s+(?:date|on))?\s+/i, '');
  }

  return details;
};
