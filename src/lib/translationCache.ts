const CACHE_KEY = "hindi_english_map";

// Initialize with common terms
const defaultTerms: Record<string, string> = {
  "चीनी": "sugar", "नमक": "salt", "तेल": "oil", "अटा": "flour"
};

export const getTranslationCache = () => {
  const cache = localStorage.getItem(CACHE_KEY);
  return cache ? { ...defaultTerms, ...JSON.parse(cache) } : defaultTerms;
};

export const saveTranslation = (hindi: string, english: string) => {
  const cache = getTranslationCache();
  cache[hindi] = english;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const translateHindi = async (text: string) => {
  const cache = getTranslationCache();
  if (cache[text]) return cache[text];

  // DuckDuckGo API fallback
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
