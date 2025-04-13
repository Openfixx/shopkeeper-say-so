import { useState } from 'react';

// Number word to value mapping (supports up to 9999)
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

// Parse any rack/shelf number format
const parseRackNumber = (text: string): number | null => {
  const match = text.match(
    /(rack|shelf|position|bin|slot)\s*(\d+|[\w\s-]+)/i
  );

  if (!match) return null;

  try {
    // Try numeric value first
    const numericValue = parseInt(match[2]);
    if (!isNaN(numericValue)) return numericValue;

    // Convert word phrases
    return wordsToNumber(match[2]);
  } catch {
    return null;
  }
};

// Enhanced image fetcher
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) return '';
  
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json&no_redirect=1`
    );
    const data = await response.json();
    return data.Image || '';
  } catch {
    return '';
  }
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

      // Parse all command elements
      const rackNumber = parseRackNumber(transcript);
      const productName = transcript
        .replace(/(rack|shelf|position|bin|slot)\s*[\w\s-]+/i, '')
        .replace(/(add|to|put|place|create)/i, '')
        .replace(/\b\d+\s*(kg|g|ml|l)\b/i, '')
        .replace(/₹?\d+/g, '')
        .trim();

      // Extract quantity (e.g. "2 kg" or "two kilograms")
      const quantityMatch = transcript.match(/(\d+|[\w\s-]+)\s*(kg|g|ml|l|litre|liter|kilo|gram)/i);
      const quantity = quantityMatch ? {
        value: quantityMatch[1] ? wordsToNumber(quantityMatch[1]) : 1,
        unit: quantityMatch[2].toLowerCase()
      } : undefined;

      // Extract price (e.g. "₹250" or "two hundred rupees")
      const priceMatch = transcript.match(/₹?(\d+|[\w\s-]+)/i);
      const price = priceMatch ? wordsToNumber(priceMatch[1]) : undefined;

      const imageUrl = productName ? await fetchProductImage(productName) : '';

      setCommandResult({
        productName: productName || undefined,
        rackNumber,
        imageUrl,
        quantity,
        price
      });

      return { productName, rackNumber, imageUrl, quantity, price };
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
