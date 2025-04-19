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

  // ——— 1) Regex‑based name extractor ———
  const extractPureProductName = (t: string): string => {
    const m = t.match(
      /(?:add|create)?\s*(?:\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\s*)?(.+?)(?=\s+(?:to|on|in)\s+(?:rack|shelf)\b|\s+(?:price|for)\b|\s+₹|\s+\d|\bexpiry\b|$)/i
    );
    if (m && m[1]) return m[1].trim();
    return t
      .replace(/(\d+(?:\.\d+)?|one|two|three|…|ten)\s*(kg|g|ml|l)\b/gi, '')
      .replace(/\b(?:to|on|in)\s+(?:rack|shelf)\s*\d+\b/gi, '')
      .replace(/\b(add|create|price|for|₹|expiry|expire|next)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // ——— 2) Quantity / position / price / expiry parsers ———
  const parseQuantity = (t: string) => {
    const m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)/i);
    return m ? { value: parseFloat(m[1]), unit: m[2].toLowerCase() } : undefined;
  };
  const parsePosition = (t: string) => {
    const m = t.match(/(?:to|on|in)\s+(rack|shelf)\s*(\d+)/i);
    return m ? `${m[1]} ${m[2]}` : undefined;
  };
  const parsePrice = (t: string) => {
    const m = t.match(/₹\s*(\d+(?:\.\d+)?)/) || t.match(/(\d+(?:\.\d+)?)\s*₹/);
    return m ? parseFloat(m[1]) : undefined;
  };
  const parseExpiry = (t: string) => {
    const m = t.match(/\b(?:expiry|expire|next)\b\s*(.+)/i);
    return m ? m[1].trim() : undefined;
  };

  // ——— 3) Tiny autocorrect dictionary + Levenshtein ———
  const DICTIONARY = ['rice','sugar','flour','oil','salt','soap','shampoo','detergent'];
  const levenshtein = (a: string, b: string) => {
    const dp: number[][] = Array(a.length+1).fill(0).map(() => Array(b.length+1).fill(0));
    for (let i=0;i<=a.length;i++) dp[i][0]=i;
    for (let j=0;j<=b.length;j++) dp[0][j]=j;
    for (let i=1;i<=a.length;i++){
      for (let j=1;j<=b.length;j++){
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,
          dp[i][j-1] + 1,
          dp[i-1][j-1] + (a[i-1]===b[j-1]?0:1)
        );
      }
    }
    return dp[a.length][b.length];
  };
  const autoCorrect = (input: string): string => {
    let best = input, minDist = Infinity;
    for (const w of DICTIONARY) {
      const d = levenshtein(input.toLowerCase(), w.toLowerCase());
      if (d < minDist) { minDist = d; best = w; }
    }
    // only correct if “close enough”
    return minDist <= 2 ? best : input;
  };

  // ——— 4) Free Unsplash image fetch ———
  const fetchProductImage = async (productName: string): Promise<string> => {
    if (!productName) return 'https://placehold.co/300x300?text=No+Name';
    const q = productName.replace(/(kg|g|ml|l)\b/gi, '').trim().toLowerCase();
    const url = `https://source.unsplash.com/300x300/?${encodeURIComponent(q)}`;
    console.log('Unsplash URL →', url);
    return url;
  };

  // ——— 5) Browser SpeechRecognition core ———
  const recognize = async (lang = 'en-IN'): Promise<string> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('❌ SpeechRecognition not supported on this device.');
      throw new Error('SR not supported');
    }
    const recog = new SR();
    recog.lang = lang;
    recog.interimResults = false;
    recog.continuous = false;
    return new Promise((resolve, reject) => {
      recog.onresult = (e: any) => resolve(e.results[0][0].transcript);
      recog.onerror  = (e: any) => reject(e.error);
      recog.start();
    });
  };

  // ——— 6) Single‐shot listen + parse + autocorrect ———
  const listen = async (lang = 'en-IN'): Promise<CommandResult> => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      console.log('Transcript →', transcript);
      setText(transcript);

      // raw vs. corrected name
      const rawName = extractPureProductName(transcript);
      console.log('Extracted (raw) name →', rawName);
      const correctedName = autoCorrect(rawName);
      console.log('Auto‑corrected name →', correctedName);

      // parse the rest
      const quantity = parseQuantity(transcript);
      const position = parsePosition(transcript);
      const price    = parsePrice(transcript);
      const expiry   = parseExpiry(transcript);
      const imageUrl = await fetchProductImage(correctedName);

      const result: CommandResult = {
        productName: correctedName,
        quantity,
        position,
        price,
        expiry,
        imageUrl,
        rawText: transcript,
      };

      console.log('Final CommandResult →', result);
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
