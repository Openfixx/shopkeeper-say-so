
/**
 * SpaCy API Integration
 * Provides functionality for Named Entity Recognition (NER) using SpaCy
 */

import { Entity, SpacyOptions, SpacyProcessResult, ENTITY_DESCRIPTIONS } from './types';
import { mockSpacyApiCall } from './mockApi';

/**
 * Process text through SpaCy API for named entity recognition
 */
export const processWithSpacy = async (
  text: string, 
  options: SpacyOptions = {}
): Promise<SpacyProcessResult> => {
  // Default result
  const defaultResult: SpacyProcessResult = {
    entities: [],
    text,
    success: false,
    error: 'Processing failed'
  };

  try {
    if (!text || text.trim().length === 0) {
      return {
        ...defaultResult,
        error: 'Text is empty'
      };
    }

    // You would normally use fetch to call the SpaCy API here
    // This is a mock implementation since we don't have a real SpaCy API endpoint

    // Mock API call for demonstration
    const response = await mockSpacyApiCall(text, options);
    
    if (!response.success) {
      return {
        ...defaultResult,
        error: response.error
      };
    }

    // Add descriptions to entities
    const enhancedEntities = response.entities.map(entity => ({
      ...entity,
      description: ENTITY_DESCRIPTIONS[entity.label] || `Entity of type ${entity.label}`
    }));

    return {
      entities: enhancedEntities,
      text,
      success: true
    };
  } catch (error) {
    console.error('Error processing text with SpaCy:', error);
    return {
      ...defaultResult,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
