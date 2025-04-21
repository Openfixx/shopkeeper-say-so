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

  // Significantly improved regex-based product name extractor
  const extractPureProductName = (t: string): string => {
    // First, check for specific patterns that indicate product names
    const directMatch = t.match(/add\s+(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|pieces?|pcs|units?)?\s*(?:of\s+)?)([\w\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i);
    if (directMatch && directMatch[2]?.trim()) {
      return directMatch[2].trim();
    }
    
    // Handle multi-product commands differently
    if (t.includes(',') || /\s+and\s+/.test(t)) {
      // This is likely a multi-product command, extract the first product
      const parts = t.split(/,|\s+and\s+/i);
      const firstPart = parts[0];
      const productMatch = firstPart.match(/(\d+(?:\.\d+)?)\s*(?:kg|g|ml|l|pieces?|pcs|units?)?\s*(?:of\s+)?([\w\s]+?)(?:\s+(?:for|at|₹|rs|price)|\s*$)/i);
      if (productMatch && productMatch[2]?.trim()) {
        return productMatch[2].trim();
      }
    }
    
    // Simplified pattern matching focused on common voice command structures
    const commonPatterns = [
      // Pattern: "add X kg/g/units of ProductName"
      /add\s+\d+(?:\.\d+)?\s*(?:kg|g|ml|l|pieces?|pcs|units?)\s+(?:of\s+)?([\w\s]+?)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
      
      // Pattern: "add ProductName" (no quantities)
      /add\s+([\w\s]+?)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
      
      // Pattern: "ProductName X kg/g/units"
      /([\w\s]+?)\s+\d+(?:\.\d+)?\s*(?:kg|g|ml|l|pieces?|pcs|units?)/i,
    ];
    
    for (const pattern of commonPatterns) {
      const match = t.match(pattern);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }

    // If all else fails, try to clean up the text and extract what might be a product name
    const cleaned = t
      .replace(/\b(?:add|create|get|upload|set|put)\b/gi, '')
      .replace(/\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:kg|g|ml|l|pieces?|pcs|units?)\b/gi, '')
      .replace(/\b(?:to|on|in)\s+(?:rack|shelf)\s*\d+\b/gi, '')
      .replace(/\b(?:price|for|₹|rs|rupees|expiry|expire|next)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    // Extract the first 2-3 words as the likely product name
    const words = cleaned.split(/\s+/);
    if (words.length > 0) {
      return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return '';
  };

  // Enhanced quantity parser with better regex patterns
  const parseQuantity = (t: string) => {
    // Added support for words like "one", "two", etc.
    const numberWords: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };

    // Try to match number + unit with improved pattern
    const m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|units?|pack|packs|box|boxes)/i);
    if (m) return { value: parseFloat(m[1]), unit: m[2].toLowerCase() };

    // Try to match word number + unit
    const wordMatch = t.match(new RegExp(`(${Object.keys(numberWords).join('|')})\\s*(kg|g|ml|l|pieces?|pcs|units?|pack|packs|box|boxes)`, 'i'));
    if (wordMatch) return { value: numberWords[wordMatch[1].toLowerCase()], unit: wordMatch[2].toLowerCase() };

    // If no specific quantity is found, default to 1 unit
    return { value: 1, unit: 'unit' };
  };

  // Enhanced position / shelf parser
  const parsePosition = (t: string) => {
    // Improved to capture various position descriptions
    const shelfMatch = t.match(/(?:to|on|in)\s+(rack|shelf)\s*(\d+)/i);
    if (shelfMatch) return `${shelfMatch[1]} ${shelfMatch[2]}`;
    
    const positionMatch = t.match(/(?:place|put|position|locate)\s+(?:at|on|in)\s+(.+?)(?=\s+and|\s+with|\s+for|$)/i);
    return positionMatch ? positionMatch[1].trim() : undefined;
  };

  // Enhanced price parser
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

  // Enhanced autocorrect with common grocery items + Levenshtein
  const DICTIONARY = [
    'rice', 'sugar', 'flour', 'oil', 'salt', 'soap', 'shampoo', 'detergent',
    'milk', 'bread', 'eggs', 'cheese', 'butter', 'yogurt', 'cream',
    'chicken', 'beef', 'fish', 'mutton', 'pork', 
    'potato', 'tomato', 'onion', 'garlic', 'ginger',
    'apple', 'banana', 'orange', 'grapes', 'watermelon',
    'coffee', 'tea', 'juice', 'water', 'soda',
    'cookies', 'chocolate', 'candy', 'chips', 'nuts',
    'pasta', 'noodles', 'cereal', 'oats', 'bread',
    'dal', 'lentil', 'spices', 'masala', 'ghee',
    'atta', 'maida', 'besan', 'suji', 'poha',
    'basmati', 'toor dal', 'moong dal', 'chana dal', 'urad dal',
    'jaggery', 'gur', 'honey', 'biscuits', 'namkeen'
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
      'eggs': 'https://source.unsplash.com/300x300/?eggs,carton',
      'dal': 'https://source.unsplash.com/300x300/?lentils',
      'atta': 'https://source.unsplash.com/300x300/?wheat,flour'
    };
    
    if (commonProducts[q]) {
      return commonProducts[q];
    }
    
    const url = `https://source.unsplash.com/300x300/?${encodeURIComponent(q)}`;
    console.log('Unsplash URL →', url);
    return url;
  };

  // Enhanced recognition function with better error handling
  const recognize = async (lang = 'en-IN'): Promise<string> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.error('SpeechRecognition not supported on this browser');
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
        
        // Set text even for interim results
        setText(interimTranscript || finalTranscript);
        
        if (finalTranscript) {
          resolve(finalTranscript);
        }
      };
      
      recog.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        reject(e.error || new Error('Speech recognition failed'));
      };
      
      recog.onend = () => {
        // If we got no final result but got some interim results
        if (!finalTranscript && text) {
          resolve(text); // Use what we have
        } else if (!finalTranscript) {
          reject(new Error('No speech detected'));
        }
      };
      
      recog.start();
    });
  };

  // Improved listen function with better product extraction
  const listen = async (lang = 'en-IN'): Promise<CommandResult> => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      console.log('Transcript →', transcript);
      setText(transcript);

      // Extract the raw product name with the improved function
      const rawName = extractPureProductName(transcript);
      console.log('Extracted product name →', rawName);
      
      // Parse other properties
      const quantity = parseQuantity(transcript);
      const position = transcript.match(/(?:on|in|at)\s+(rack|shelf)\s*(\d+)/i) 
        ? transcript.match(/(?:on|in|at)\s+(rack|shelf)\s*(\d+)/i)![0]
        : undefined;
        
      const price = transcript.match(/(?:price|cost|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i)
        ? parseFloat(transcript.match(/(?:price|cost|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i)![1])
        : undefined;
        
      const expiry = transcript.match(/expiry\s+(.+?)(?:\s|$)/i)
        ? transcript.match(/expiry\s+(.+?)(?:\s|$)/i)![1]
        : undefined;
        
      const imageUrl = await fetchProductImage(rawName);

      const result: CommandResult = {
        productName: rawName,
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
    } catch (error) {
      console.error('Voice recognition error:', error);
      throw error;
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
