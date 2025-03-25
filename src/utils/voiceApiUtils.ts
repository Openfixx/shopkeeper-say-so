
// Voice API Utilities
// Provides functionality for voice recognition, transcription, and voice commands

// Check if the browser supports the Web Speech API
export const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// Vosk API configuration
let voskRecognizer: any = null;
let voskModel: any = null;

// Initialize Vosk for offline speech recognition
export const initVosk = async (lang = 'en-US'): Promise<boolean> => {
  try {
    // Vosk is a mock implementation here - in a real application, you'd include the Vosk WebAssembly library
    console.log('Initializing Vosk with language:', lang);
    
    // Mock successful initialization
    voskModel = { 
      name: `vosk-model-${lang.split('-')[0]}-small`,
      loaded: true 
    };
    voskRecognizer = {
      isReady: true,
      acceptWaveform: (audioData: Float32Array) => {
        // Mock processing of audio data
        return true;
      },
      result: () => {
        return { text: "" };
      },
      partialResult: () => {
        return { partial: "" };
      }
    };
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Vosk:', error);
    return false;
  }
};

// Start offline speech recognition with Vosk
export const startVoskRecognition = (
  onPartialResult: (text: string) => void,
  onFinalResult: (text: string) => void,
  onError: (error: any) => void
): (() => void) => {
  if (!voskRecognizer?.isReady) {
    onError('Vosk recognizer is not initialized');
    return () => {};
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let audioInput: MediaStreamAudioSourceNode | null = null;
  let recording = true;
  
  // Start recording
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      audioInput = audioContext.createMediaStreamSource(stream);
      
      // Create processor node
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      // Connect nodes
      audioInput.connect(processor);
      processor.connect(audioContext.destination);
      
      // Process audio
      processor.onaudioprocess = (e) => {
        if (!recording) return;
        
        const audioData = e.inputBuffer.getChannelData(0);
        
        // Send audio data to Vosk
        if (voskRecognizer.acceptWaveform(audioData)) {
          // Get final result
          const result = voskRecognizer.result();
          if (result.text) {
            onFinalResult(result.text);
          }
        } else {
          // Get partial result
          const partial = voskRecognizer.partialResult();
          if (partial.partial) {
            onPartialResult(partial.partial);
          }
        }
      };
      
      // Return cleanup function
      return () => {
        recording = false;
        if (audioInput) {
          audioInput.disconnect();
          audioInput = null;
        }
        processor.disconnect();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
    })
    .catch(onError);
  
  // Return stop function
  return () => {
    recording = false;
  };
};

// Duckling API for numeric and unit extraction
export const extractEntitiesWithDuckling = async (text: string): Promise<any[]> => {
  // This is a mock implementation of Duckling API integration
  console.log('Extracting entities with Duckling:', text);
  
  // Simple regexes to simulate Duckling entity extraction
  const mockExtractEntities = (inputText: string) => {
    const entities = [];
    
    // Match numbers
    const numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
    let match;
    while ((match = numberRegex.exec(inputText)) !== null) {
      entities.push({
        body: match[0],
        start: match.index,
        end: match.index + match[0].length,
        dim: 'number',
        value: parseFloat(match[0])
      });
    }
    
    // Match units with numbers
    const unitRegex = /(\d+(?:\.\d+)?)\s*(kg|g|lbs|oz|ml|l)\b/gi;
    while ((match = unitRegex.exec(inputText)) !== null) {
      entities.push({
        body: match[0],
        start: match.index,
        end: match.index + match[0].length,
        dim: 'quantity',
        value: {
          value: parseFloat(match[1]),
          unit: match[2].toLowerCase()
        }
      });
    }
    
    // Match dates
    const dateRegex = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi;
    while ((match = dateRegex.exec(inputText)) !== null) {
      const month = match[1];
      const day = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
      
      entities.push({
        body: match[0],
        start: match.index,
        end: match.index + match[0].length,
        dim: 'time',
        value: {
          type: 'value',
          value: `${year}-${getMonthNumber(month)}-${day.toString().padStart(2, '0')}`
        }
      });
    }
    
    // Match currency
    const currencyRegex = /\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars|rupees|inr|₹)/gi;
    while ((match = currencyRegex.exec(inputText)) !== null) {
      const amount = match[1] || match[2];
      entities.push({
        body: match[0],
        start: match.index,
        end: match.index + match[0].length,
        dim: 'amount-of-money',
        value: {
          type: 'value',
          value: parseFloat(amount),
          unit: match[0].includes('$') ? 'USD' : 'INR'
        }
      });
    }
    
    return entities;
  };
  
  // Helper function to get month number
  const getMonthNumber = (monthName: string): string => {
    const months: Record<string, string> = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    return months[monthName.toLowerCase()] || '01';
  };
  
  // Mock API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockExtractEntities(text);
};

export interface DucklingEntity {
  body: string;
  start: number;
  end: number;
  dim: string;
  value: any;
}

// Function to format Duckling entities for display
export const formatDucklingEntities = (entities: DucklingEntity[]): string => {
  return entities.map(entity => {
    switch (entity.dim) {
      case 'number':
        return `Number: ${entity.value}`;
      case 'quantity':
        return `Quantity: ${entity.value.value} ${entity.value.unit}`;
      case 'time':
        return `Date: ${entity.value.value}`;
      case 'amount-of-money':
        return `Money: ${entity.value.value} ${entity.value.unit}`;
      default:
        return `${entity.dim}: ${entity.body}`;
    }
  }).join('\n');
};
