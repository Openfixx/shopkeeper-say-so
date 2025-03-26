
/**
 * SpaCy API Types
 * Types and interfaces for SpaCy NLP integration
 */

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

export interface SpacyOptions {
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
}

// Map of entity labels to descriptions
export const ENTITY_DESCRIPTIONS: Record<string, string> = {
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
