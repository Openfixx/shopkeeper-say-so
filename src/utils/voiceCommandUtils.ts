// Define command types
export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  FIND_SHOP: 'find_shop',
  FIND_SHOPS: 'find_shops',
  SCAN_BARCODE: 'scan_barcode',
  STOCK_ALERT: 'stock_alert',
  CHANGE_SHOP_TYPE: 'change_shop_type',
  UNKNOWN: 'unknown'
};

interface ProductDetail {
  name?: string;
  quantity?: number;
  unit?: string;
  position?: string;
  expiry?: string;
  price?: number;
  image?: string;
}

interface BillItem {
  name: string;
  quantity: number;
}

interface CommandData {
  type: string;
  data?: {
    items?: BillItem[];
    query?: string;
    product?: string;
    searchTerm?: string;
    productDetails?: ProductDetail;
    [key: string]: any;
  };
}

// Function to extract product details from voice command
export function extractProductDetails(command: string): ProductDetail {
  const result: ProductDetail = {};
  const lowerCmd = command.toLowerCase();

  // More sophisticated product name extraction
  // Try to identify potential product names in the command
  const productPatterns = [
    /add\s+(?:\d+(?:\.\d+)?)\s*(?:kg|g|liters?|l|ml|pcs|pieces|units|boxes|packs|bottles)\s+(?:of\s+)?([a-zA-Z0-9 ]+)(?:\s+(?:in|on|at|to))?/i,
    /add\s+([a-zA-Z0-9 ]+)(?:\s+(?:\d+(?:\.\d+)?)\s*(?:kg|g|liters?|l|ml|pcs|pieces|units|boxes|packs|bottles))/i,
    /add\s+(?:a\s+|an\s+|)(?:new\s+|)(?:product\s+)?([a-zA-Z0-9 ]+)(?:\s+(?:\d+(?:\.\d+)?)\s*(?:kg|g|liters?|l|ml|pcs|pieces|units|boxes|packs|bottles))?/i,
  ];

  // Try each pattern to extract product name
  for (const pattern of productPatterns) {
    const match = lowerCmd.match(pattern);
    if (match && match[1]) {
      // Clean up the product name by removing units and positions
      let possibleName = match[1].trim();
      
      // Remove common units from the name if they somehow got included
      possibleName = possibleName.replace(/\b(?:kg|g|litre|liter|l|ml|pcs|pieces|units|boxes|packs|bottles)\b/gi, '').trim();
      
      // Remove position information if it got captured
      possibleName = possibleName.replace(/\b(?:in|on|at)\s+(?:rack|shelf|position|location)\s+\d+\b/gi, '').trim();
      
      // Remove "of" if it's in the beginning
      possibleName = possibleName.replace(/^of\s+/i, '').trim();
      
      // If after all the cleanup we still have a valid name (at least 2 chars)
      if (possibleName.length >= 2) {
        result.name = possibleName;
        break;
      }
    }
  }

  // If no name found with the sophisticated patterns, try a simpler approach
  if (!result.name) {
    // Split the command to find potential product name
    const words = lowerCmd.split(' ');
    const addIndex = words.findIndex(w => w === 'add');
    
    if (addIndex !== -1 && words.length > addIndex + 1) {
      // Start with the word after "add"
      let startIndex = addIndex + 1;
      
      // Skip words like "a", "an", "new", "product"
      while (startIndex < words.length && 
             ['a', 'an', 'new', 'product', 'the'].includes(words[startIndex])) {
        startIndex++;
      }
      
      if (startIndex < words.length) {
        // Extract a possible product name (1-3 words)
        const nameCandidate = words.slice(startIndex, startIndex + 3).join(' ');
        result.name = nameCandidate.trim();
      }
    }
  }

  // Extract quantity with improved pattern matching
  const quantityPatterns = [
    /(\d+\.?\d*)\s*(?:kg|kilograms?|kilos?)\b/i,
    /(\d+\.?\d*)\s*(?:g|grams?)\b/i,
    /(\d+\.?\d*)\s*(?:l|liters?|litres?)\b/i,
    /(\d+\.?\d*)\s*(?:ml|milliliters?|millilitres?)\b/i,
    /(\d+\.?\d*)\s*(?:pcs|pieces|units|boxes|packs|bottles)\b/i,
    /(\d+\.?\d*)\s*(?:m|meters?|metres?)\b/i,
    /(\d+\.?\d*)\s*(?:cm|centimeters?|centimetres?)\b/i,
    /(\d+\.?\d*)\s*(?:lb|pounds?)\b/i,
    /(\d+\.?\d*)\s*(?:oz|ounces?)\b/i,
    /(\d+\.?\d*)\s*(?:fl oz|fluid ounces?)\b/i,
    /(\d+\.?\d*)\s*(?:gal|gallons?)\b/i,
    /(\d+\.?\d*)\s*(?:ft|feet|foot)\b/i,
    /(\d+\.?\d*)\s*(?:in|inches?)\b/i,
  ];

  for (const pattern of quantityPatterns) {
    const match = lowerCmd.match(pattern);
    if (match && match[1]) {
      result.quantity = parseFloat(match[1]);
      
      // Extract unit from the match
      const unitMatch = lowerCmd.substr(match.index + match[1].length).match(/^\s*([a-zA-Z ]+)\b/i);
      if (unitMatch && unitMatch[1]) {
        result.unit = unitMatch[1].trim().toLowerCase();
      }
      
      break;
    }
  }

  // Extract position/location with improved pattern matching
  const positionPatterns = [
    /(?:in|on|at)\s+(?:rack|shelf|position|location)\s+(?:number\s+)?(\d+)/i,
    /(?:rack|shelf|position|location)\s+(?:number\s+)?(\d+)/i,
    /(?:in|on|at)\s+(?:the\s+)?(\w+)\s+(?:rack|shelf|position|location)/i,
  ];

  for (const pattern of positionPatterns) {
    const match = lowerCmd.match(pattern);
    if (match && match[1]) {
      if (/^\d+$/.test(match[1])) {
        // If it's a number, format it as "Rack X" or "Shelf X"
        result.position = lowerCmd.includes('shelf') ? 
          `Shelf ${match[1]}` : `Rack ${match[1]}`;
      } else {
        // Otherwise use the descriptor (e.g., "top shelf")
        result.position = `${match[1]} ${lowerCmd.includes('shelf') ? 'shelf' : 'rack'}`;
      }
      break;
    }
  }

  // Extract price with improved pattern matching
  const pricePatterns = [
    /(?:price|cost|worth|value)(?:\s+is|\s+of)?\s+(?:rs\.?|₹|inr)?\s*(\d+\.?\d*)/i,
    /(?:rs\.?|₹|inr)\s*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*(?:rupees|rs\.?|₹|inr)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = lowerCmd.match(pattern);
    if (match && match[1]) {
      result.price = parseFloat(match[1]);
      break;
    }
  }

  // Extract expiry date
  const expiryMatch = lowerCmd.match(/(?:expiry|expiration|expires)(?:date| date|)\s+(?:is\s+|on\s+|)([a-zA-Z0-9 ,-]+)/i);
  if (expiryMatch) {
    const dateStr = expiryMatch[1].trim();
    
    // Try to parse the date
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        result.expiry = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    } catch (error) {
      console.error('Failed to parse expiry date:', error);
    }
  }

  return result;
}

// Function to extract bill items from voice command
export function extractBillItems(command: string): BillItem[] {
  const items: BillItem[] = [];
  const lowerCmd = command.toLowerCase();

  // Pattern to match quantities and product names
  // This handles formats like "2 kg sugar", "5 apples", etc.
  const quantityPattern = /(\d+\.?\d*)\s+(kg|g|pcs|liters|pieces|units|boxes|gram|pack|packet|bottle|bottles|)?\s*(?:of\s+)?([a-zA-Z0-9 ]+?)(?:,|and|\.|$)/gi;

  let match;
  while ((match = quantityPattern.exec(lowerCmd)) !== null) {
    const quantity = parseFloat(match[1]);
    let name = match[3].trim();
    
    // Skip if name is empty or likely not a product
    // Filter out common non-product words
    const skipWords = ['items', 'products', 'things', 'product', 'bill', 'create', 'make', 'add'];
    if (name.length < 2 || skipWords.includes(name)) continue;
    
    items.push({
      name,
      quantity: isNaN(quantity) ? 1 : quantity
    });
  }

  // If no items with quantities found, try to extract just product names
  if (items.length === 0) {
    // Look for product names without quantities
    const productPattern = /(?:add|with|and)\s+([a-zA-Z]+)(?:\s+to\s+bill|\s+to\s+cart|,|and|$)/gi;
    
    while ((match = productPattern.exec(lowerCmd)) !== null) {
      const name = match[1].trim();
      
      // Skip short names and common words
      if (name.length < 3 || ['the', 'and', 'bill', 'cart', 'add', 'create'].includes(name)) continue;
      
      items.push({
        name,
        quantity: 1
      });
    }
  }

  return items;
}

// Function to search for a product image - exported with both names for compatibility
export async function searchProductImage(productName: string): Promise<string | null> {
  const mockImages: Record<string, string> = {
    'sugar': 'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'salt': 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'rice': 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'flour': 'https://images.unsplash.com/photo-1627485937980-221ea163c3c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'bread': 'https://images.unsplash.com/photo-1559382710-9f549cc5ddb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'butter': 'https://images.unsplash.com/photo-1589985270958-bf087efb3514?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'egg': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'chicken': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'fish': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'banana': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'orange': 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'onion': 'https://images.unsplash.com/photo-1508747703725-719777637510?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'tomato': 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'pen': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'book': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'phone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  };
  
  const lowerProductName = productName.toLowerCase();
  
  if (mockImages[lowerProductName]) {
    return mockImages[lowerProductName];
  }
  
  for (const key in mockImages) {
    if (lowerProductName.includes(key) || key.includes(lowerProductName)) {
      return mockImages[key];
    }
  }
  
  return '/placeholder.svg';
}

// Export with both names for compatibility
export const fetchProductImageUrl = searchProductImage;

// Mock function to check product in a shared database
export async function checkProductInSharedDatabase(productName: string): Promise<ProductDetail | null> {
  const mockDatabase: Record<string, ProductDetail> = {
    'sugar': {
      name: 'Sugar',
      unit: 'kg',
      price: 45,
      image: 'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    'salt': {
      name: 'Salt',
      unit: 'kg',
      price: 20,
      image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    'rice': {
      name: 'Rice',
      unit: 'kg',
      price: 60,
      image: 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    'flour': {
      name: 'Flour',
      unit: 'kg',
      price: 40,
      image: 'https://images.unsplash.com/photo-1627485937980-221ea163c3c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    'oil': {
      name: 'Cooking Oil',
      unit: 'liters',
      price: 120,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    }
  };

  const lowerName = productName.toLowerCase();
  
  if (mockDatabase[lowerName]) {
    return mockDatabase[lowerName];
  }
  
  for (const key in mockDatabase) {
    if (key.includes(lowerName) || lowerName.includes(key)) {
      return mockDatabase[key];
    }
  }
  
  return null;
}

// Mock function to identify shelves in a rack image
export function identifyShelves(imageUrl: string): { shelfCoordinates: Array<{top: number, left: number, width: number, height: number}> } {
  return {
    shelfCoordinates: [
      { top: 10, left: 5, width: 90, height: 15 },
      { top: 30, left: 5, width: 90, height: 15 },
      { top: 50, left: 5, width: 90, height: 15 },
      { top: 70, left: 5, width: 90, height: 15 }
    ]
  };
}

// Process billing voice command
export function processBillingVoiceCommand(command: string): BillItem[] {
  return extractBillItems(command);
}

// Main function to detect command type and extract data
export function detectCommandType(command: string): CommandData {
  const lowerCmd = command.toLowerCase();
  
  if (
    lowerCmd.includes('add product') ||
    lowerCmd.includes('add a product') ||
    lowerCmd.includes('add new product') ||
    lowerCmd.includes('create product') ||
    lowerCmd.includes('create a product') ||
    (lowerCmd.startsWith('add ') && !lowerCmd.includes('to bill') && !lowerCmd.includes('to cart'))
  ) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: {
        productDetails: extractProductDetails(command)
      }
    };
  }
  
  if (
    lowerCmd.includes('create bill') ||
    lowerCmd.includes('make bill') ||
    lowerCmd.includes('new bill') ||
    lowerCmd.includes('start bill') ||
    lowerCmd.includes('add bill') ||
    lowerCmd.includes('bill banao') ||
    lowerCmd.includes('bill banado')
  ) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: {
        items: extractBillItems(command)
      }
    };
  }
  
  if (
    lowerCmd.includes('search for') ||
    lowerCmd.includes('find product') ||
    lowerCmd.includes('look for') ||
    lowerCmd.includes('where is') ||
    lowerCmd.includes('locate')
  ) {
    let query = '';
    
    const searchPatterns = [
      /search for ([a-zA-Z0-9 ]+)/i,
      /find product ([a-zA-Z0-9 ]+)/i,
      /look for ([a-zA-Z0-9 ]+)/i,
      /where is ([a-zA-Z0-9 ]+)/i,
      /locate ([a-zA-Z0-9 ]+)/i
    ];
    
    for (const pattern of searchPatterns) {
      const match = lowerCmd.match(pattern);
      if (match && match[1]) {
        query = match[1].trim();
        break;
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { 
        query,
        searchTerm: query
      }
    };
  }
  
  if (
    lowerCmd.includes('find shop') ||
    lowerCmd.includes('locate shop') ||
    lowerCmd.includes('nearby shop') ||
    lowerCmd.includes('where can i find') ||
    lowerCmd.includes('shop near me')
  ) {
    let query = '';
    
    const shopPatterns = [
      /find shop (?:for|selling|with) ([a-zA-Z0-9 ]+)/i,
      /where can i find ([a-zA-Z0-9 ]+)/i,
      /locate shop (?:for|selling|with) ([a-zA-Z0-9 ]+)/i
    ];
    
    for (const pattern of shopPatterns) {
      const match = lowerCmd.match(pattern);
      if (match && match[1]) {
        query = match[1].trim();
        break;
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.FIND_SHOP,
      data: { 
        query,
        product: query
      }
    };
  }
  
  if (
    lowerCmd.includes('find shops') ||
    lowerCmd.includes('locate shops') ||
    lowerCmd.includes('nearby shops') ||
    lowerCmd.includes('where can i find shops') ||
    lowerCmd.includes('shops near me')
  ) {
    let query = '';
    
    const shopPatterns = [
      /find shops (?:for|selling|with) ([a-zA-Z0-9 ]+)/i,
      /where can i find shops ([a-zA-Z0-9 ]+)/i,
      /locate shops (?:for|selling|with) ([a-zA-Z0-9 ]+)/i
    ];
    
    for (const pattern of shopPatterns) {
      const match = lowerCmd.match(pattern);
      if (match && match[1]) {
        query = match[1].trim();
        break;
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.FIND_SHOPS,
      data: { 
        query,
        product: query
      }
    };
  }
  
  if (
    lowerCmd.includes('scan barcode') ||
    lowerCmd.includes('scan code') ||
    lowerCmd.includes('barcode scan') ||
    lowerCmd.includes('read barcode')
  ) {
    return {
      type: VOICE_COMMAND_TYPES.SCAN_BARCODE,
      data: { originalCommand: command }
    };
  }
  
  if (
    lowerCmd.includes('stock alert') ||
    lowerCmd.includes('low stock') ||
    lowerCmd.includes('alert when') ||
    lowerCmd.includes('notify when')
  ) {
    // Try to extract product name
    let product = '';
    const alertPatterns = [
      /alert (?:me |)(?:when |if |)([a-zA-Z0-9 ]+) is (?:below|low|out)/i,
      /stock alert (?:for |on |)([a-zA-Z0-9 ]+)/i
    ];
    
    for (const pattern of alertPatterns) {
      const match = lowerCmd.match(pattern);
      if (match && match[1]) {
        product = match[1].trim();
        break;
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.STOCK_ALERT,
      data: { 
        originalCommand: command,
        product
      }
    };
  }
  
  if (
    lowerCmd.includes('change shop type') ||
    lowerCmd.includes('switch shop type') ||
    lowerCmd.includes('update shop type') ||
    lowerCmd.includes('set shop type')
  ) {
    // Try to extract shop type
    let type = '';
    const typePatterns = [
      /change shop type (?:to |)([a-zA-Z0-9 ]+)/i,
      /set shop type (?:to |as |)([a-zA-Z0-9 ]+)/i
    ];
    
    for (const pattern of typePatterns) {
      const match = lowerCmd.match(pattern);
      if (match && match[1]) {
        type = match[1].trim();
        break;
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.CHANGE_SHOP_TYPE,
      data: { 
        originalCommand: command,
        type
      }
    };
  }
  
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    data: { originalCommand: command }
  };
}
