import { useState } from 'react';

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName: string;
    quantity?: { value: number; unit: string };
    position?: string;
    imageUrl?: string;
  } | null>(null);

  const extractProductData = (transcript: string) => {
    // 1. Extract product name (exclude quantities/positions)
    const productName = transcript
      .replace(/(\d+\s*(kg|g|ml|l)|to\s+rack\s+\d+|add|create)/gi, '')
      .trim();

    // 2. Extract quantity
    const quantityMatch = transcript.match(/(\d+)\s*(kg|g|ml|l)/i);
    const quantity = quantityMatch ? {
      value: parseInt(quantityMatch[1]),
      unit: quantityMatch[2].toLowerCase()
    } : undefined;

    // 3. Extract position
    const positionMatch = transcript.match(/(?:rack|shelf)\s*(\d+)/i);
    const position = positionMatch ? `Rack ${positionMatch[1]}` : undefined;

    return { productName, quantity, position };
  };

  const fetchProductImage = async (productName: string): Promise<string> => {
    try {
      // First try Wikimedia
      const wikiRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=images&titles=${productName}&prop=imageinfo&iiprop=url&format=json&origin=*`
      );
      const wikiData = await wikiRes.json();
      const imageUrl = Object.values(wikiData.query?.pages || {})[0]?.imageinfo?.[0]?.url;
      if (imageUrl) return imageUrl;

      // Fallback to placeholder
      return `https://via.placeholder.com/300/EFEFEF/000000?text=${encodeURIComponent(productName)}`;
    } catch {
      return '';
    }
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

      const { productName, quantity, position } = extractProductData(transcript);
      const imageUrl = await fetchProductImage(productName);

      const result = { productName, quantity, position, imageUrl };
      setCommandResult(result);
      
      return result;
    } finally {
      setIsListening(false);
    }
  };

  return { text, isListening, listen, commandResult, reset: () => setCommandResult(null) };
};
