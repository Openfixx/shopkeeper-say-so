
/**
 * Voice API Utilities
 * Functions for handling voice recognition and text-to-speech
 */

import { supabase } from '@/lib/supabase';

/**
 * Perform speech recognition using Vosk
 */
export const recognizeSpeech = async (textToSimulate: string) => {
  try {
    // First try to use the Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('vosk-speech', {
        body: { text: textToSimulate }
      });
      
      if (error) {
        console.error('Supabase Edge Function error:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (edgeFuncError) {
      console.warn('Failed to use Supabase Edge Function, falling back to mock implementation:', edgeFuncError);
      
      // Fallback to mock implementation
      return {
        success: true,
        text: textToSimulate,
        confidence: 0.95,
        words: textToSimulate.split(' ').map((word, index) => ({
          word,
          start: index * 0.3,
          end: (index + 1) * 0.3,
          conf: 0.9 + Math.random() * 0.1
        }))
      };
    }
  } catch (error) {
    console.error('Speech recognition error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during speech recognition'
    };
  }
};

/**
 * Extract structured data from text using Duckling
 */
export const parseWithDuckling = async (text: string, locale = 'en_US') => {
  try {
    // Try to use the Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('duckling-parser', {
        body: { text, locale }
      });
      
      if (error) {
        console.error('Supabase Edge Function error:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (edgeFuncError) {
      console.warn('Failed to use Supabase Edge Function, falling back to mock implementation:', edgeFuncError);
      
      // Fallback to mock implementation (simplified)
      const mockEntities = [];
      
      // Extract numbers
      const numberRegex = /\b\d+(\.\d+)?\b/g;
      let match;
      while ((match = numberRegex.exec(text)) !== null) {
        mockEntities.push({
          body: match[0],
          start: match.index,
          end: match.index + match[0].length,
          dim: "number",
          value: {
            type: "value",
            value: parseFloat(match[0])
          }
        });
      }
      
      return {
        success: true,
        text,
        locale,
        entities: mockEntities
      };
    }
  } catch (error) {
    console.error('Duckling parsing error:', error);
    return {
      success: false,
      text,
      locale,
      entities: [],
      error: error.message || 'An error occurred during entity parsing'
    };
  }
};

/**
 * Text-to-speech utility
 */
export const speakText = (text: string, options = {}) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported in this browser');
    return false;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set default options
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Apply any custom options
  Object.assign(utterance, options);
  
  window.speechSynthesis.speak(utterance);
  return true;
};
