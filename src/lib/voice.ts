import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName: string;
    quantity?: { value: number; unit: string };
    position?: string;
    imageUrl?: string;
    price?: number;
  } | null>(null);

  // ▼▼▼ UPDATED PRODUCT NAME EXTRACTION ▼▼▼
  const extractPureProductName = (transcript: string): string => {
    // First try to match patterns like "add [product] to rack" 
    const commandMatch = transcript.match(/(?:add|create)\s+(.+?)(?:\s+to\s+rack|\s+on\s+shelf|\s+for\s+₹|\d|kg|g|ml|l|$)/i);
    if (commandMatch) return commandMatch[1].trim();

    // Fallback: Remove quantities and locations
    return transcript
      .replace(/\b\d+\s*(kg|g|ml|l)\b/gi, '')
      .replace(/\b(rack|shelf|position)\s*\w+\b/gi, '')
      .replace(/\b(add|create|to|on|in|at|for|₹)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };
  // ▲▲▲ END OF UPDATE ▲▲▲

  import { useState } from 'react';

// Unlimited Free Image APIs
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) return '';

  // 1. Try Open Food Facts API (best for groceries)
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/search?fields=image_url&categories_tags=en:${encodeURIComponent(productName)}&page_size=1`
    );
    const offData = await offRes.json();
    if (offData.products?.[0]?.image_url) {
      return offData.products[0].image_url;
    }
  } catch (error) {
    console.error('Open Food Facts error:', error);
  }

  // 2. Try Wikimedia Commons (works for all products)
  try {
    const wikiRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=images&titles=${encodeURIComponent(productName)}&prop=imageinfo&iiprop=url&format=json&origin=*`
    );
    const wikiData = await wikiRes.json();
    const firstImage = Object.values(wikiData.query?.pages || {})[0] as any;
    if (firstImage?.imageinfo?.[0]?.url) {
      return firstImage.imageinfo[0].url;
    }
  } catch (error) {
    console.error('Wikimedia error:', error);
  }

  // 3. Fallback to Unsplash (high-quality product shots)
  try {
    const unsplashRes = await fetch(
      `https://source.unsplash.com/300x300/?${encodeURIComponent(productName)},product`
    );
    // Unsplash returns the image directly
    return unsplashRes.url;
  } catch (error) {
    console.error('Unsplash error:', error);
  }

  return ''; // Empty if all fail
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName: string;
    quantity?: { value: number; unit: string };
    position?: string;
    imageUrl?: string;
  } | null>(null);

  // ... (keep your existing recognize() and other functions)

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      const productName = extractPureProductName(transcript);
      const imageUrl = await fetchProductImage(productName); // Uses unlimited APIs

      setCommandResult({
        productName,
        imageUrl, // Will contain real product image or empty
        // ... (rest of your existing fields)
      });

    } finally {
      setIsListening(false);
    }
  };

  return { 
    text, 
    isListening, 
    listen, 
    commandResult,
    reset: () => setCommandResult(null)
  };
};

  const recognize = async (lang: string): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;

    return new Promise((resolve, reject) => {
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror = (e) => reject(e.error);
      recognition.start();
    });
  };

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      // ▼▼▼ UPDATED PROCESSING ▼▼▼
      const productName = extractPureProductName(transcript);
      const quantityMatch = transcript.match(/(\d+)\s*(kg|g|ml|l)/i);
      const positionMatch = transcript.match(/(rack|shelf)\s*(\d+)/i);
      const priceMatch = transcript.match(/₹?(\d+)/i);

      const result = {
        productName, // Now correctly extracted
        quantity: quantityMatch ? {
          value: parseInt(quantityMatch[1]),
          unit: quantityMatch[2].toLowerCase()
        } : undefined,
        position: positionMatch ? `${positionMatch[1]} ${positionMatch[2]}` : undefined,
        price: priceMatch ? parseInt(priceMatch[1]) : undefined,
        imageUrl: await fetchProductImage(productName),
        rawText: transcript
      };
      // ▲▲▲ END OF UPDATE ▲▲▲

      setCommandResult(result);
      return result;
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
