
/**
 * Web Speech API utilities for speech recognition and synthesis
 */

// Speech Synthesis Options
export interface SpeechOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onPause?: () => void;
  onResume?: () => void;
}

// Initialize speech synthesis and get available voices
export const initSpeechSynthesis = async (): Promise<SpeechSynthesisVoice[]> => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return [];
  }
  
  // Wait for voices to be loaded
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
};

// Get available voices
export const getVoices = (): SpeechSynthesisVoice[] => {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  
  return window.speechSynthesis.getVoices();
};

// Speak text using Web Speech API
export const speak = (options: SpeechOptions): boolean => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return false;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(options.text);
  
  // Set default options
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;
  
  // Set voice if specified
  if (options.voice) {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.name === options.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  // Set event handlers
  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;
  
  window.speechSynthesis.speak(utterance);
  return true;
};

// Stop speaking
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Pause speaking
export const pauseSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
};

// Resume speaking
export const resumeSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
};

// Process audio data with Whisper (via edge function)
export const processAudioWithWhisper = async (audioData: string): Promise<string> => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
      body: { 
        type: 'audio',
        data: audioData
      }
    });
    
    if (error) {
      console.error('Error processing audio with Whisper:', error);
      throw new Error(error.message);
    }
    
    return data.text;
  } catch (error) {
    console.error('Failed to process audio:', error);
    return 'Failed to process audio. See console for details.';
  }
};

// Process text with enhanced NLP (via edge function)
export const processTextWithNLP = async (text: string): Promise<any> => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
      body: { 
        type: 'text',
        data: text
      }
    });
    
    if (error) {
      console.error('Error processing text with NLP:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to process text with NLP:', error);
    // Use local mock processing as fallback
    const { processWithSpacy } = await import('./spacyApi');
    return processWithSpacy(text);
  }
};
