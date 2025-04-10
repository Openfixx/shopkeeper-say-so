const CACHE_KEY = "hindi_english_map";

type TranslationCache = Record<string, {
  translation: string;
  timestamp: number;
}>;

// Initialize with common terms
const defaultTerms: TranslationCache = {
  "चीनी": { translation: "sugar", timestamp: Date.now() },
  "नमक": { translation: "salt", timestamp: Date.now() }
};

export const getTranslationCache = (): TranslationCache => {
  const cache = localStorage.getItem(CACHE_KEY);
  return cache ? { ...defaultTerms, ...JSON.parse(cache) } : defaultTerms;
};

export const saveTranslation = (hindi: string, english: string) => {
  const cache = getTranslationCache();
  cache[hindi] = { translation: english, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const translateHindi = async (text: string) => {
  const cache = getTranslationCache();
  
  // Clear entries older than 24 hours
  Object.keys(cache).forEach(key => {
    if (Date.now() - cache[key].timestamp > 86400000) {
      delete cache[key];
    }
  });

  // Check cache first
  if (cache[text]) return cache[text].translation;

  // API fallback (DuckDuckGo)
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(text + " meaning in english")}&format=json`
    );
    const translation = (await res.json()).AbstractText?.split(" ")[0] || text;
    saveTranslation(text, translation);
    return translation;
  } catch {
    return text;
  }
};
