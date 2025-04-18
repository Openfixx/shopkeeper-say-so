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

  // Improved product name extraction
  const extractPureProductName = (transcript: string): string => {
  // Match patterns like "add [product] to rack" with quantity handling
  const commandMatch = transcript.match(
    /(?:add|create)\s+((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty)\s*(?:kg|g|ml|l)\s+)?(.+?)(?=\s+to\s+rack|\s+on\s+shelf|\s+for\s+₹|\d|kg|g|ml|l|$)/i
  );

  if (commandMatch && commandMatch[2]) {
    return commandMatch[2].trim();
  }

  // Fallback: Remove quantities and locations using enhanced regex
  return transcript
    .replace(
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty)\s*(kg|g|ml|l)\b/gi,
      ''
    )
    .replace(/\b(rack|shelf|position)\s*\w+\b/gi, '')
    .replace(/\b(add|create|to|on|in|at|for|₹)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

  // Unlimited Free Image APIs
  const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) return '';

  // 1. First try Open Food Facts with product type filter
  try {
    const sanitizedQuery = productName
      .replace(/(kg|g|ml|l)\b/gi, '') // Remove quantity units
      .trim();
    
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/search?fields=image_url&categories_tags_en=${encodeURIComponent(sanitizedQuery)}&page_size=1`
    );
    const offData = await offRes.json();
    
    if (offData.products?.[0]?.image_url) {
      return offData.products[0].image_url.replace('400.jpg', 'full.jpg');
    }
  } catch (error) {
    console.error('Open Food Facts error:', error);
  }

  // 2. Try Wikimedia Commons with strict product matching
  try {
    const wikiRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(productName)}%20product&prop=imageinfo&iiprop=url&format=json&origin=*`
    );
    const wikiData = await wikiRes.json();
    const pages = wikiData.query?.pages;
    
    if (pages) {
      const firstImage = Object.values(pages).find((page: any) => 
        page.title.toLowerCase().includes('product') ||
        page.title.toLowerCase().includes('package')
      ) as any;
      
      if (firstImage?.imageinfo?.[0]?.url) {
        return firstImage.imageinfo[0].url;
      }
    }
  } catch (error) {
    console.error('Wikimedia error:', error);
  }

  // 3. Final fallback to Bing Image Search (no API key needed)
  try {
    return `https://bing.com/images/search?q=${encodeURIComponent(productName)}%20product%20package&first=1&tsc=ImageBasicHover&datsrc=ImgAuth`;
  } catch (error) {
    console.error('Bing fallback error:', error);
  }

  return '';
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

      const productName = extractPureProductName(transcript);
      const quantityMatch = transcript.match(/(\d+)\s*(kg|g|ml|l)/i);
      const positionMatch = transcript.match(/(rack|shelf)\s*(\d+)/i);
      const priceMatch = transcript.match(/₹?(\d+)/i);

      const result = {
        productName,
        quantity: quantityMatch ? {
          value: parseInt(quantityMatch[1]),
          unit: quantityMatch[2].toLowerCase()
        } : undefined,
        position: positionMatch ? `${positionMatch[1]} ${positionMatch[2]}` : undefined,
        price: priceMatch ? parseInt(priceMatch[1]) : undefined,
        imageUrl: await fetchProductImage(productName),
        rawText: transcript
      };

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
