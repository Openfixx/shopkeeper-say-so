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

  const fetchProductImage = async (productName: string): Promise<string> => {
    if (!productName) return '';
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}+product&iax=images&ia=images&format=json&no_redirect=1`
      );
      const data = await response.json();
      return data.Image || '';
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
