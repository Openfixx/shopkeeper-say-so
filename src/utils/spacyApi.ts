
/**
 * SpaCy API Integration
 * This file re-exports all SpaCy-related functionality from the spacy/ directory
 */

export * from './spacy/api';
export * from './spacy/types';
export * from './spacy/entityColors';
export * from './spacy/mockApi';

// Add alias for processText to match what's expected in VoiceFeatures
export const processWithSpacy = async (text: string) => {
  // Re-export processText with the name processWithSpacy
  const { processText } = await import('./spacy/api');
  return processText(text);
};
