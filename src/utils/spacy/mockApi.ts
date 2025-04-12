import { Entity, MockEntityDefinition } from './types';

// Define patterns for different entity types
const MOCK_ENTITIES: MockEntityDefinition[] = [
  {
    label: 'PRODUCT',
    patterns: [
      /sugar|चीनी/i,
      /rice|चावल/i,
      /milk|दूध/i,
      /oil|तेल/i,
      /flour|आटा/i,
      /salt|नमक/i,
      /coffee/i,
      /tea|चाय/i,
      /onion|प्याज/i,
      /potato|आलू/i,
      /tomato|टमाटर/i
    ],
    description: 'Product name'
  },
  {
    label: 'QUANTITY',
    patterns: [
      /\d+\s*kg|\d+\s*किलो/i,
      /\d+\s*g|\d+\s*ग्राम/i,
      /\d+\s*l|\d+\s*लीटर/i,
      /\d+\s*ml|\d+\s*मिली/i,
      /\d+\s*pcs|\d+\s*pieces/i,
      /\d+\s*box|\d+\s*बॉक्स/i,
      /\d+\s*packet|\d+\s*पैकेट/i
    ],
    description: 'Product quantity'
  },
  {
    label: 'POSITION',
    patterns: [
      /rack\s*\d+|रैक\s*\d+/i,
      /shelf\s*\d+|शेल्फ\s*\d+/i,
      /drawer\s*\d+|दराज\s*\d+/i,
      /position\s*\d+/i,
      /in box\s*\d+/i,
      /में रख/i
    ],
    description: 'Storage position'
  },
  {
    label: 'MONEY',
    patterns: [
      /₹\s*\d+/i,
      /rs\.\s*\d+/i,
      /rupees\s*\d+/i,
      /price\s*\d+/i,
      /cost\s*\d+/i,
      /दाम\s*₹?\s*\d+/i,
      /कीमत\s*₹?\s*\d+/i,
      /मूल्य\s*₹?\s*\d+/i
    ],
    description: 'Price information'
  },
  {
    label: 'DATE',
    patterns: [
      /expiry\s+(date\s+)?\w+\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}/i,
      /expires\s+on\s+\w+\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}/i,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i,
      /\d{1,2}\s+\w+\s+\d{4}/i
    ],
    description: 'Expiry date'
  },
  {
    label: 'COMMAND',
    patterns: [
      /add|जोड़ें|जोड़ना/i,
      /create|बनाना/i,
      /find|खोजना/i,
      /search|खोज/i,
      /update|अपडेट/i,
      /delete|हटाना/i,
      /remove|निकालना/i,
      /bill|बिल/i
    ],
    description: 'Action command'
  }
];

/**
 * Find all occurrences of a pattern in a text
 */
function findAllMatches(text: string, pattern: RegExp): Array<{ start: number, end: number, text: string }> {
  const matches = [];
  let match;
  
  // Make sure the RegExp is global
  const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
  
  while ((match = globalPattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  return matches;
}

/**
 * Process text with mock NER implementation
 * This simulates what spaCy would do for named entity recognition
 */
export const mockProcessText = (text: string): Entity[] => {
  const entities: Entity[] = [];
  
  for (const entityType of MOCK_ENTITIES) {
    for (const pattern of entityType.patterns) {
      const matches = findAllMatches(text, pattern);
      
      for (const match of matches) {
        entities.push({
          text: match.text,
          label: entityType.label,
          start: match.start,
          end: match.end,
          description: entityType.description
        });
      }
    }
  }
  
  // Sort by start position and remove overlaps
  return removeOverlappingEntities(
    entities.sort((a, b) => a.start - b.start)
  );
};

/**
 * Remove overlapping entities, preferring longer entities
 */
function removeOverlappingEntities(entities: Entity[]): Entity[] {
  if (entities.length <= 1) return entities;
  
  const result: Entity[] = [entities[0]];
  
  for (let i = 1; i < entities.length; i++) {
    const current = entities[i];
    const previous = result[result.length - 1];
    
    // Check for overlap
    if (current.start < previous.end) {
      // If current entity is longer, replace previous one
      if ((current.end - current.start) > (previous.end - previous.start)) {
        result[result.length - 1] = current;
      }
      // Otherwise, keep the previous entity and skip the current one
    } else {
      result.push(current);
    }
  }
  
  return result;
}
