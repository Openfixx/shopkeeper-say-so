
/**
 * Command Intent Detector
 * 
 * This module provides functionality to detect the intent of voice commands
 * in the context of an inventory/shop management system.
 */

/**
 * Enumeration of possible command intents
 */
export enum CommandIntent {
  ADD_PRODUCT = "add_product",
  UPDATE_PRODUCT = "update_product",
  REMOVE_PRODUCT = "remove_product",
  DELETE_PRODUCT = "delete_product",
  SEARCH_PRODUCT = "search_product",
  VIEW_INVENTORY = "view_inventory",
  GENERATE_BILL = "generate_bill",
  CREATE_BILL = "create_bill",
  FIND_LOCATION = "find_location",
  SET_EXPIRY = "set_expiry",
  SET_PRICE = "set_price",
  UNKNOWN = "unknown"
}

/**
 * Detects the intent of a voice command
 * 
 * @param {string} command - The voice command text to analyze
 * @returns {CommandIntent} The detected intent
 */
export function detectCommandIntent(command: string): CommandIntent {
  const lowerCommand = command.toLowerCase();
  
  // ADD_PRODUCT intent detection
  if (
    /\b(add|create|new|put|place|insert|register|record|upload|stock)\b/i.test(lowerCommand) ||
    /\bneed\s+\d+/i.test(lowerCommand) ||
    /^\d+\s+(kg|g|l|ml|packet|packets|pack|packs|bottle|bottles)/i.test(lowerCommand)
  ) {
    return CommandIntent.ADD_PRODUCT;
  }
  
  // UPDATE_PRODUCT intent detection
  if (/\b(update|modify|change|edit|revise)\b/i.test(lowerCommand)) {
    return CommandIntent.UPDATE_PRODUCT;
  }
  
  // REMOVE_PRODUCT intent detection
  if (/\b(remove|delete|discard|dispose|trash|eliminate|take out|get rid)\b/i.test(lowerCommand)) {
    return CommandIntent.REMOVE_PRODUCT;
  }
  
  // SEARCH_PRODUCT intent detection
  if (/\b(search|find|look for|locate|where is|show)\b/i.test(lowerCommand)) {
    return CommandIntent.SEARCH_PRODUCT;
  }
  
  // VIEW_INVENTORY intent detection
  if (/\b(list|show|display|view|all|inventory|products|items|goods)\b/i.test(lowerCommand)) {
    return CommandIntent.VIEW_INVENTORY;
  }
  
  // GENERATE_BILL intent detection
  if (
    /\b(bill|invoice|receipt|checkout|total|charge|payment|transaction)\b/i.test(lowerCommand) ||
    /\btotal\s+so\s+far\b/i.test(lowerCommand) ||
    /\bwhat's\s+my\s+total\b/i.test(lowerCommand)
  ) {
    return CommandIntent.GENERATE_BILL;
  }
  
  // FIND_LOCATION intent detection
  if (
    /\b(where|location|place|position|shelf|rack|aisle|row|section|store)\b/i.test(lowerCommand) &&
    !lowerCommand.includes("add") && 
    !lowerCommand.includes("put")
  ) {
    return CommandIntent.FIND_LOCATION;
  }
  
  // SET_EXPIRY intent detection
  if (/\b(expiry|expire|expiration|use by|best before)\b/i.test(lowerCommand)) {
    return CommandIntent.SET_EXPIRY;
  }
  
  // SET_PRICE intent detection
  if (/\b(price|cost|worth|value|rate)\b/i.test(lowerCommand)) {
    return CommandIntent.SET_PRICE;
  }
  
  // Default to unknown if no intent is matched
  return CommandIntent.UNKNOWN;
}

/**
 * Get additional details about a detected command
 * based on the intent type
 * 
 * @param {string} command - The original command text
 * @param {CommandIntent} intent - The detected intent
 * @returns {object} Additional details specific to the intent
 */
export function getCommandDetails(command: string, intent: CommandIntent): any {
  const lowerCommand = command.toLowerCase();
  
  switch (intent) {
    case CommandIntent.ADD_PRODUCT:
      // Extract product quantity and name
      const quantityMatch = lowerCommand.match(/(\d+)\s+(kg|g|l|ml|packet|packets|pack|packs|bottle|bottles)/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Try to extract product name after the quantity and unit
      let productName = "";
      if (quantityMatch) {
        const afterQuantity = lowerCommand.substring(lowerCommand.indexOf(quantityMatch[0]) + quantityMatch[0].length);
        const nameMatch = afterQuantity.match(/\s+(?:of\s+)?([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i);
        if (nameMatch && nameMatch[1]) {
          productName = nameMatch[1].trim();
        }
      }
      
      return { quantity, productName };
      
    case CommandIntent.SEARCH_PRODUCT:
      // Extract the search term
      const searchMatch = lowerCommand.match(/(?:search|find|look for|where is|show)\s+(?:for\s+)?(.+?)(?:\s+in|\s+on|\s+at|$)/i);
      return { searchTerm: searchMatch ? searchMatch[1].trim() : "" };
      
    case CommandIntent.GENERATE_BILL:
      // Check if there are specific products mentioned for the bill
      const hasProducts = /\b(?:for|with)\s+([a-zA-Z\s,]+)(?:\s+and|\s*$)/i.test(lowerCommand);
      return { hasProducts };
      
    default:
      return {};
  }
}
