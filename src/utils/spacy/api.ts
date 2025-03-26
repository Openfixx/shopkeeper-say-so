
/**
 * SpaCy API Integration
 * Functions for making requests to the spaCy NLP service via Supabase Edge Function
 */

import { supabase } from '@/lib/supabase';
import type { SpacyProcessResult, SpacyOptions, Entity } from './types';
import { mockProcessText } from './mockApi';

/**
 * Process text with spaCy NLP to extract entities
 */
export const processText = async (text: string, options: SpacyOptions = {}): Promise<SpacyProcessResult> => {
  try {
    console.log('Processing text with spaCy:', text);

    // Try to use the Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('spacy-nlp', {
        body: { text }
      });
      
      if (error) {
        console.error('Supabase Edge Function error:', error);
        throw new Error(error.message);
      }
      
      return data as SpacyProcessResult;
    } catch (edgeFuncError) {
      console.warn('Failed to use Supabase Edge Function, falling back to mock implementation:', edgeFuncError);
      
      // Fallback to mock implementation
      const entities = mockProcessText(text);
      
      return {
        success: true,
        text,
        entities
      };
    }
  } catch (error) {
    console.error('Error processing text with spaCy:', error);
    return {
      success: false,
      text,
      entities: [],
      error: error.message || 'An error occurred while processing text'
    };
  }
};

/**
 * Extract entity spans from text for highlighting
 */
export const getEntitySpans = (text: string, entities: Entity[]): { text: string; entity: Entity | null }[] => {
  if (!entities || entities.length === 0) {
    return [{ text, entity: null }];
  }

  // Sort entities by start position
  const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

  const spans: { text: string; entity: Entity | null }[] = [];
  let lastIndex = 0;

  for (const entity of sortedEntities) {
    // Add non-entity text before this entity
    if (entity.start > lastIndex) {
      spans.push({
        text: text.substring(lastIndex, entity.start),
        entity: null
      });
    }

    // Add the entity text
    spans.push({
      text: text.substring(entity.start, entity.end),
      entity
    });

    lastIndex = entity.end;
  }

  // Add any remaining text after the last entity
  if (lastIndex < text.length) {
    spans.push({
      text: text.substring(lastIndex),
      entity: null
    });
  }

  return spans;
};
