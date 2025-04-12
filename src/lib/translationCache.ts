
// Enhanced version with type safety, cache expiration, and DuckDuckGo integration
type TranslationCache = Record<string, {
  translation: string;
  timestamp: number; // Unix epoch in ms
}>;

const CACHE_KEY = "shopkeeper_translation_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Initialize with common grocery terms
const DEFAULT_TRANSLATIONS: TranslationCache = {
  "चीनी": { translation: "sugar", timestamp: Date.now() },
  "नमक": { translation: "salt", timestamp: Date.now() },
  "तेल": { translation: "oil", timestamp: Date.now() }
};

export const getTranslationCache = (): TranslationCache => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? { ...DEFAULT_TRANSLATIONS, ...JSON.parse(cache) } : DEFAULT_TRANSLATIONS;
  } catch {
    return DEFAULT_TRANSLATIONS;
  }
};

export const saveTranslation = (hindi: string, english: string): void => {
  const cache = getTranslationCache();
  cache[hindi] = { translation: english, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const translateHindi = async (text: string): Promise<string> => {
  const cache = getTranslationCache();
  
  // Clean expired entries (older than 24h)
  Object.keys(cache).forEach(key => {
    if (Date.now() - cache[key].timestamp > CACHE_TTL_MS) {
      delete cache[key];
    }
  });

  // Return cached translation if available
  if (cache[text]) return cache[text].translation;

  // API fallback to DuckDuckGo
  try {
    const encodedQuery = encodeURIComponent(`${text} meaning in english`);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to extract a concise translation from the API response
    let translation = '';
    
    if (data.AbstractText) {
      // First try to get from AbstractText (usually the definition)
      const cleanText = data.AbstractText.split(/[,;.\n]/)[0].trim();
      if (cleanText) translation = cleanText;
    } 
    else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      // Then try RelatedTopics
      const firstTopic = data.RelatedTopics[0].Text;
      if (firstTopic) {
        const match = firstTopic.match(/means\s+(\w+)/i);
        if (match) translation = match[1];
      }
    }
    
    // If we couldn't extract a good translation, fall back to the original text
    if (!translation) {
      console.warn(`Couldn't extract translation for "${text}" from DuckDuckGo`);
      translation = text;
    }
    
    saveTranslation(text, translation);
    console.log(`Translated "${text}" to "${translation}" using DuckDuckGo API`);
    return translation;
  } catch (error) {
    console.error("Translation API failed:", error);
    return text; // Graceful fallback
  }
};
