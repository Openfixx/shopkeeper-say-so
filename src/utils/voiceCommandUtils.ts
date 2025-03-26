
/**
 * Voice Command Utilities
 * Functions for processing and handling voice commands
 */

export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  FIND_SHOPS: 'find_shops',
  SCAN_BARCODE: 'scan_barcode',
  STOCK_ALERT: 'stock_alert',
  CHANGE_SHOP_TYPE: 'change_shop_type',
  UNKNOWN: 'unknown'
};

interface ProductDetails {
  name?: string;
  quantity?: number;
  unit?: string;
  position?: string;
  price?: number;
  expiry?: string;
  image?: string;
}

interface CommandResult {
  type: string;
  data?: any;
}

/**
 * Extract product details from a voice command
 */
export const extractProductDetails = (command: string): ProductDetails => {
  const details: ProductDetails = {};
  const lowerCommand = command.toLowerCase();
  
  // Extract product name
  // Look for patterns like "add [product]" or "add X kg of [product]"
  let productName = '';
  
  // Pattern: "add [product]" or "add a [product]"
  const addProductRegex = /\b(?:add|create|make)\s+(?:a\s+)?(?!bill|cart|shop)([a-zA-Z\s]+?)(?=\s+(?:in|on|at|with|of|for|to|rack|\d|₹|\$|price|expiry|expiration)|$)/i;
  
  // Pattern: "add X kg of [product]"
  const qtyProductRegex = /\b(?:add|create)\s+\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pcs|pieces|packets)(?:\s+of)?\s+([a-zA-Z\s]+?)(?=\s+(?:in|on|at|with|to|rack|\d|₹|\$|price|expiry|expiration)|$)/i;
  
  // Try different patterns to extract product name
  if (addProductRegex.test(lowerCommand)) {
    const match = lowerCommand.match(addProductRegex);
    if (match && match[1]) {
      productName = match[1].trim();
    }
  } else if (qtyProductRegex.test(lowerCommand)) {
    const match = lowerCommand.match(qtyProductRegex);
    if (match && match[1]) {
      productName = match[1].trim();
    }
  }
  
  // If no match from regex, try to extract from sentence context
  if (!productName && lowerCommand.includes('add') && !lowerCommand.includes('bill')) {
    const words = lowerCommand.split(/\s+/);
    const addIndex = words.findIndex(word => word === 'add');
    
    if (addIndex >= 0 && addIndex < words.length - 1) {
      // Take up to 3 words after "add" as potential product name
      productName = words.slice(addIndex + 1, addIndex + 4).join(' ');
      
      // Clean up: remove prepositions, units, numbers
      productName = productName.replace(/\b(?:in|on|at|with|of|for|to|the|a|an|kg|g|l|ml|pcs|pieces|packets)\b/gi, '');
      productName = productName.replace(/\d+(?:\.\d+)?/g, '');
      productName = productName.trim();
    }
  }
  
  if (productName) {
    details.name = productName;
  }
  
  // Extract quantity
  const quantityRegex = /\b(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pieces|pcs|packets|boxes)\b/i;
  const quantityMatch = lowerCommand.match(quantityRegex);
  
  if (quantityMatch) {
    details.quantity = parseFloat(quantityMatch[1]);
    details.unit = quantityMatch[2].toLowerCase();
  }
  
  // Extract position/location/rack
  const rackRegex = /\b(?:rack|position|shelf|loc|location)\s*(\d+|[a-zA-Z]+)\b/i;
  const rackMatch = lowerCommand.match(rackRegex);
  
  if (rackMatch) {
    details.position = rackMatch[0];
  }
  
  // Extract price
  const priceRegex = /\b(?:(?:price|cost|at|for)\s+)?(?:₹|\$)?\s*(\d+(?:\.\d+)?)\b/i;
  const priceMatch = lowerCommand.match(priceRegex);
  
  if (priceMatch && !lowerCommand.includes('quantity')) {
    details.price = parseFloat(priceMatch[1]);
  }
  
  // Extract expiry date
  const expiryRegex = /\b(?:expiry|expires|expiration|exp)(?:\s+(?:date|on))?\s+([a-zA-Z]+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})\b/i;
  const expiryMatch = lowerCommand.match(expiryRegex);
  
  if (expiryMatch) {
    details.expiry = expiryMatch[1];
  } else {
    // Try to find month names followed by year
    const monthYearRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i;
    const monthYearMatch = lowerCommand.match(monthYearRegex);
    
    if (monthYearMatch) {
      details.expiry = `${monthYearMatch[1]} ${monthYearMatch[2]}`;
    }
  }
  
  return details;
};

/**
 * Extract bill items from a voice command
 */
export const extractBillItems = (command: string): {name: string, quantity: number, unit?: string}[] => {
  const items = [];
  const lowerCommand = command.toLowerCase();
  
  // Check for bill-specific patterns
  // Pattern: "add X kg of [product] to bill" or "X kg [product]"
  const itemPatterns = [
    /\b(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pieces|packets)\s+(?:of\s+)?([a-zA-Z\s]+?)(?=\s+(?:to|in|bill|,|and|\.)|\s*$)/gi,
    /\b([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pieces|packets)(?=\s+(?:to|in|bill|,|and|\.)|\s*$)/gi,
    /\badd\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pieces|packets)\s+(?:of\s+)?([a-zA-Z\s]+)/gi,
  ];
  
  for (const pattern of itemPatterns) {
    let match;
    while ((match = pattern.exec(command)) !== null) {
      if (pattern.source.startsWith('\\b([a-zA-Z')) {
        // Pattern where product name comes first
        items.push({
          name: match[1].trim(),
          quantity: parseFloat(match[2]),
          unit: match[3]
        });
      } else {
        // Pattern where quantity comes first
        items.push({
          name: match[3] ? match[3].trim() : match[1].trim(),
          quantity: parseFloat(match[1]),
          unit: match[2]
        });
      }
    }
  }
  
  // If no matches from patterns, look for any product mentions
  if (items.length === 0) {
    // Simple pattern: product name followed or preceded by number
    const simplePattern = /\b([a-zA-Z\s]{3,})\s+(\d+(?:\.\d+)?)|\b(\d+(?:\.\d+)?)\s+([a-zA-Z\s]{3,})\b/g;
    
    let match;
    while ((match = simplePattern.exec(command)) !== null) {
      if (match[1]) {
        // Product followed by number
        items.push({
          name: match[1].trim(),
          quantity: parseFloat(match[2]),
          unit: 'pcs'
        });
      } else {
        // Number followed by product
        items.push({
          name: match[4].trim(),
          quantity: parseFloat(match[3]),
          unit: 'pcs'
        });
      }
    }
  }
  
  // If still no items found, split by conjunctions and try to extract
  if (items.length === 0) {
    const segments = lowerCommand.split(/(?:,|\sand\s|\sthen\s)/i);
    
    for (const segment of segments) {
      if (segment.trim()) {
        const productNames = segment.match(/\b([a-zA-Z\s]{3,})\b/g);
        const quantities = segment.match(/\b(\d+(?:\.\d+)?)\b/g);
        
        if (productNames && productNames.length > 0) {
          const productName = productNames[0].trim();
          const quantity = quantities ? parseFloat(quantities[0]) : 1;
          
          // Only add if it looks like a valid product name (not a common word)
          if (productName.length > 3 && !/\b(?:add|get|put|bill|cart|item)\b/i.test(productName)) {
            items.push({
              name: productName,
              quantity: quantity,
              unit: 'pcs'
            });
          }
        }
      }
    }
  }
  
  return items;
};

/**
 * Detect command type from voice input
 */
export const detectCommandType = (command: string): CommandResult => {
  const lowerCommand = command.toLowerCase().trim();
  
  // ADD PRODUCT command
  if ((/\b(?:add|create|make)\s+(?:a\s+)?product\b/i.test(lowerCommand) || 
      /\badd\s+(?!\b(?:to|in|bill)\b)/i.test(lowerCommand)) && 
      !(/\b(?:bill|cart)\b/i.test(lowerCommand))) {
    
    const productDetails = extractProductDetails(command);
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: productDetails
    };
  }
  
  // CREATE BILL command
  if (/\b(?:create|make|start|new|add)\s+(?:a\s+)?bill\b/i.test(lowerCommand) || 
      /\bbill\s+(?:for|with)\b/i.test(lowerCommand) ||
      /\bbill\s+banao\b/i.test(lowerCommand)) {
    
    const items = extractBillItems(command);
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: { items }
    };
  }
  
  // Add items to bill
  if ((/\badd\s+(?:to|in)?\s+(?:the\s+)?bill\b/i.test(lowerCommand) || 
       /\b(?:to|in)\s+(?:the\s+)?bill\b/i.test(lowerCommand)) &&
      extractBillItems(command).length > 0) {
    
    const items = extractBillItems(command);
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: { items }
    };
  }
  
  // SEARCH PRODUCT command
  if (/\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?/i.test(lowerCommand)) {
    
    const searchTermRegex = /\b(?:search|find|locate|where)\s+(?:is|for)?\s+(?:the\s+)?([a-zA-Z\s]+)/i;
    const searchMatch = lowerCommand.match(searchTermRegex);
    const searchTerm = searchMatch ? searchMatch[1].trim() : '';
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { searchTerm }
    };
  }
  
  // FIND SHOPS command
  if (/\b(?:find|locate|show|display|get)\s+(?:nearby\s+)?shops\b/i.test(lowerCommand)) {
    
    const productRegex = /\bshops\s+(?:with|selling|for|having)\s+([a-zA-Z\s]+)/i;
    const productMatch = lowerCommand.match(productRegex);
    const product = productMatch ? productMatch[1].trim() : '';
    
    const radiusRegex = /\bwithin\s+(\d+(?:\.\d+)?)\s*(?:km|kilometers|miles|mi)\b/i;
    const radiusMatch = lowerCommand.match(radiusRegex);
    const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 5; // Default to 5km
    
    return {
      type: VOICE_COMMAND_TYPES.FIND_SHOPS,
      data: { product, radius }
    };
  }
  
  // SCAN BARCODE command
  if (/\b(?:scan|read)\s+(?:a\s+)?(?:barcode|qr\s+code|code)\b/i.test(lowerCommand)) {
    return {
      type: VOICE_COMMAND_TYPES.SCAN_BARCODE
    };
  }
  
  // STOCK ALERT command
  if (/\b(?:alert|notify|warn|set\s+alert|create\s+alert)\s+(?:me\s+)?(?:when|if)\b/i.test(lowerCommand) ||
      /\b(?:stock|inventory)\s+(?:alert|notification)\b/i.test(lowerCommand)) {
    
    const productRegex = /\b(?:when|if)\s+([a-zA-Z\s]+?)\s+(?:is|goes|falls)\s+(?:below|under|less\s+than)\b/i;
    const productMatch = lowerCommand.match(productRegex);
    const product = productMatch ? productMatch[1].trim() : '';
    
    const thresholdRegex = /\b(?:below|under|less\s+than)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pieces|packets)?\b/i;
    const thresholdMatch = lowerCommand.match(thresholdRegex);
    const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : 0;
    const unit = thresholdMatch && thresholdMatch[2] ? thresholdMatch[2] : 'pcs';
    
    return {
      type: VOICE_COMMAND_TYPES.STOCK_ALERT,
      data: { product, threshold, unit }
    };
  }
  
  // CHANGE SHOP TYPE command
  if (/\b(?:change|set|update)\s+(?:the\s+)?shop\s+(?:type|kind|category)\s+(?:to|as)\b/i.test(lowerCommand)) {
    
    const typeRegex = /\b(?:to|as)\s+([a-zA-Z\s]+)\b/i;
    const typeMatch = lowerCommand.match(typeRegex);
    const type = typeMatch ? typeMatch[1].trim() : '';
    
    return {
      type: VOICE_COMMAND_TYPES.CHANGE_SHOP_TYPE,
      data: { type }
    };
  }
  
  // Unknown command
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN
  };
};

/**
 * Process a billing voice command
 */
export const processBillingVoiceCommand = (command: string) => {
  const commandInfo = detectCommandType(command);
  
  if (commandInfo.type === VOICE_COMMAND_TYPES.CREATE_BILL && commandInfo.data?.items) {
    return commandInfo.data.items;
  }
  
  return [];
};

/**
 * Search for a product image using a generic placeholder
 * In a real app, this would connect to a product image API
 */
export const searchProductImage = async (productName: string): Promise<string | null> => {
  // This is a mock implementation that would normally call an API
  // to search for product images
  console.log(`Searching for image of: ${productName}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a placeholder image URL (in a real app, this would be from an API)
  return `https://placehold.co/200x200?text=${encodeURIComponent(productName)}`;
};
