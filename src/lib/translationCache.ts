// Enhanced version with type safety and cache expiration
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
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(`${text} meaning in english`)}&format=json`
    );
    const data = await response.json();
    const translation = data.AbstractText?.split(/[,;.\s]/)[0] || text;
    
    saveTranslation(text, translation);
    return translation;
  } catch (error) {
    console.error("Translation API failed:", error);
    return text; // Graceful fallback
  }
};
