
import { EntityType } from './types';

// Colors for different entity types
const ENTITY_COLORS: Record<string, string> = {
  [EntityType.PRODUCT]: '#4f46e5', // indigo
  [EntityType.QUANTITY]: '#16a34a', // green
  [EntityType.POSITION]: '#9333ea', // purple
  [EntityType.MONEY]: '#eab308', // amber
  [EntityType.DATE]: '#0891b2', // cyan
  [EntityType.COMMAND]: '#e11d48', // rose
  [EntityType.PERSON]: '#f97316', // orange 
  [EntityType.ORG]: '#0284c7', // sky
  [EntityType.LOC]: '#2563eb', // blue
  [EntityType.MISC]: '#6b7280', // gray
};

// Default color for unknown entity types
const DEFAULT_COLOR = '#6b7280'; // gray

/**
 * Get the color for a specific entity type
 */
export const getEntityColor = (entityType: string): string => {
  return ENTITY_COLORS[entityType] || DEFAULT_COLOR;
};

/**
 * Get all available entity colors as a mapping
 */
export const getAllEntityColors = (): Record<string, string> => {
  return { ...ENTITY_COLORS };
};
