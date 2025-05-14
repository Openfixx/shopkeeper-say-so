
/**
 * Command Type Detector
 * Identifies intent from voice commands with extensive pattern matching
 */

// Command intent types
export enum CommandIntent {
  ADD_PRODUCT = 'add_product',
  UPDATE_PRODUCT = 'update_product',
  REMOVE_PRODUCT = 'remove_product',
  GENERATE_BILL = 'generate_bill',
  SEARCH_PRODUCT = 'search_product',
  INFO_REQUEST = 'info_request',
  NAVIGATION = 'navigation',
  UNKNOWN = 'unknown'
}

// Command patterns by intent
const COMMAND_PATTERNS = {
  [CommandIntent.ADD_PRODUCT]: [
    // Explicit add commands
    /\b(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\b/i,
    
    // Implicit add patterns
    /\b(need|want|get|require|have to|must|should|grab|pick|take|procure)\b/i,
    
    // Shopping/ordering language
    /\b(buy|purchase|order|restock|refill)\b/i,
    
    // Quantities with products (implicit add)
    /\b\d+\s*(?:kg|g|ml|l|piece|pieces|pcs|units|boxes|packs|bottles|cartons|dozens)\b/i
  ],
  [CommandIntent.GENERATE_BILL]: [
    // Direct bill generation
    /\b(bill|invoice|receipt|checkout|payment|pay|total|generate bill|create bill|make bill|create invoice|generate invoice|print bill|print invoice|print receipt)\b/i,
    
    // Questions about total
    /\b(what'?s (?:the|my) total|how much (?:do I owe|is it|does it cost)|what'?s (?:the|my) bill)\b/i,
    
    // Checkout process
    /\b(check\s*out|finish|complete|finalize|done shopping)\b/i,
    
    // Payment methods
    /\b(pay (?:with|using|by)|credit card|debit card|cash|upi|online payment)\b/i,
    
    // Bill modifiers
    /\b(split bill|divide bill|add tip|discount|tax)\b/i
  ],
  [CommandIntent.UPDATE_PRODUCT]: [
    /\b(update|modify|change|edit|alter|adjust|revise|correct)\b/i,
  ],
  [CommandIntent.REMOVE_PRODUCT]: [
    /\b(remove|delete|cancel|take out|eliminate|get rid of|discard|trash|erase)\b/i,
  ],
  [CommandIntent.SEARCH_PRODUCT]: [
    /\b(search|find|look for|locate|where is|show|check|query|fetch)\b/i,
  ],
  [CommandIntent.INFO_REQUEST]: [
    /\b(what is|how much|when|where|why|who|tell me about|information|details|describe|explain|help)\b/i,
  ],
  [CommandIntent.NAVIGATION]: [
    /\b(go to|navigate to|open|show me|take me to|switch to|move to)\b/i,
  ]
};

// Product indicators that help determine if a command is product-related
const PRODUCT_INDICATORS = [
  // Quantity + unit patterns
  /\b\d+\s*(kg|g|ml|l|piece|pieces|pcs|units|boxes|packs|bottles|cartons|dozens)\b/i,
  
  // Common product categories
  /\b(grocery|food|drink|vegetable|fruit|dairy|meat|snack|household|cleaners|electronics)\b/i,
  
  // Location/positioning words
  /\b(shelf|aisle|rack|section|store|shop|inventory|stock)\b/i
];

/**
 * Determines the command intent from voice text
 * @param text The voice command text
 * @returns CommandIntent enum value
 */
export const detectCommandIntent = (text: string): CommandIntent => {
  if (!text) return CommandIntent.UNKNOWN;
  
  // Normalize text for processing
  const normalizedText = text.toLowerCase().trim();
  
  // First check for bill generation as it's a high priority intent
  for (const pattern of COMMAND_PATTERNS[CommandIntent.GENERATE_BILL]) {
    if (pattern.test(normalizedText)) {
      // Make sure it's not a question about a specific product's price
      const isProductPriceQuery = /\b(what'?s the price of|how much (?:is|costs?)|price for)\s+[a-z\s]+\b/i.test(normalizedText);
      if (!isProductPriceQuery) {
        return CommandIntent.GENERATE_BILL;
      }
    }
  }
  
  // Check for add product intent
  let isAddIntent = false;
  for (const pattern of COMMAND_PATTERNS[CommandIntent.ADD_PRODUCT]) {
    if (pattern.test(normalizedText)) {
      isAddIntent = true;
      break;
    }
  }
  
  // Check if there are product indicators
  let hasProductIndicators = false;
  for (const pattern of PRODUCT_INDICATORS) {
    if (pattern.test(normalizedText)) {
      hasProductIndicators = true;
      break;
    }
  }
  
  // If it has product indicators but no explicit intent, assume it's an add product intent
  if (hasProductIndicators) {
    // Check for other product-related intents
    for (const pattern of COMMAND_PATTERNS[CommandIntent.UPDATE_PRODUCT]) {
      if (pattern.test(normalizedText)) {
        return CommandIntent.UPDATE_PRODUCT;
      }
    }
    
    for (const pattern of COMMAND_PATTERNS[CommandIntent.REMOVE_PRODUCT]) {
      if (pattern.test(normalizedText)) {
        return CommandIntent.REMOVE_PRODUCT;
      }
    }
    
    for (const pattern of COMMAND_PATTERNS[CommandIntent.SEARCH_PRODUCT]) {
      if (pattern.test(normalizedText)) {
        return CommandIntent.SEARCH_PRODUCT;
      }
    }
    
    // With product indicators but no other specific intent, assume add product
    return CommandIntent.ADD_PRODUCT;
  }
  
  // Check for add intent explicitly mentioned
  if (isAddIntent) {
    return CommandIntent.ADD_PRODUCT;
  }
  
  // Check remaining intents
  for (const [intent, patterns] of Object.entries(COMMAND_PATTERNS)) {
    if (intent !== CommandIntent.ADD_PRODUCT && intent !== CommandIntent.GENERATE_BILL) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          return intent as CommandIntent;
        }
      }
    }
  }
  
  return CommandIntent.UNKNOWN;
};

/**
 * Extracts bill-related options from billing commands
 * @param text The billing command text
 * @returns Object with billing options
 */
export const extractBillOptions = (text: string): Record<string, any> => {
  const options: Record<string, any> = {};
  const normalizedText = text.toLowerCase();
  
  // Extract split information
  const splitMatch = normalizedText.match(/\bsplit\s+(?:the\s+)?(?:bill|invoice|payment)\s+(?:between|among|into|by|for)\s+(\d+|two|three|four|five)\b/i);
  if (splitMatch) {
    const splitNumberMap: Record<string, number> = {
      'two': 2, 'three': 3, 'four': 4, 'five': 5
    };
    
    const splitValue = splitMatch[1];
    options.split = splitNumberMap[splitValue] || parseInt(splitValue);
  }
  
  // Extract payment method
  const paymentMethods = [
    'cash', 'credit card', 'debit card', 'upi', 'online', 'check'
  ];
  
  for (const method of paymentMethods) {
    if (normalizedText.includes(method)) {
      options.paymentMethod = method;
      break;
    }
  }
  
  // Extract delivery method
  if (normalizedText.includes('email') || normalizedText.includes('send to')) {
    options.delivery = 'email';
  } else if (normalizedText.includes('print')) {
    options.delivery = 'print';
  } else if (normalizedText.includes('download')) {
    options.delivery = 'download';
  }
  
  // Extract discount
  const discountMatch = normalizedText.match(/\b(?:apply|with|add)\s+(\d+(?:\.\d+)?)%?\s+discount\b/i);
  if (discountMatch) {
    options.discount = parseFloat(discountMatch[1]);
  }
  
  // Extract if user wants details
  if (/\b(?:detailed|itemized|with details|with items|with breakdown)\b/i.test(normalizedText)) {
    options.detailed = true;
  }
  
  return options;
};

/**
 * Determines if a command is a multi-product command
 * @param text The command text
 * @returns boolean indicating if it's a multi-product command
 */
export const isMultiProductCommand = (text: string): boolean => {
  if (!text) return false;
  
  // Check for separators indicating multiple products
  const hasSeparator = /,|;|\band\b|\bplus\b|\balso\b|\btogether with\b|\balong with\b/i.test(text);
  
  // Check for multiple quantity patterns
  const quantities = text.match(/\b\d+\s*(kg|g|ml|l|piece|pieces|pcs|units|boxes|packs|bottles|cartons|dozens)\b/gi);
  const hasMultipleQuantities = quantities && quantities.length > 1;
  
  return hasSeparator || hasMultipleQuantities;
};
