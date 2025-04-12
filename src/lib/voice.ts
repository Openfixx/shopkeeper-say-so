import { useState } from 'react';

// Helper function: Extract rack number (e.g., "rack seven" → 7)
const parseRackNumber = (text: string): number | null => {
  const numberMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const match = text.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  return match ? numberMap[match[0].toLowerCase()] || parseInt(match[0]) : null;
};

// Helper function: Fetch product image from DuckDuckGo
const fetchProductImage = async (productName: string): Promise<string> => {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json`
  );
  const data = await response.json();
  return data.Image || ''; // Fallback if no image
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName?: string;
    rackNumber?: number | null;
    imageUrl?: string;
  } | null>(null);

  const recognize = async (lang: string, attempts = 3): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;

    try {
      return await new Promise((resolve, reject) => {
        recognition.onresult = (e) => resolve(e.results[0][0].transcript);
        recognition.onerror = () => 
          attempts > 1 
            ? resolve(recognize(lang, attempts - 1)) 
            : reject('Recognition failed');
        recognition.start();
        setTimeout(() => reject('Timeout'), 5000);
      });
    } catch (error) {
      throw new Error(`Voice recognition failed: ${error}`);
    }
  };

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      // Parse voice command (e.g., "Add apples to rack seven")
      const rackNumber = parseRackNumber(transcript);
      const productName = transcript.replace(/rack\s+\w+/i, '').replace('add', '').trim();
      const imageUrl = await fetchProductImage(productName);

      setCommandResult({
        productName,
        rackNumber,
        imageUrl,
      });
    } finally {
      setIsListening(false);
    }
  };

  return { 
    text, 
    isListening, 
    listen, 
    commandResult, // Expose parsed command data
    resetCommand: () => setCommandResult(null), // Optional cleanup
  };
};
