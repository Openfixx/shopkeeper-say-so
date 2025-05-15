
/**
 * Command type detection module
 */

// Define various command intent types
export enum CommandIntent {
  ADD_PRODUCT = 'add_product',
  UPDATE_PRODUCT = 'update_product',
  SEARCH_PRODUCT = 'search_product',
  DELETE_PRODUCT = 'delete_product',
  UNKNOWN = 'unknown',
  CREATE_BILL = 'create_bill',
  GENERATE_BILL = 'generate_bill', // Added for VoiceFeatures.tsx
  REMOVE_PRODUCT = 'remove_product' // Added for VoiceFeatures.tsx
}

// Keywords associated with each command intent
const INTENT_KEYWORDS: Record<CommandIntent, string[]> = {
  [CommandIntent.ADD_PRODUCT]: [
    'add', 'create', 'new', 'insert', 'put', 'register', 'include', 'log',
    'record', 'enter', 'save', 'store', 'place', 'set up', 'make', 'bring'
  ],
  [CommandIntent.UPDATE_PRODUCT]: [
    'update', 'modify', 'change', 'edit', 'alter', 'adjust', 'revise', 'amend',
    'correct', 'fix', 'set'
  ],
  [CommandIntent.SEARCH_PRODUCT]: [
    'search', 'find', 'look', 'locate', 'where', 'show', 'check', 'get',
    'fetch', 'list', 'display'
  ],
  [CommandIntent.DELETE_PRODUCT]: [
    'delete', 'remove', 'eliminate', 'discard', 'trash', 'erase', 'get rid',
    'drop', 'clear'
  ],
  [CommandIntent.UNKNOWN]: [],
  [CommandIntent.CREATE_BILL]: [
    'bill', 'invoice', 'checkout', 'payment', 'buy', 'purchase', 'total',
    'calculate', 'finalize'
  ],
  [CommandIntent.GENERATE_BILL]: [ // Added for VoiceFeatures.tsx
    'generate bill', 'make bill', 'create bill', 'prepare bill', 'produce bill'
  ],
  [CommandIntent.REMOVE_PRODUCT]: [ // Added for VoiceFeatures.tsx
    'remove product', 'delete product', 'take out product', 'eliminate product'
  ]
};

/**
 * Detects command intent from a voice command string
 * 
 * @param command The voice command to analyze
 * @returns The detected CommandIntent enum value
 */
export const detectCommandIntent = (command: string): CommandIntent => {
  if (!command) return CommandIntent.UNKNOWN;
  
  const lowerCommand = command.toLowerCase();
  
  // Check for multi-word patterns first (more specific patterns)
  if (/generate\s+bill|make\s+bill|create\s+bill|prepare\s+bill/i.test(lowerCommand)) {
    return CommandIntent.GENERATE_BILL;
  }
  
  if (/remove\s+product|delete\s+product|take\s+out\s+product/i.test(lowerCommand)) {
    return CommandIntent.REMOVE_PRODUCT;
  }
  
  // Check for each intent type by looking for keywords
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Match whole words only using word boundaries
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(lowerCommand)) {
        return intent as CommandIntent;
      }
    }
  }
  
  // If no intent is detected but we have quantity patterns, assume ADD_PRODUCT
  if (/\b\d+\s+(kg|g|l|ml|pcs|box|pack|dozen|bottle)\b/i.test(lowerCommand)) {
    return CommandIntent.ADD_PRODUCT;
  }
  
  return CommandIntent.UNKNOWN;
};

/**
 * Extracts possible product names from a command
 * Simple implementation that focuses on the first noun phrase after command keywords
 */
export const extractPotentialProductNames = (command: string): string[] => {
  const words = command.toLowerCase().split(/\s+/);
  const potentialNames: string[] = [];
  
  // Skip command words and look for potential product names
  let skipCount = 0;
  for (const word of words) {
    if (isCommandWord(word)) {
      skipCount++;
      continue;
    }
    
    if (skipCount > 0) {
      // Simple approach: take a few words after command words
      // In a more advanced implementation, use NLP to identify noun phrases
      const phrase = words.slice(skipCount, skipCount + 3).join(' ');
      if (phrase) potentialNames.push(phrase);
      break;
    }
  }
  
  return potentialNames;
};

/**
 * Helper function to check if a word is a common command word
 */
const isCommandWord = (word: string): boolean => {
  const commandWords = [
    'add', 'create', 'new', 'update', 'modify', 'change', 'search',
    'find', 'where', 'delete', 'remove', 'get', 'show', 'list'
  ];
  
  return commandWords.includes(word);
};
