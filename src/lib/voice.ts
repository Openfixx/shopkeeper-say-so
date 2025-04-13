import { useState } from 'react';

// Helper: Enhanced rack number parser
const parseRackNumber = (text: string): number | null => {
  const match = text.match(
    /(rack|shelf|position|bin|slot)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i
  );
  
  const numberMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };

  return match ? numberMap[match[2].toLowerCase()] || parseInt(match[2]) : null;
};

// Helper: Robust image fetcher with fallbacks
const fetchProductImage = async (productName: string): Promise<string> => {
  try {
    // Try DuckDuckGo first
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json`
    );
    const ddgData = await ddgRes.json();
    if (ddgData.Image) return ddgData.Image;

    // Fallback to Pexels
    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(productName)}&per_page=1`,
      { headers: { Authorization: process.env.NEXT_PUBLIC_PEXELS_KEY } }
    );
    const pexelsData = await pexelsRes.json();
    return pexelsData.photos?.[0]?.src?.medium || '';

  } catch {
    return '';
  }
};

// Main hook
export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName?: string;
    rackNumber?: number | null;
    imageUrl?: string;
    rawText?: string;
  } | null>(null);

  const recognize = async (lang: string, attempts = 3): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;  // Enable continuous mode
    recognition.interimResults = true;

    try {
      return await new Promise((resolve, reject) => {
        let finalTranscript = '';

        recognition.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }
          if (finalTranscript) resolve(finalTranscript);
        };

        recognition.onerror = (e) => {
          if (attempts > 1) {
            resolve(recognize(lang, attempts - 1));
          } else {
            reject(e.error);
          }
        };

        recognition.start();
        setTimeout(() => reject('Timeout'), 10000); // 10s timeout
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

      const rackNumber = parseRackNumber(transcript);
      const productName = transcript
        .replace(/(rack|shelf|position|bin|slot)\s*\w+/i, '')
        .replace(/(add|to|put|place)/i, '')
        .trim();

      const imageUrl = await fetchProductImage(productName);

      setCommandResult({
        productName: productName || undefined,
        rackNumber,
        imageUrl: imageUrl || undefined,
        rawText: transcript
      });

      return { productName, rackNumber, imageUrl };
    } finally {
      setIsListening(false);
    }
  };

  return { 
    text, 
    isListening, 
    listen, 
    commandResult,
    reset: () => {
      setText('');
      setCommandResult(null);
    }
  };
};
