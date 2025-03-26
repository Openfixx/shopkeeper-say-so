
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
        end
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
        end: match.index + match[0].length
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
      end: numberMatch.index + numberMatch[0].length
    });
  }

  return {
    entities,
    text,
    success: true
  };
};
