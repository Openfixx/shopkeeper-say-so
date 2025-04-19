import { useState } from 'react';

export type CommandResult = {
  productName: string;
  quantity?: { value: number; unit: string };
  position?: string;
  price?: number;
  expiry?: string;
  imageUrl?: string;
  rawText: string;
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);

  // 1) Better name‐only extractor:
  const extractPureProductName = (t: string): string => {
    // look for optional “add/create”, optional qty+unit, then capture up to any of:
    //  • “to/on/in rack|shelf”
    //  • “price” or “₹”
    //  • numeric (start of quantity/price)
    //  • “expiry” etc
    const m = t.match(
      /(?:add|create)?\s*(?:\d+\s*(?:kg|g|ml|l)\s*)?(.+?)(?=\s+(?:to|on|in)\s+(?:rack|shelf)\b|\s+(?:price|for)\b|\s+₹|\s+\d|\bexpiry\b|$)/i
    );
    if (m && m[1]) return m[1].trim();
    // fallback: strip qty, positions, keywords
    return t
      .replace(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(kg|g|ml|l)\b/gi, '')
      .replace(/\b(?:to|on|in)\s+(?:rack|shelf)\s*\d+\b/gi, '')
      .replace(/\b(add|create|price|for|₹|expiry|expire|next)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // 2) Quantity parser
  const parseQuantity = (t: string) => {
    const m = t.match(/(\d+)\s*(kg|g|ml|l)/i);
    return m
      ? { value: parseInt(m[1], 10), unit: m[2].toLowerCase() }
      : undefined;
  };

  // 3) Position parser
  const parsePosition = (t: string) => {
    const m = t.match(/(?:to|on|in)\s+(rack|shelf)\s*(\d+)/i);
    return m ? `${m[1]} ${m[2]}` : undefined;
  };

  // 4) Price parser
  const parsePrice = (t: string) => {
    const m = t.match(/₹\s*(\d+)/) || t.match(/(\d+)\s*₹/);
    return m ? parseInt(m[1], 10) : undefined;
  };

  // 5) Expiry (just grab everything after “expiry”)
  const parseExpiry = (t: string) => {
    const m = t.match(/\b(?:expiry|expire|next)\b\s*(.+)/i);
    return m ? m[1].trim() : undefined;
  };

  // 6) Free & unlimited image via Unsplash Source
  const fetchProductImage = async (productName: string): Promise<string> => {
    if (!productName) {
      return 'https://placehold.co/300x300?text=No+Name';
    }
    // force lowercase and strip units
    const q = productName.replace(/(kg|g|ml|l)\b/gi, '').trim();
    // 300×300 random photo
    return `https://source.unsplash.com/300x300/?${encodeURIComponent(q)}`;
  };

  // 7) Browser speech recognition
  const recognize = async (lang: string = 'en-IN'): Promise<string> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = lang;
    recog.continuous = false;
    return new Promise((resolve, reject) => {
      recog.onresult = (e: any) => resolve(e.results[0][0].transcript);
      recog.onerror = (e: any) => reject(e.error);
      recog.start();
    });
  };

  // 8) Single‐shot “listen once” API
  const listen = async (lang = 'en-IN'): Promise<CommandResult> => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      const productName = extractPureProductName(transcript);
      const quantity = parseQuantity(transcript);
      const position = parsePosition(transcript);
      const price = parsePrice(transcript);
      const expiry = parseExpiry(transcript);
      const imageUrl = await fetchProductImage(productName);

      const result: CommandResult = {
        productName,
        quantity,
        position,
        price,
        expiry,
        imageUrl,
        rawText: transcript,
      };

      setCommandResult(result);
      return result;
    } finally {
      setIsListening(false);
    }
  };

  const reset = () => {
    setText('');
    setCommandResult(null);
  };

  return { text, isListening, listen, commandResult, reset };
};
