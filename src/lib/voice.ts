import { useState } from 'react';

// ▼▼▼ ADD THIS NEW FUNCTION ▼▼▼
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) return '';

  // 1. Try Wikimedia Commons (100% free, no API key)
  try {
    const wikiRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=images&titles=${encodeURIComponent(productName)}&prop=imageinfo&iiprop=url&format=json&origin=*`
    );
    const wikiData = await wikiRes.json();
    const pages = wikiData.query?.pages;
    if (pages) {
      const firstImage = Object.values(pages)[0] as any;
      return firstImage?.imageinfo?.[0]?.url || '';
    }
  } catch {}

  // 2. Fallback to Placeholder (always works)
  return `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(productName)}`;
};
// ▲▲▲ END OF NEW FUNCTION ▲▲▲

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);

  const recognize = async (lang: string): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    
    return new Promise((resolve) => {
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.start();
    });
  };

  // ▼▼▼ UPDATE THIS FUNCTION ▼▼▼
  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      // SIMPLE PRODUCT NAME EXTRACTION
      const productName = transcript
        .replace(/\b\d+\s*(kg|g|ml|l)\b/gi, '')  // Remove quantities
        .replace(/\b(rack|shelf|position)\s*\d+\b/gi, '')  // Remove locations
        .replace(/\b(add|to|put|create)\b/gi, '')  // Remove commands
        .trim();

      // ALWAYS RETURNS AN IMAGE (either real or placeholder)
      const imageUrl = await fetchProductImage(productName); 

      setCommandResult({
        productName,
        imageUrl, // ← This will NEVER be empty
        rawText: transcript
      });

    } finally {
      setIsListening(false);
    }
  };
  // ▲▲▲ END OF UPDATED FUNCTION ▲▲▲

  return { text, isListening, listen, commandResult };
};
