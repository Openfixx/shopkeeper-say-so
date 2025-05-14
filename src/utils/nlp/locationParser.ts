
/**
 * Location Parser
 * Extracts location information from voice commands
 */

// Predefined location patterns for common retail/storage areas
const LOCATION_PATTERNS = {
  shelves: [
    /\b(?:on|in|at|from)?\s*(?:the)?\s*(?:top|bottom|middle|upper|lower)?\s*shelf\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i,
    /\b(?:shelf|shelves)\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i
  ],
  aisles: [
    /\b(?:on|in|at|from)?\s*(?:the)?\s*aisle\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i,
    /\b(?:aisle)\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i
  ],
  racks: [
    /\b(?:on|in|at|from)?\s*(?:the)?\s*(?:top|bottom|middle|upper|lower)?\s*rack\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i,
    /\b(?:rack|racks)\s*(?:number|#|no\.?)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\b/i
  ],
  sections: [
    /\b(?:in|at|from)?\s*(?:the)?\s*(?:fruit|vegetable|dairy|meat|frozen|bakery|produce|deli|seafood|canned|dry|beverage|snack|health|beauty|household|pet|cleaning)\s*section\b/i,
    /\b(?:fruit|vegetable|dairy|meat|frozen|bakery|produce|deli|seafood|canned|dry|beverage|snack|health|beauty|household|pet|cleaning)\s*section\b/i
  ],
  storage: [
    /\b(?:in|at|from)?\s*(?:the)?\s*(?:store\s*room|back\s*room|warehouse|storage|pantry|fridge|refrigerator|freezer|cooler)\b/i,
    /\b(?:store\s*room|back\s*room|warehouse|storage|pantry|fridge|refrigerator|freezer|cooler)\b/i
  ],
  positions: [
    /\b(?:on|in|at|from)?\s*(?:the)?\s*(?:left|right|front|back|top|bottom|center|middle|corner|end|side)\s*(?:of|in|at)?\s*(?:the)?\s*(?:store|shop|aisle|section|display)?\b/i,
    /\b(?:left|right|front|back|top|bottom|center|middle|corner|end|side)\s*(?:of|in|at)?\s*(?:the)?\s*(?:store|shop|aisle|section|display)?\b/i
  ]
};

// Number word mapping for numeric extraction
const numberWords: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Extract location information from text
 * @param text The text to extract location from
 * @returns The normalized location string or undefined if none found
 */
export const extractLocation = (text: string): string | undefined => {
  if (!text) return undefined;
  
  // Normalize text for processing
  const normalizedText = text.toLowerCase().trim();
  
  // Try to match against each location pattern category
  for (const [category, patterns] of Object.entries(LOCATION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      
      if (match) {
        // Format based on the category and extract number if present
        let location = '';
        
        switch (category) {
          case 'shelves':
            location = 'Shelf';
            break;
          case 'aisles':
            location = 'Aisle';
            break;
          case 'racks':
            location = 'Rack';
            break;
          case 'sections':
            // Extract the section name (fruits, dairy, etc.)
            const sectionMatch = match[0].match(/\b(fruit|vegetable|dairy|meat|frozen|bakery|produce|deli|seafood|canned|dry|beverage|snack|health|beauty|household|pet|cleaning)\b/i);
            location = sectionMatch ? `${sectionMatch[1].charAt(0).toUpperCase() + sectionMatch[1].slice(1)} Section` : 'Section';
            break;
          case 'storage':
            // Extract storage type (warehouse, fridge, etc.)
            const storageMatch = match[0].match(/\b(store\s*room|back\s*room|warehouse|storage|pantry|fridge|refrigerator|freezer|cooler)\b/i);
            if (storageMatch) {
              const storage = storageMatch[1].replace(/\s+/g, ' ').trim();
              location = storage.charAt(0).toUpperCase() + storage.slice(1);
            } else {
              location = 'Storage';
            }
            break;
          case 'positions':
            // Extract position (left, right, etc.)
            const posMatch = match[0].match(/\b(left|right|front|back|top|bottom|center|middle|corner|end|side)\b/i);
            if (posMatch) {
              location = posMatch[1].charAt(0).toUpperCase() + posMatch[1].slice(1);
              // Extract what it's relative to if available
              const relativeMatch = match[0].match(/\b(of|in|at)\s+(?:the)?\s+\b(store|shop|aisle|section|display)\b/i);
              if (relativeMatch) {
                location += ` ${relativeMatch[1]} ${relativeMatch[2].charAt(0).toUpperCase() + relativeMatch[2].slice(1)}`;
              }
            } else {
              location = 'Position';
            }
            break;
          default:
            location = 'Location';
        }
        
        // Extract number if present in the match
        let numberStr = match[1];
        if (numberStr) {
          // Convert word to number if needed
          if (isNaN(parseInt(numberStr))) {
            numberStr = numberWords[numberStr.toLowerCase()] ? numberWords[numberStr.toLowerCase()].toString() : numberStr;
          }
          location += ` ${numberStr}`;
        }
        
        return location;
      }
    }
  }
  
  // Check for preposition + location patterns (more generic catch-all)
  const genericLocationMatch = text.match(/\b(in|at|on|from)\s+(?:the)?\s+([a-z0-9\s]{2,25})\b/i);
  if (genericLocationMatch && genericLocationMatch[2]) {
    const locationPhrase = genericLocationMatch[2].trim();
    // Avoid returning very common phrases or very short phrases
    const commonPhrases = ['store', 'shop', 'inventory', 'list', 'cart'];
    if (locationPhrase.length > 2 && !commonPhrases.includes(locationPhrase)) {
      return locationPhrase.charAt(0).toUpperCase() + locationPhrase.slice(1);
    }
  }
  
  return undefined;
};
