
import { supabase } from './supabase';

// Simple in-memory cache for translations
const translationCache: Record<string, string> = {};

// Hindi to English translation map for common products
const HINDI_TO_ENGLISH_MAP: Record<string, string> = {
  "चीनी": "sugar",
  "नमक": "salt",
  "तेल": "oil",
  "अटा": "flour",
  "दाल": "lentils",
  "चावल": "rice",
  "मसाला": "spice",
  "चाय": "tea",
  "दूध": "milk",
  "पानी": "water",
  "सब्जी": "vegetable",
  "फल": "fruit",
  "मिर्च": "pepper",
  "हल्दी": "turmeric",
  "धनिया": "coriander",
  "जीरा": "cumin",
  "लहसुन": "garlic",
  "अदरक": "ginger",
  "प्याज": "onion",
  "टमाटर": "tomato",
  "आलू": "potato"
};

/**
 * Translate Hindi text to English
 * First tries cache, then local dictionary, finally calls API if needed
 */
export const translateHindi = async (hindiText: string): Promise<string> => {
  // Check cache first
  if (translationCache[hindiText]) {
    return translationCache[hindiText];
  }
  
  try {
    // First try simple word-by-word translation using our dictionary
    let translatedText = hindiText;
    
    // Replace Hindi words with English equivalents
    Object.keys(HINDI_TO_ENGLISH_MAP).forEach(hindiWord => {
      const englishWord = HINDI_TO_ENGLISH_MAP[hindiWord];
      const regex = new RegExp(hindiWord, 'gi');
      translatedText = translatedText.replace(regex, englishWord);
    });
    
    // If we didn't change anything and we have Supabase edge function, use that
    if (translatedText === hindiText) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
          body: { 
            type: 'translate', 
            data: hindiText,
            source_lang: 'hi',
            target_lang: 'en'
          }
        });
        
        if (!error && data?.translated) {
          translatedText = data.translated;
        }
      } catch (apiError) {
        console.error('Translation API error:', apiError);
        // Continue with our best attempt
      }
    }
    
    // Update cache
    translationCache[hindiText] = translatedText;
    return translatedText;
    
  } catch (error) {
    console.error('Error translating Hindi text:', error);
    return hindiText; // Return original text if translation fails
  }
};

/**
 * Fetch a product image from search engines
 */
export const fetchProductImage = async (productName: string): Promise<string | null> => {
  try {
    // Try to use the Supabase edge function
    const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
      body: { 
        type: 'fetch_image', 
        data: productName 
      }
    });
    
    if (error) throw error;
    
    if (data?.imageUrl) {
      return data.imageUrl;
    }
    
    // Fallback to Unsplash
    return `https://source.unsplash.com/300x300/?${encodeURIComponent(productName)},product`;
    
  } catch (error) {
    console.error('Error fetching product image:', error);
    return null;
  }
};
