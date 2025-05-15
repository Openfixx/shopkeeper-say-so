
/**
 * Command Type Detection
 * 
 * This module detects the intent of voice commands, such as adding products,
 * searching, creating bills, etc.
 */

// Define the command intent types
export enum CommandIntent {
  ADD_PRODUCT = "ADD_PRODUCT",
  SEARCH_PRODUCT = "SEARCH_PRODUCT",
  UPDATE_PRODUCT = "UPDATE_PRODUCT",
  CREATE_BILL = "CREATE_BILL",
  GENERATE_BILL = "GENERATE_BILL", // Added for backward compatibility
  DELETE_PRODUCT = "DELETE_PRODUCT",
  REMOVE_PRODUCT = "REMOVE_PRODUCT", // Added for backward compatibility
  SHOW_INVENTORY = "SHOW_INVENTORY",
  CALCULATE_TOTAL = "CALCULATE_TOTAL",
  UNKNOWN = "UNKNOWN"
}

// Keywords for each intent
const intentKeywords = {
  [CommandIntent.ADD_PRODUCT]: [
    "add", "create", "insert", "put", "register", "include", "log", "record",
    "enter", "save", "store", "place", "set up", "new", "make", "bring", "stock"
  ],
  [CommandIntent.SEARCH_PRODUCT]: [
    "search", "find", "look for", "locate", "where is", "show me", "check",
    "query", "get", "fetch"
  ],
  [CommandIntent.UPDATE_PRODUCT]: [
    "update", "modify", "change", "edit", "alter", "adjust", "revise", "amend"
  ],
  [CommandIntent.DELETE_PRODUCT]: [
    "remove", "delete", "take out", "eliminate", "get rid", "discard", "cancel",
    "dispose", "trash", "erase"
  ],
  [CommandIntent.REMOVE_PRODUCT]: [
    "remove", "delete", "take out", "eliminate", "get rid", "discard", "cancel",
    "dispose", "trash", "erase"
  ],
  [CommandIntent.CREATE_BILL]: [
    "bill", "invoice", "checkout", "receipt", "payment", "total", "calculate",
    "finalize", "complete", "sale", "purchase"
  ],
  [CommandIntent.GENERATE_BILL]: [
    "bill", "invoice", "checkout", "receipt", "payment", "total", "calculate",
    "finalize", "complete", "sale", "purchase"
  ],
  [CommandIntent.SHOW_INVENTORY]: [
    "inventory", "show all", "list", "display", "view", "see", "all products",
    "stock", "items"
  ],
  [CommandIntent.CALCULATE_TOTAL]: [
    "total", "sum", "amount", "value", "price", "cost", "calculate", "add up"
  ]
};

/**
 * Detect command intent from a given text
 * @param command - The command text to analyze
 * @returns The detected CommandIntent
 */
export const detectCommandIntent = (command: string): CommandIntent => {
  const lowerCommand = command.toLowerCase();
  
  // Check each intent by looking for keywords
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const keyword of keywords) {
      // Match whole words only
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerCommand)) {
        return intent as CommandIntent;
      }
    }
  }
  
  // Special case for ADD_PRODUCT: if there's a quantity pattern, it's likely adding products
  const hasQuantityPattern = /\b\d+\s*(kg|g|l|ml|pcs|piece|box|packet|bottle)\b/i.test(lowerCommand);
  if (hasQuantityPattern) {
    return CommandIntent.ADD_PRODUCT;
  }
  
  return CommandIntent.UNKNOWN;
};

/**
 * Get suggested command examples for a specific intent
 * @param intent - The CommandIntent to get examples for
 * @returns Array of example commands
 */
export const getCommandExamples = (intent: CommandIntent): string[] => {
  switch (intent) {
    case CommandIntent.ADD_PRODUCT:
      return [
        "Add 5 kg rice",
        "Add 2 bottles of oil and 3 packets of biscuits",
        "Put 3 kg sugar on rack 2",
        "Add 10 apples and 5 bananas in fridge"
      ];
    case CommandIntent.SEARCH_PRODUCT:
      return [
        "Find sugar",
        "Where is rice",
        "Search for milk",
        "Locate apples"
      ];
    case CommandIntent.UPDATE_PRODUCT:
      return [
        "Update rice quantity to 10 kg",
        "Change oil price to 120",
        "Modify sugar location to shelf 3"
      ];
    case CommandIntent.DELETE_PRODUCT:
    case CommandIntent.REMOVE_PRODUCT:
      return [
        "Remove rice",
        "Delete expired milk",
        "Take out old bread"
      ];
    case CommandIntent.CREATE_BILL:
    case CommandIntent.GENERATE_BILL:
      return [
        "Create bill",
        "Generate invoice",
        "Checkout items",
        "Complete sale"
      ];
    case CommandIntent.SHOW_INVENTORY:
      return [
        "Show inventory",
        "List all products",
        "View stock"
      ];
    default:
      return ["Try saying 'Add 5 kg rice'"];
  }
};
