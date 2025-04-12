
/**
 * Type definitions for spaCy NLP integration
 */

// Basic entity from spaCy
export interface SpacyEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  ent_id?: string;
}

// Enhanced entity with description
export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  description?: string;
}

// Result from processing text with spaCy
export interface SpacyProcessResult {
  success: boolean;
  text: string;
  entities: Entity[];
  error?: string;
}

// Mock entity for testing
export interface MockEntityDefinition {
  patterns: RegExp[];
  label: string;
  description: string;
}

// Result from parsing with Duckling
export interface DucklingParseResult {
  success: boolean;
  text: string;
  locale: string;
  entities: DucklingEntity[];
  error?: string;
}

export interface DucklingEntity {
  body: string;
  start: number;
  end: number;
  dim: string;
  value: any;
}

// Processed data from voice commands
export interface ProcessedVoiceData {
  product?: string;
  quantity?: {
    value: number;
    unit: string;
  };
  position?: string;
  price?: number;
  expiryDate?: string;
  command?: string;
}

// Entity type categories
export enum EntityType {
  PRODUCT = 'PRODUCT',
  QUANTITY = 'QUANTITY',
  POSITION = 'POSITION',
  MONEY = 'MONEY',
  DATE = 'DATE',
  COMMAND = 'COMMAND',
  PERSON = 'PERSON',
  ORG = 'ORG',
  LOC = 'LOC',
  MISC = 'MISC',
}
