
import { useState } from 'react';
import { normalizeUnit } from '@/utils/voiceCommandUtils';

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

  // Improved product name extractor with better pattern matching
  const extractPureProductName = (t: string): string => {
    if (!t) return '';
    
    // Normalize text: lowercase and remove extra spaces
    const normalizedText = t.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Handle direct patterns like "add X of Y" or "add X Y"
    const directAddPatterns = [
      /add\s+(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units)?)\s+(?:of\s+)?([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
      /add\s+([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
      /need\s+(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units)?)\s+(?:of\s+)?([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
      /(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units)?)\s+(?:of\s+)?([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i,
    ];
    
    for (const pattern of directAddPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        // If we have a match from the first pattern (with quantity), use the name part
        if (match[2]) return match[2].trim();
        // If we have a match from the second pattern (no quantity), use the entire match
        if (match[1]) return match[1].trim();
      }
    }
    
    // Handle multi-product commands with comma or "and"
    if (normalizedText.includes(',') || normalizedText.includes(' and ')) {
      const parts = normalizedText.split(/,|\s+and\s+/);
      // Process the first part to extract product name
      const firstPart = parts[0].trim();
      
      // Try to match "X kg of Y" pattern in the first part
      const multiMatch = firstPart.match(/(?:add\s+)?(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units)?)\s+(?:of\s+)?([a-zA-Z\s]+)(?:\s*$)/i);
      
      if (multiMatch && multiMatch[2]) {
        return multiMatch[2].trim();
      }
      
      // If no match with quantity, try to extract just the product name
      const nameMatch = firstPart.match(/(?:add\s+)?([a-zA-Z\s]+)(?:\s*$)/i);
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].replace(/\b(?:add|to|for|at)\b/gi, '').trim();
        if (name) return name;
      }
    }
    
    // Last resort: extract product name after removing common command words
    const cleaned = normalizedText
      .replace(/\badd\b|\bcreate\b|\bget\b|\bupload\b|\bset\b|\bput\b|\bneed\b/gi, '')
      .replace(/\b(?:to|on|in|rack|shelf)\s+\d+\b/gi, '')
      .replace(/\b(?:\d+(?:\.\d+)?)\s*(?:kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units)\b/gi, '')
      .replace(/\b(?:price|for|₹|rs|rupees|expiry|expire|next)\s+\d+\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    // Extract the first 2-3 words as the likely product name
    if (cleaned) {
      const words = cleaned.split(/\s+/);
      return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return '';
  };

  // Enhanced quantity parser with better regex patterns and word number support
  const parseQuantity = (t: string) => {
    if (!t) return { value: 1, unit: 'piece' };
    
    // Added support for words like "one", "two", etc.
    const numberWords: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };

    // Enhanced pattern to match number + unit with improved pattern that includes more units
    const m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units|dozen)/i);
    
    if (m) {
      // Normalize the unit using our utility function
      const normalizedUnit = normalizeUnit(m[2].toLowerCase());
      return { value: parseFloat(m[1]), unit: normalizedUnit };
    }

    // Try to match word number + unit
    const wordMatch = t.match(new RegExp(`(${Object.keys(numberWords).join('|')})\\s*(kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units|dozen)`, 'i'));
    if (wordMatch) {
      // Normalize the unit using our utility function
      const normalizedUnit = normalizeUnit(wordMatch[2].toLowerCase());
      return { value: numberWords[wordMatch[1].toLowerCase()], unit: normalizedUnit };
    }

    // If no specific quantity is found, default to 1 unit
    return { value: 1, unit: 'piece' };
  };

  // Enhanced position / shelf parser
  const parsePosition = (t: string) => {
    if (!t) return undefined;
    
    // Match "on/in rack/shelf X" pattern with expanded location types
    const shelfMatch = t.match(/(?:on|in|at|from)\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i);
    if (shelfMatch) {
      const numberMap: Record<string, string> = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
      };
      
      const locationType = shelfMatch[1];
      let locationNum = shelfMatch[2];
      
      // Convert word numbers to digits if needed
      if (numberMap[locationNum.toLowerCase()]) {
        locationNum = numberMap[locationNum.toLowerCase()];
      }
      
      return `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNum}`;
    }
    
    // Match "place/put/position X at/on/in Y" pattern
    const positionMatch = t.match(/(?:place|put|position|locate)\s+(?:at|on|in)\s+([a-zA-Z0-9\s]+?)(?=\s+and|\s+with|\s+for|$)/i);
    if (positionMatch) return positionMatch[1].trim();
    
    // Simple location match (e.g. "in the fridge", "from storage")
    const simpleMatch = t.match(/(?:in|on|at|from)\s+(?:the\s+)?(fridge|storage|counter|shelf|rack)/i);
    if (simpleMatch) return simpleMatch[1].charAt(0).toUpperCase() + simpleMatch[1].slice(1);
    
    // Match numbers preceded by position-related words
    const rackNumberMatch = t.match(/(?:rack|shelf)\s+(\d+|a|b|c|d|e|f)/i);
    if (rackNumberMatch) return `Rack ${rackNumberMatch[1]}`;
    
    return undefined;
  };

  // Enhanced price parser
  const parsePrice = (t: string) => {
    if (!t) return undefined;
    
    // Try multiple price patterns
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

  // Parse expiration date
  const parseExpiry = (t: string) => {
    if (!t) return undefined;
    
    // Enhanced expiry patterns
    const patterns = [
      /\b(?:expiry|expire|expiring|expires|use by|valid until|best before)\b\s*(.+?)(?=\s+and|\s+with|\s+for|$)/i,
      /\b(?:expiry|expire|expiring|expires)\s+(next\s+\w+|tomorrow|in\s+\d+\s+days|in\s+a\s+\w+|on\s+\d{1,2}(?:st|nd|rd|th)?)/i
    ];

    for (const pattern of patterns) {
      const m = t.match(pattern);
      if (m) return m[1].trim();
    }

    return undefined;
  };

  // Enhanced autocorrect with common grocery items
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
    if (!a || !b) return 0;
    
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
    if (!input) return input;
    
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
    
    try {
      const { getCachedImage } = await import('../utils/fetchImage');
      return await getCachedImage(productName);
    } catch (error) {
      console.error("Error fetching product image:", error);
      return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
    }
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
      
      // Apply autocorrection to the product name for common items
      const correctedName = autoCorrect(rawName);
      console.log('Corrected product name →', correctedName);
      
      // Parse other properties with enhanced parsers
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
