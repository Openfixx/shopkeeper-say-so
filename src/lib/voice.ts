
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

  // ——— 1) Enhanced regex‑based product name extractor ———
  const extractPureProductName = (t: string): string => {
    // Try several regex patterns to extract just the product name
    const patterns = [
      // Match "add X to rack/shelf" pattern
      /(?:add|create)?\s*(?:\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\s*)?(.+?)(?=\s+(?:to|on|in)\s+(?:rack|shelf)\b|\s+(?:price|for)\b|\s+₹|\s+\d|\bexpiry\b|$)/i,
      // Match "X quantity unit" pattern
      /(?:add|create|get)?\s*(.+?)(?=\s+\d+\s*(?:kg|g|ml|l|pieces?|pcs|units?))/i,
      // Match after quantity
      /(?:\d+(?:\.\d+)?\s*(?:kg|g|ml|l|pieces?|pcs|units?)\s+(?:of\s+)?(.+?)(?=\s+(?:to|on|in|for|price|expiry)|$))/i,
      // Simple fallback - everything after add/create and before prepositions
      /(?:add|create|get)\s+(.+?)(?=\s+(?:to|on|in|for|price|expiry)|$)/i
    ];

    // Try each pattern until one works
    for (const pattern of patterns) {
      const m = t.match(pattern);
      if (m && m[1] && m[1].trim().length > 0) {
        return m[1].trim();
      }
    }

    // Ultimate fallback - clean up the text
    return t
      .replace(/(\d+(?:\.\d+)?|one|two|three|…|ten)\s*(kg|g|ml|l)\b/gi, '')
      .replace(/\b(?:to|on|in)\s+(?:rack|shelf)\s*\d+\b/gi, '')
      .replace(/\b(add|create|price|for|₹|expiry|expire|next)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // ——— 2) Enhanced quantity / position / price / expiry parsers ———
  const parseQuantity = (t: string) => {
    // Added support for words like "one", "two", etc.
    const numberWords: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };

    // Try to match number + unit
    const m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|units?)/i);
    if (m) return { value: parseFloat(m[1]), unit: m[2].toLowerCase() };

    // Try to match word number + unit
    const wordMatch = t.match(new RegExp(`(${Object.keys(numberWords).join('|')})\\s*(kg|g|ml|l|pieces?|pcs|units?)`, 'i'));
    if (wordMatch) return { value: numberWords[wordMatch[1].toLowerCase()], unit: wordMatch[2].toLowerCase() };

    return undefined;
  };

  const parsePosition = (t: string) => {
    // Improved to capture various position descriptions
    const shelfMatch = t.match(/(?:to|on|in)\s+(rack|shelf)\s*(\d+)/i);
    if (shelfMatch) return `${shelfMatch[1]} ${shelfMatch[2]}`;
    
    const positionMatch = t.match(/(?:place|put|position|locate)\s+(?:at|on|in)\s+(.+?)(?=\s+and|\s+with|\s+for|$)/i);
    return positionMatch ? positionMatch[1].trim() : undefined;
  };

  const parsePrice = (t: string) => {
    // Improved to handle various price formats
    const patterns = [
      /₹\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*₹/,
      /(?:price|cost|for)\s+(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:rupees|rs)/i
    ];

    for (const pattern of patterns) {
      const m = t.match(pattern);
      if (m) return parseFloat(m[1]);
    }

    return undefined;
  };

  const parseExpiry = (t: string) => {
    const m = t.match(/\b(?:expiry|expire|next|valid until|use before)\b\s*(.+?)(?=\s+and|\s+with|\s+for|$)/i);
    return m ? m[1].trim() : undefined;
  };

  // ——— 3) Enhanced autocorrect with common grocery items + Levenshtein ———
  const DICTIONARY = [
    'rice', 'sugar', 'flour', 'oil', 'salt', 'soap', 'shampoo', 'detergent',
    'milk', 'bread', 'eggs', 'cheese', 'butter', 'yogurt', 'cream',
    'chicken', 'beef', 'fish', 'mutton', 'pork', 
    'potato', 'tomato', 'onion', 'garlic', 'ginger',
    'apple', 'banana', 'orange', 'grapes', 'watermelon',
    'coffee', 'tea', 'juice', 'water', 'soda',
    'cookies', 'chocolate', 'candy', 'chips', 'nuts',
    'pasta', 'noodles', 'cereal', 'oats', 'bread'
  ];
  
  const levenshtein = (a: string, b: string) => {
    const dp: number[][] = Array(a.length+1).fill(0).map(() => Array(b.length+1).fill(0));
    for (let i=0;i<=a.length;i++) dp[i][0]=i;
    for (let j=0;j<=b.length;j++) dp[0][j]=j;
    for (let i=1;i<=a.length;i++){
      for (let j=1;j<=b.length;j++){
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,
          dp[i][j-1] + 1,
          dp[i-1][j-1] + (a[i-1].toLowerCase()===b[j-1].toLowerCase()?0:1)
        );
      }
    }
    return dp[a.length][b.length];
  };
  
  const autoCorrect = (input: string): string => {
    // Don't correct if too long (likely a sentence, not a product name)
    if (input.split(' ').length > 3) return input;
    
    // Look for best match
    let best = input, minDist = Infinity;
    for (const w of DICTIONARY) {
      const d = levenshtein(input.toLowerCase(), w.toLowerCase());
      if (d < minDist) { minDist = d; best = w; }
    }
    
    // Only correct if close enough
    const threshold = Math.max(2, Math.floor(input.length / 4)); // Dynamic threshold based on length
    return minDist <= threshold ? best : input;
  };

  // ——— 4) Enhanced product image fetch ———
  const fetchProductImage = async (productName: string): Promise<string> => {
    if (!productName) return 'https://placehold.co/300x300?text=No+Name';
    
    // Clean up the name for better search
    const q = productName
      .replace(/(kg|g|ml|l)\b/gi, '')
      .replace(/\d+/g, '')
      .trim()
      .toLowerCase();
      
    // Try to find a specific image for common products
    const commonProducts: Record<string, string> = {
      'rice': 'https://source.unsplash.com/300x300/?rice,bag',
      'sugar': 'https://source.unsplash.com/300x300/?sugar,granulated',
      'flour': 'https://source.unsplash.com/300x300/?flour,wheat',
      'milk': 'https://source.unsplash.com/300x300/?milk,bottle',
      'bread': 'https://source.unsplash.com/300x300/?bread,loaf',
      'eggs': 'https://source.unsplash.com/300x300/?eggs,carton'
    };
    
    if (commonProducts[q]) {
      return commonProducts[q];
    }
    
    const url = `https://source.unsplash.com/300x300/?${encodeURIComponent(q)}`;
    console.log('Unsplash URL →', url);
    return url;
  };

  // ——— 5) Enhanced Browser SpeechRecognition core ———
  const recognize = async (lang = 'en-IN'): Promise<string> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('❌ SpeechRecognition not supported on this device.');
      throw new Error('SpeechRecognition not supported');
    }
    const recog = new SR();
    recog.lang = lang;
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 3; // Get multiple alternatives
    
    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      
      recog.onresult = (e: any) => {
        let interimTranscript = '';
        
        // Get all results
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript = transcript;
          } else {
            interimTranscript = transcript;
          }
        }
        
        if (finalTranscript) {
          resolve(finalTranscript);
        }
      };
      
      recog.onerror = (e: any) => reject(e.error);
      recog.start();
    });
  };

  // ——— 6) Enhanced Single‐shot listen + parse + autocorrect ———
  const listen = async (lang = 'en-IN'): Promise<CommandResult> => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      console.log('Transcript →', transcript);
      setText(transcript);

      // Extract the raw product name
      const rawName = extractPureProductName(transcript);
      console.log('Extracted (raw) name →', rawName);
      
      // Auto-correct the name
      const correctedName = autoCorrect(rawName);
      console.log('Auto‑corrected name →', correctedName);

      // Parse other properties
      const quantity = parseQuantity(transcript);
      const position = parsePosition(transcript);
      const price = parsePrice(transcript);
      const expiry = parseExpiry(transcript);
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
