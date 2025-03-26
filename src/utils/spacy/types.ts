
/**
 * SpaCy Types
 * Type definitions for SpaCy NLP API
 */

export interface SpacyOptions {
  model?: string;
  includeTokens?: boolean;
  includeSentences?: boolean;
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

// Entity descriptions for better user understanding
export const ENTITY_DESCRIPTIONS: Record<string, string> = {
  'PERSON': 'Person name',
  'ORG': 'Organization name',
  'GPE': 'Geopolitical entity (country, city, state)',
  'LOC': 'Non-GPE location (mountain, water body)',
  'PRODUCT': 'Product name or object',
  'EVENT': 'Named event (hurricane, battle, war, etc.)',
  'WORK_OF_ART': 'Title of book, song, etc.',
  'LAW': 'Named law or legal document',
  'LANGUAGE': 'Named language',
  'DATE': 'Absolute or relative date',
  'TIME': 'Time of day',
  'PERCENT': 'Percentage',
  'MONEY': 'Monetary value',
  'QUANTITY': 'Measurement (weight, length, etc.)',
  'ORDINAL': 'Ordinal number (first, second, etc.)',
  'CARDINAL': 'Cardinal number',
  'COMMAND': 'Voice command',
  'POSITION': 'Product position or rack',
  'UNIT': 'Unit of measurement',
  'EXPIRY': 'Expiry date',
  'NORP': 'Nationalities, religious or political groups',
  'FAC': 'Facility (buildings, airports, etc.)',
};
