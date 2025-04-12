
import { supabase } from '@/integrations/supabase/client';
import { SpacyProcessResult } from './types';
import { mockProcessText } from './mockApi';

/**
 * Process text with the spaCy NLP service via Supabase edge function
 */
export const processText = async (text: string): Promise<SpacyProcessResult> => {
  try {
    // First try using the enhanced AI voice processing edge function
    const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
      body: { 
        type: 'text', 
        data: text 
      }
    });
    
    if (error) {
      throw new Error(`Error calling AI voice processing: ${error.message}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Error processing text');
    }
    
    return {
      success: true,
      text,
      entities: data.entities || []
    };
  } catch (error: any) {
    console.error('Error with Supabase edge function:', error);
    
    // Try the spacy-nlp edge function as a fallback
    try {
      const { data, error: fallbackError } = await supabase.functions.invoke('spacy-nlp', {
        body: { text }
      });
      
      if (fallbackError) {
        throw new Error(`Error calling spaCy NLP: ${fallbackError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Error processing text with spaCy NLP');
      }
      
      return {
        success: true,
        text,
        entities: data.entities || []
      };
    } catch (fallbackError: any) {
      console.error('Error with fallback spaCy NLP:', fallbackError);
      
      // Final fallback to local mock processing
      console.warn('Falling back to mock NER processing');
      const mockEntities = mockProcessText(text);
      return {
        success: true,
        text,
        entities: mockEntities,
        error: 'Warning: Using local mock entity extraction as fallback'
      };
    }
  }
};
