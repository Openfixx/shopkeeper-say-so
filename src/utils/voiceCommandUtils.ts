/**
 * Voice Command Utilities
 * Functions for processing and handling voice commands
 */

import { processWithSpacy, extractProductDetailsFromEntities, Entity, SpacyProcessResult } from './spacyApi';
import { translateHindi } from '@/lib/translationCache';

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

export interface ProductDetails {
  name: string;
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
 * Extract product details from a voice command using SpaCy NLP
 */
export const extractProductDetails = async (command: string): Promise<ProductDetails> => {
  // First try to translate if it has Hindi characters
  const translatedCommand = await translateHindi(command);
  console.log('Translated command:', translatedCommand);
  
  // Process the command with SpaCy NLP
  const result = await processWithSpacy(translatedCommand);
  console.log('Extracted entities:', result.entities);
  
  // Extract structured product details from the entities
  const details = extractProductDetailsFromEntities(result.entities);
  
  // Enhanced number extraction - look specifically for quantities and numbers
  const enhancedDetails = await enhanceWithNumberExtraction(translatedCommand, details);
  
  // If SpaCy didn't find a product name, use fallback regex method
  if (!enhancedDetails.name) {
    const lowerCommand = translatedCommand.toLowerCase();
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
    
    if (productName) {
      enhancedDetails.name = productName;
    }
  }
  
  // Ensure we always return a valid product name
  if (!enhancedDetails.name) {
    enhancedDetails.name = "Unnamed Product";
  }
  
  console.log('Final extracted product details:', enhancedDetails);
  return enhancedDetails as ProductDetails;
};

/**
 * Enhanced number and quantity extraction
 */
const enhanceWithNumberExtraction = async (command: string, initialDetails: Partial<ProductDetails>): Promise<Partial<ProductDetails>> => {
  const details = { ...initialDetails };
  const lowerCommand = command.toLowerCase();
  
  // Extract quantities with more comprehensive regex patterns
  const quantityPatterns = [
    // X kg/g/l/ml etc.
    /(\d+(?:\.\d+)?)\s*(kg|किलो|किग्रा|कि\.ग्रा|kilogram|kilograms|gram|gm|g|गम|गाम|लीटर|लि|ml|मि\.ली|liter|liters|l|पैकेट|packet|packets|pcs|pieces|box|boxes)/gi,
    
    // X bags/containers
    /(\d+(?:\.\d+)?)\s*(bags|containers|bottles|jars|units|pack|पैक)/gi,
    
    // Numbers spelled out in English
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(kg|gram|liter|packet|piece|box)/gi,
    
    // Simple number followed by product
    /(\d+(?:\.\d+)?)\s+([a-zA-Z\s]{3,})/i
  ];
  
  // Try to extract quantity
  if (!details.quantity) {
    for (const pattern of quantityPatterns) {
      const match = pattern.exec(lowerCommand);
      if (match) {
        // Convert spelled numbers to digits if needed
        let quantity;
        if (['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].includes(match[1].toLowerCase())) {
          const numberWords = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          quantity = numberWords[match[1].toLowerCase() as keyof typeof numberWords];
        } else {
          quantity = parseFloat(match[1]);
        }
        
        details.quantity = quantity;
        details.unit = match[2] || 'pcs';
        break;
      }
    }
  }
  
  // Extract price information
  if (!details.price) {
    const pricePatterns = [
      // Standard price formats
      /₹\s*(\d+(?:\.\d+)?)/i,
      /rs\.?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*rupees/i,
      /price\s*(?:is|:)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i,
      /(?:costs|at|for)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i,
      
      // Hindi price mentions
      /(?:दाम|कीमत|मूल्य)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = lowerCommand.match(pattern);
      if (match && match[1]) {
        details.price = parseFloat(match[1]);
        break;
      }
    }
  }
  
  // IMPROVED: Extract position/rack information - extract ONLY the number, not "rack" or "shelf"
  if (!details.position) {
    // First look for explicit rack/shelf numbers with various patterns
    const numberWordMap: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    
    // First try to find rack/shelf with number
    const rackPatterns = [
      // Match "rack 3", "shelf 5", etc.
      /(?:rack|shelf)\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
      // Match "on rack 3", "in shelf 5", etc.
      /(?:on|in|at)\s+(?:rack|shelf)\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
      // Match "to rack 3", "to shelf 5", etc.
      /to\s+(?:rack|shelf)\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
      // Just rack/shelf number
      /rack\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
      /shelf\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i
    ];
    
    for (const pattern of rackPatterns) {
      const match = lowerCommand.match(pattern);
      if (match && match[1]) {
        // Convert word numbers to digits if needed
        if (numberWordMap[match[1].toLowerCase()]) {
          details.position = numberWordMap[match[1].toLowerCase()];
        } else {
          details.position = match[1];
        }
        console.log(`Found rack/shelf number: ${details.position}`);
        break;
      }
    }
    
    // If we still don't have a position, try a more general approach for any number after rack/shelf
    if (!details.position && (lowerCommand.includes('rack') || lowerCommand.includes('shelf'))) {
      const rackIndex = lowerCommand.indexOf('rack');
      const shelfIndex = lowerCommand.indexOf('shelf');
      const startIndex = Math.max(rackIndex, shelfIndex);
      
      if (startIndex >= 0) {
        // Look for a number in the next few words after "rack" or "shelf"
        const afterText = lowerCommand.substring(startIndex);
        const numberMatch = afterText.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
        
        if (numberMatch && numberMatch[1]) {
          if (numberWordMap[numberMatch[1].toLowerCase()]) {
            details.position = numberWordMap[numberMatch[1].toLowerCase()];
          } else {
            details.position = numberMatch[1];
          }
          console.log(`Found number after rack/shelf: ${details.position}`);
        }
      }
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
    
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: { command }
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
 * Search for a product image using DuckDuckGo API
 */
export const searchProductImage = async (productName: string): Promise<string | null> => {
  try {
    console.log(`Searching for image of product: ${productName}`);
    
    // Use the DuckDuckGo API through Supabase edge function
    const response = await fetch('/api/fetch-image?q=' + encodeURIComponent(productName), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.imageUrl) {
      console.log("Found image on DuckDuckGo:", data.imageUrl);
      return data.imageUrl;
    } else {
      console.log("DuckDuckGo API returned no results");
      // Return a placeholder
      return `https://placehold.co/200x200?text=${encodeURIComponent(productName)}`;
    }
  } catch (error) {
    console.error('Error searching for product image:', error);
    // Return a placeholder
    return `https://placehold.co/200x200?text=${encodeURIComponent(productName)}`;
  }
};

/**
 * Identify shelves in a rack image
 * In a real app, this would use computer vision
 */
export const identifyShelves = (imageUrl: string) => {
  // This is a mock implementation that would normally use computer vision
  console.log(`Analyzing rack image to identify shelves`);
  
  // Generate some mock shelf coordinates
  const numShelves = Math.floor(Math.random() * 3) + 3; // 3-5 shelves
  const shelfCoordinates = [];
  
  const shelfHeight = 100 / (numShelves + 1); // distribute evenly
  
  for (let i = 0; i < numShelves; i++) {
    shelfCoordinates.push({
      top: (i + 1) * shelfHeight,
      left: 0,
      width: 100,
      height: 10
    });
  }
  
  return {
    shelfCoordinates
  };
};

/**
 * Update existing product details with new information from voice command
 */
export const updateProductDetails = async (
  existingDetails: ProductDetails, 
  command: string
): Promise<ProductDetails> => {
  // Process the new command to extract entities
  const result = await processWithSpacy(command);
  const newDetails = extractProductDetailsFromEntities(result.entities);
  
  // Merge the new details with existing details, only updating fields
  // that were provided in the new command
  return {
    ...existingDetails,
    quantity: newDetails.quantity || existingDetails.quantity,
    unit: newDetails.unit || existingDetails.unit,
    position: newDetails.position || existingDetails.position,
    price: newDetails.price || existingDetails.price,
    expiry: newDetails.expiry || existingDetails.expiry,
  };
};
