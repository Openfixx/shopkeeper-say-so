
// Simple Hindi to English translation cache
const HINDI_MAP: Record<string, string> = {
  "चीनी": "sugar",
  "नमक": "salt",
  "तेल": "oil",
  "अटा": "flour",
  "दाल": "lentils",
  "चावल": "rice",
  "दूध": "milk",
  "आटा": "flour",
  "चाय": "tea",
  "कॉफी": "coffee",
  "मसाला": "spice",
  "प्याज": "onion",
  "आलू": "potato",
  "टमाटर": "tomato",
  "एक": "one",
  "दो": "two", 
  "तीन": "three",
  "चार": "four",
  "पांच": "five",
  "किलो": "kg",
  "पैकेट": "packet",
  "जोड़े": "add",
  "जोड़ें": "add",
  "बिल": "bill",
  "रैक": "rack"
};

// Translate Hindi text to English (maintains non-Hindi words)
export const translateHindi = async (text: string): Promise<string> => {
  // If text doesn't contain Hindi characters, return as is
  if (!/[\u0900-\u097F]/.test(text)) {
    return text;
  }
  
  // Split by spaces and translate Hindi words
  const words = text.split(/\s+/);
  const translatedWords = words.map(word => HINDI_MAP[word] || word);
  
  return translatedWords.join(' ');
};

// Cache for translation results
const translationCache = new Map<string, string>();

// Get cached translation or translate fresh
export const getCachedTranslation = async (text: string): Promise<string> => {
  if (translationCache.has(text)) {
    return translationCache.get(text)!;
  }
  
  const translated = await translateHindi(text);
  translationCache.set(text, translated);
  return translated;
};
