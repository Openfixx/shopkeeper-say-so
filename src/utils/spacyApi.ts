
/**
 * SpaCy API Integration
 * This file re-exports all SpaCy-related functionality from the spacy/ directory
 */

export * from './spacy/api';
export * from './spacy/types';
export * from './spacy/entityColors';
export * from './spacy/mockApi';

/**
 * Process text with SpaCy NLP
 * This is the main function that should be used by components
 */
export const processWithSpacy = async (text: string) => {
  const { processText } = await import('./spacy/api');
  return processText(text);
};
