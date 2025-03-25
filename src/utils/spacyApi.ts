
/**
 * SpaCy API Integration
 * Provides functionality for Named Entity Recognition (NER) using SpaCy
 */

// Default SpaCy API endpoint (replace with your actual SpaCy API endpoint if self-hosted)
const DEFAULT_SPACY_ENDPOINT = 'https://api.explosion.ai/spacy';

export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  description?: string;
}

export interface SpacyProcessResult {
  entities: Entity[];
  text: string;
  success: boolean;
  error?: string;
}

// Map of entity labels to descriptions
const ENTITY_DESCRIPTIONS: Record<string, string> = {
  'PERSON': 'People, including fictional',
  'NORP': 'Nationalities or religious or political groups',
  'FAC': 'Buildings, airports, highways, bridges, etc.',
  'ORG': 'Companies, agencies, institutions, etc.',
  'GPE': 'Countries, cities, states',
  'LOC': 'Non-GPE locations, mountain ranges, bodies of water',
  'PRODUCT': 'Objects, vehicles, foods, etc. (not services)',
  'EVENT': 'Named hurricanes, battles, wars, sports events, etc.',
  'WORK_OF_ART': 'Titles of books, songs, etc.',
  'LAW': 'Named documents made into laws',
  'LANGUAGE': 'Any named language',
  'DATE': 'Absolute or relative dates or periods',
  'TIME': 'Times smaller than a day',
  'PERCENT': 'Percentage, including "%"',
  'MONEY': 'Monetary values, including unit',
  'QUANTITY': 'Measurements, as of weight or distance',
  'ORDINAL': '"first", "second", etc.',
  'CARDINAL': 'Numerals that do not fall under another type',
};

export interface SpacyOptions {
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
}

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
    // In a real implementation, you would replace this with an actual API call

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

/**
 * Mock function that simulates a call to SpaCy API
 * In a real implementation, this would be replaced with a fetch call to the actual API
 */
const mockSpacyApiCall = async (text: string, options: SpacyOptions): Promise<SpacyProcessResult> => {
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

/**
 * Get entity color based on entity label
 */
export const getEntityColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'PERSON': '#ff5e5e',
    'NORP': '#ffb347',
    'FAC': '#84b6f4',
    'ORG': '#77dd77',
    'GPE': '#fdcae1',
    'LOC': '#84dcc6',
    'PRODUCT': '#a0a0ff',
    'EVENT': '#bc8f8f',
    'WORK_OF_ART': '#d3a4f9',
    'LAW': '#f1e1ff',
    'LANGUAGE': '#98fb98',
    'DATE': '#aec6cf',
    'TIME': '#b39eb5',
    'PERCENT': '#ffe4e1',
    'MONEY': '#98fb98',
    'QUANTITY': '#f0e68c',
    'ORDINAL': '#dda0dd',
    'CARDINAL': '#e6e6fa',
  };

  return colorMap[label] || '#cccccc';
};
