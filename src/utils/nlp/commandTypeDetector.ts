
/**
 * Command intent detection for voice commands
 */

export enum CommandIntent {
  ADD_PRODUCT = 'add_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  REMOVE_PRODUCT = 'remove_product',
  CREATE_BILL = 'create_bill',
  GENERATE_BILL = 'generate_bill',
  SEARCH_PRODUCT = 'search_product',
  INVENTORY_CHECK = 'inventory_check',
  NAVIGATION = 'navigation',
  UNKNOWN = 'unknown'
}

// Define patterns for each command type
const commandPatterns = {
  [CommandIntent.ADD_PRODUCT]: [
    /\b(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make)\b/i
  ],
  [CommandIntent.UPDATE_PRODUCT]: [
    /\b(update|modify|change|edit|revise|alter|adjust)\b/i
  ],
  [CommandIntent.DELETE_PRODUCT]: [
    /\b(delete|remove|erase|eliminate|discard|get rid of)\b/i
  ],
  [CommandIntent.REMOVE_PRODUCT]: [
    /\b(remove|delete|erase|eliminate|discard|get rid of)\b/i
  ],
  [CommandIntent.CREATE_BILL]: [
    /\b(bill|invoice|receipt|checkout|payment|transaction|sell|sale)\b/i
  ],
  [CommandIntent.GENERATE_BILL]: [
    /\b(generate bill|create bill|make bill|prepare bill|new bill)\b/i
  ],
  [CommandIntent.SEARCH_PRODUCT]: [
    /\b(search|find|look for|locate|where is|get|show|display)\b/i
  ],
  [CommandIntent.INVENTORY_CHECK]: [
    /\b(check|verify|confirm|count|inventory|stock)\b/i
  ],
  [CommandIntent.NAVIGATION]: [
    /\b(go to|navigate to|open|show|display|take me to)\b/i
  ]
};

/**
 * Detects the command intent from a voice command string
 */
export function detectCommandIntent(command: string): CommandIntent {
  if (!command) return CommandIntent.UNKNOWN;
  
  const text = command.toLowerCase();
  
  // Check for bill/sale related commands first (high priority)
  if (commandPatterns[CommandIntent.CREATE_BILL].some(pattern => pattern.test(text)) ||
      commandPatterns[CommandIntent.GENERATE_BILL].some(pattern => pattern.test(text))) {
    // Make sure it's not just talking about adding a product called "bill"
    // If it contains words like "for", "create", etc. before "bill", it's likely a billing command
    if (/create\s+bill|new\s+bill|add\s+to\s+bill|generate\s+bill|make\s+bill|start\s+bill|\bsale\b/i.test(text)) {
      return CommandIntent.CREATE_BILL;
    }
  }
  
  // Check for navigation commands
  if (commandPatterns[CommandIntent.NAVIGATION].some(pattern => pattern.test(text))) {
    if (/billing|invoice|receipt|checkout|payment|sale/i.test(text)) {
      return CommandIntent.CREATE_BILL; // Navigation to billing page
    }
    if (/product|inventory|stock|item/i.test(text)) {
      return CommandIntent.SEARCH_PRODUCT; // Navigation to products page
    }
  }
  
  // Check for search/find commands
  if (commandPatterns[CommandIntent.SEARCH_PRODUCT].some(pattern => pattern.test(text))) {
    return CommandIntent.SEARCH_PRODUCT;
  }
  
  // Check for inventory check commands
  if (commandPatterns[CommandIntent.INVENTORY_CHECK].some(pattern => pattern.test(text))) {
    return CommandIntent.INVENTORY_CHECK;
  }
  
  // Check for product modification commands
  if (commandPatterns[CommandIntent.UPDATE_PRODUCT].some(pattern => pattern.test(text))) {
    return CommandIntent.UPDATE_PRODUCT;
  }
  
  // Check for product deletion commands
  if (commandPatterns[CommandIntent.DELETE_PRODUCT].some(pattern => pattern.test(text)) ||
      commandPatterns[CommandIntent.REMOVE_PRODUCT].some(pattern => pattern.test(text))) {
    return CommandIntent.DELETE_PRODUCT;
  }
  
  // Default to add product if it matches add patterns
  if (commandPatterns[CommandIntent.ADD_PRODUCT].some(pattern => pattern.test(text))) {
    return CommandIntent.ADD_PRODUCT;
  }
  
  // If no patterns match, return unknown
  return CommandIntent.UNKNOWN;
}
