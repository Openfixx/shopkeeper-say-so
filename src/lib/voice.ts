
import { useState } from 'react';
import { fetchProductImage } from '@/utils/fetchImage';

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000
};

const wordsToNumber = (words: string): number => {
  let total = 0;
  let current = 0;

  words.toLowerCase().split(/[\s-]+/).forEach(word => {
    const value = NUMBER_WORDS[word] || 0;
    if (value >= 100) {
      current *= value;
      total += current;
      current = 0;
    } else {
      current += value;
    }
  });

  return total + current;
};

const parseRackNumber = (text: string): number | null => {
  const match = text.match(/(rack|shelf|position|bin|slot)\s*(\d+|[\w\s-]+)/i);
  if (!match) return null;
  
  try {
    const numericValue = parseInt(match[2]);
    if (!isNaN(numericValue)) return numericValue;
    return wordsToNumber(match[2]);
  } catch {
    return null;
  }
};

const extractPureProductName = (text: string): string => {
  return text
    .replace(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(kg|g|ml|l)/gi, '')
    .replace(/(rack|shelf|position|bin|slot)\s*(\d+|[\w\s-]+)/gi, '')
    .replace(/(add|to|put|place|create)/gi, '')
    .replace(/₹?\d+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const extractQuantity = (text: string) => {
  const match = text.match(/(\d+|[\w\s-]+)\s*(kg|g|ml|l)/i);
  if (!match) return undefined;

  return {
    value: match[1] ? wordsToNumber(match[1]) : 1,
    unit: match[2].toLowerCase()
  };
};

const extractPrice = (text: string) => {
  const match = text.match(/₹?(\d+|[\w\s-]+)/i);
  return match ? wordsToNumber(match[1]) : undefined;
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName?: string;
    rackNumber?: number | null;
    imageUrl?: string;
    quantity?: { value: number; unit: string };
    price?: number;
  } | null>(null);

  const recognize = async (lang: string): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    return new Promise((resolve) => {
      let finalTranscript = '';

      recognition.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript.trim()) resolve(finalTranscript.trim());
      };

      recognition.start();
    });
  };

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      const pureProductName = extractPureProductName(transcript);
      const rackNumber = parseRackNumber(transcript);
      const quantity = extractQuantity(transcript);
      const price = extractPrice(transcript);
      
      // Use the improved image fetching utility
      let imageUrl = '';
      if (pureProductName) {
        try {
          imageUrl = await fetchProductImage(pureProductName);
        } catch (error) {
          console.error('Error fetching product image:', error);
        }
      }

      setCommandResult({
        productName: pureProductName || undefined,
        rackNumber,
        imageUrl,
        quantity,
        price
      });

      return { productName: pureProductName, rackNumber, imageUrl, quantity, price };
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
