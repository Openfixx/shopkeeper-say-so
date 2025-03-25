
/**
 * Web Speech API Utilities
 * Provides functionality for text-to-speech (TTS) using the Web Speech API
 */

// Check browser support for Web Speech API
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Available voices state
let availableVoices: SpeechSynthesisVoice[] = [];

// Interface for speech options
export interface SpeechOptions {
  text: string;
  voice?: string; // voice identifier
  rate?: number; // speech rate (0.1 to 10)
  pitch?: number; // speech pitch (0 to 2)
  volume?: number; // speech volume (0 to 1)
  lang?: string; // language code (e.g., 'en-US', 'hi-IN')
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

/**
 * Initialize speech synthesis and load available voices
 */
export const initSpeechSynthesis = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported) {
      console.error('Speech synthesis is not supported in this browser');
      resolve([]);
      return;
    }

    // If voices are already loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      availableVoices = window.speechSynthesis.getVoices();
      resolve(availableVoices);
      return;
    }

    // Wait for voices to be loaded
    window.speechSynthesis.onvoiceschanged = () => {
      availableVoices = window.speechSynthesis.getVoices();
      resolve(availableVoices);
    };
  });
};

/**
 * Get all available speech synthesis voices
 */
export const getVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSynthesisSupported) return [];
  
  if (availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }
  
  return availableVoices;
};

/**
 * Find a voice by language or name
 */
export const findVoice = (query: string): SpeechSynthesisVoice | undefined => {
  const voices = getVoices();
  return voices.find(
    voice => 
      voice.lang.toLowerCase().includes(query.toLowerCase()) || 
      voice.name.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * Speak text using the Web Speech API
 */
export const speak = (options: SpeechOptions): void => {
  if (!isSpeechSynthesisSupported) {
    console.error('Speech synthesis not supported');
    options.onError?.('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  
  // Set speech properties
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;
  
  // Set language if provided
  if (options.lang) {
    utterance.lang = options.lang;
  }
  
  // Set voice if provided
  if (options.voice) {
    const selectedVoice = findVoice(options.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  // Event handlers
  utterance.onstart = () => {
    options.onStart?.();
  };
  
  utterance.onend = () => {
    options.onEnd?.();
  };
  
  utterance.onerror = (event) => {
    options.onError?.(event);
  };
  
  // Speak
  window.speechSynthesis.speak(utterance);
};

/**
 * Stop all speech
 */
export const stopSpeaking = (): void => {
  if (isSpeechSynthesisSupported) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Pause speech
 */
export const pauseSpeaking = (): void => {
  if (isSpeechSynthesisSupported) {
    window.speechSynthesis.pause();
  }
};

/**
 * Resume speech
 */
export const resumeSpeaking = (): void => {
  if (isSpeechSynthesisSupported) {
    window.speechSynthesis.resume();
  }
};
