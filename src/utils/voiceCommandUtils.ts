
// Define the ProductDetails interface
interface ProductDetails {
  name: string;
  quantity?: number;
  unit?: string;
  position?: string;
  price?: number;
  expiry?: string;
  image?: string;
}

// Voice command types enum
export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  FIND_SHOPS: 'find_shops',
  UNKNOWN: 'unknown'
};

// Define unit synonyms for better parsing
export const UNIT_SYNONYMS = {
  kg: ["kilograms", "kilos", "kgs", "kilogram"],
  g: ["grams", "gram", "gm", "gs"],
  l: ["liters", "litres", "ltr", "ltrs", "lt", "lts"],
  ml: ["milliliters", "millilitres", "millilit"],
  packet: ["pack", "pk", "pkt", "packets", "packs", "sachet", "sachets"],
  bottle: ["btl", "bott", "bottles", "btls"],
  can: ["cans", "tin", "tins"],
  box: ["boxes", "bx", "bxs"],
  piece: ["pieces", "pc", "pcs", "units", "unit", "item", "items"],
  dozen: ["dozens", "doz"],
};

// Function to normalize units based on synonyms
export const normalizeUnit = (rawUnit: string): string => {
  if (!rawUnit) return "piece"; // Default unit
  
  const lowerUnit = rawUnit.toLowerCase();
  for (const [standardUnit, synonyms] of Object.entries(UNIT_SYNONYMS)) {
    if (lowerUnit === standardUnit || synonyms.includes(lowerUnit)) {
      return standardUnit;
    }
  }
  
  return lowerUnit; // Return as is if no match found
};

/**
 * Detect command type from voice input with expanded phrase recognition
 */
export const detectCommandType = (text: string) => {
  const lowerText = text.toLowerCase();
  
  // Detect bill creation commands with expanded phrase patterns
  if (
    lowerText.includes('create bill') ||
    lowerText.includes('new bill') ||
    lowerText.includes('make bill') ||
    lowerText.includes('start bill') ||
    lowerText.includes('generate bill') ||
    lowerText.includes('prepare bill') ||
    lowerText.includes('begin billing') ||
    lowerText.includes('create invoice') ||
    lowerText.includes('checkout') ||
    lowerText.includes('print bill') ||
    lowerText.includes('issue bill') ||
    lowerText.includes('create receipt') ||
    lowerText.includes('make receipt') ||
    lowerText.includes('generate receipt') ||
    lowerText.includes('start checkout') ||
    lowerText.includes('bill for') ||
    lowerText.includes('billing') ||
    lowerText.includes('sale') ||
    lowerText.includes('total so far') ||
    lowerText.includes('what\'s my total')
  ) {
    // Extract items mentioned in the bill command
    const items = extractBillItems(text);
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: { items }
    };
  }
  
  // Detect add product commands with expanded phrase patterns
  if (
    lowerText.includes('add ') || 
    lowerText.includes('create ') ||
    lowerText.includes('insert ') ||
    lowerText.includes('put ') ||
    lowerText.includes('register ') ||
    lowerText.includes('include ') ||
    lowerText.includes('log ') ||
    lowerText.includes('record ') ||
    lowerText.includes('enter ') ||
    lowerText.includes('save ') ||
    lowerText.includes('store ') ||
    lowerText.includes('place ') ||
    lowerText.includes('set up ') ||
    lowerText.includes('new product') ||
    lowerText.includes('make entry') ||
    lowerText.includes('bring in') ||
    lowerText.includes('stock ') ||
    lowerText.includes('upload ') ||
    lowerText.includes('need ') || // Added "need" as in "Need 3 cans of beans"
    lowerText.match(/^\d+\s+/) // Starts with a number (like "5 sachets of tea")
  ) {
    // Make sure it's not about bill creation
    if (!lowerText.includes('bill') && !lowerText.includes('invoice') && !lowerText.includes('receipt')) {
      return {
        type: VOICE_COMMAND_TYPES.ADD_PRODUCT
      };
    }
  }
  
  // Detect search commands
  if (
    lowerText.includes('search') || 
    lowerText.includes('find ') ||
    lowerText.includes('look for') ||
    lowerText.includes('locate') ||
    lowerText.includes('where is') ||
    lowerText.includes('show me') ||
    lowerText.includes('check if') ||
    lowerText.includes('do we have')
  ) {
    let searchTerm = null;
    
    // Try to extract what we're searching for
    const searchMatches = lowerText.match(/(?:search|find|look for|where is|show me|locate|check if|do we have)\s+(?:for\s+)?(.+?)(?:\s+in|\s+on|\s+at|$)/i);
    if (searchMatches && searchMatches[1]) {
      searchTerm = searchMatches[1].trim();
    }
    
    // If it mentions shop/store, it's shop search
    if (lowerText.includes('shop') || lowerText.includes('store')) {
      return {
        type: VOICE_COMMAND_TYPES.FIND_SHOPS,
        data: { searchTerm }
      };
    }
    
    // Otherwise it's product search
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { searchTerm }
    };
  }
  
  // Default to unknown command
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN
  };
};

/**
 * Extract items mentioned in bill creation commands
 */
export const extractBillItems = (text: string) => {
  const items = [];
  const pattern = /(\d+)\s+(.+?)(?=\s+\d+\s+|\s+and\s+|\s+with\s+|$)/gi;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const quantity = parseInt(match[1]);
    const name = match[2].trim();
    
    if (!isNaN(quantity) && name) {
      items.push({
        name,
        quantity
      });
    }
  }
  
  return items;
};

/**
 * Process billing voice commands
 */
export const processBillingVoiceCommand = (command: string) => {
  const commandInfo = detectCommandType(command);
  return {
    type: commandInfo.type,
    items: commandInfo.type === VOICE_COMMAND_TYPES.CREATE_BILL ? 
      commandInfo.data?.items || [] : 
      extractBillItems(command)
  };
};

/**
 * Identify shelves from voice command
 */
export const identifyShelves = (text: string) => {
  const shelves = [];
  const shelfPattern = /(?:shelf|rack|position)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/gi;
  let match;
  
  const numberMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };

  while ((match = shelfPattern.exec(text)) !== null) {
    let shelfNumber;
    if (isNaN(parseInt(match[1]))) {
      shelfNumber = numberMap[match[1].toLowerCase()] || 0;
    } else {
      shelfNumber = parseInt(match[1]);
    }
    
    shelves.push({
      type: match[0].toLowerCase().includes('shelf') ? 'shelf' : 'rack',
      number: shelfNumber
    });
  }
  
  // Return both shelves array and a mock shelfCoordinates array for RackMapping component
  return {
    shelves,
    shelfCoordinates: [
      { top: 10, left: 10, width: 80, height: 20 },
      { top: 40, left: 10, width: 80, height: 20 },
      { top: 70, left: 10, width: 80, height: 20 }
    ]
  };
};

/**
 * Search for product image using name
 */
export const searchProductImage = async (productName: string): Promise<string> => {
  try {
    const response = await fetch(`/api/fetch-image?q=${encodeURIComponent(productName)}`, {
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
      return data.imageUrl;
    }
    
    // Fallback to placeholder
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  } catch (error) {
    console.error("Error fetching product image:", error);
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

/**
 * Process text using NLP/NER system
 */
const processText = async (text: string) => {
  try {
    // Using a mock implementation for now
    // This would ideally call a backend NLP service
    const mockedEntities = [];
    
    // Simple pattern matching for demonstration - enhanced with more patterns
    // Product name - expanded patterns
    const productPatterns = [
      /add\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /create\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /insert\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i, 
      /put\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /record\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /save\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /log\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i,
      /need\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i  // Added pattern for "need" commands
    ];
    
    for (const pattern of productPatterns) {
      const productMatch = text.match(pattern);
      if (productMatch && productMatch[1]) {
        mockedEntities.push({
          text: productMatch[1].trim(),
          label: 'PRODUCT'
        });
        break; // Found a match, exit loop
      }
    }
    
    // Enhanced quantity pattern to recognize more units and number words
    const quantityPattern = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(kg|g|ml|l|litre|liter|packet|packets|pack|packs|bottle|bottles|can|cans|sachet|sachets|piece|pieces|pcs|box|boxes|unit|units|dozen|dozens)/i;
    const quantityMatch = text.match(quantityPattern);
    
    if (quantityMatch) {
      // Convert number words to digits
      const numberMap: Record<string, string> = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
      };
      
      const quantityText = quantityMatch[1].toLowerCase();
      const quantityValue = numberMap[quantityText] || quantityMatch[1];
      
      mockedEntities.push({
        text: quantityValue,
        label: 'QUANTITY'
      });
      
      // Normalize unit using our synonym function
      const rawUnit = quantityMatch[2].toLowerCase();
      const normalizedUnit = normalizeUnit(rawUnit);
      
      mockedEntities.push({
        text: normalizedUnit,
        label: 'UNIT'
      });
    }
    
    // Position (rack/shelf) - expanded patterns
    const positionPatterns = [
      /(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i,
      /on\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i,
      /in\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i,
      /at\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i,
      /from\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)/i,
      /(the|in|on|at|from)\s+(fridge|storage|counter|shelf|rack)/i
    ];
    
    for (const pattern of positionPatterns) {
      const positionMatch = text.match(pattern);
      if (positionMatch) {
        mockedEntities.push({
          text: positionMatch[0],
          label: 'POSITION'
        });
        break; // Found a match, exit loop
      }
    }
    
    // Price - expanded patterns
    const pricePatterns = [
      /(?:price|cost|₹|Rs|rupees)\s*(\d+)/i,
      /for\s*(?:price|cost|₹|Rs|rupees)?\s*(\d+)/i,
      /at\s*(?:price|cost|₹|Rs|rupees)?\s*(\d+)/i,
      /worth\s*(?:price|cost|₹|Rs|rupees)?\s*(\d+)/i,
      /costs?\s*(?:price|cost|₹|Rs|rupees)?\s*(\d+)/i,
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = text.match(pattern);
      if (priceMatch) {
        mockedEntities.push({
          text: priceMatch[1],
          label: 'PRICE'
        });
        break; // Found a match, exit loop
      }
    }
    
    // Add expiry date extraction
    const expiryPatterns = [
      /expir(?:y|ing|es)\s+(next\s+\w+|tomorrow|in\s+\d+\s+days|in\s+a\s+\w+|on\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /(?:use|valid)\s+(?:before|until|by)\s+(.+?)(?=\s+and|\s+with|\s+for|$)/i
    ];
    
    for (const pattern of expiryPatterns) {
      const expiryMatch = text.match(pattern);
      if (expiryMatch && expiryMatch[1]) {
        mockedEntities.push({
          text: expiryMatch[1].trim(),
          label: 'EXPIRY'
        });
        break;
      }
    }
    
    return {
      text,
      entities: mockedEntities
    };
  } catch (error) {
    console.error('Error processing text:', error);
    return {
      text,
      entities: []
    };
  }
};

// Add this function to extract product details from entities
export const extractProductDetailsFromEntities = (entities: any[]): Partial<ProductDetails> => {
  const details: Partial<ProductDetails> = {
    name: '',
  };
  
  if (entities) {
    for (const entity of entities) {
      switch (entity.label) {
        case 'PRODUCT':
          details.name = entity.text;
          break;
        case 'QUANTITY':
          details.quantity = parseFloat(entity.text);
          break;
        case 'UNIT':
          details.unit = entity.text.toLowerCase();
          break;
        case 'POSITION':
        case 'LOCATION':
          // Extract just the number from position entities like "rack 3"
          const positionMatch = entity.text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|b|c|d|e|f)\b/i);
          if (positionMatch) {
            // Convert number words to digits if needed
            const numberWords: Record<string, string> = {
              'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
              'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
            };
            
            const positionNumber = numberWords[positionMatch[1].toLowerCase()] || positionMatch[1];
            
            // Get the location type (shelf, rack, etc.)
            const locationType = entity.text.match(/(rack|shelf|section|aisle|row|cabinet|drawer|bin|box|fridge|storage|counter)/i);
            if (locationType) {
              details.position = `${locationType[1]} ${positionNumber}`;
            } else {
              details.position = positionNumber;
            }
          } else if (entity.text.match(/(fridge|storage|counter|shelf|rack)/i)) {
            // Handle simple location names without numbers
            const locMatch = entity.text.match(/(fridge|storage|counter|shelf|rack)/i);
            if (locMatch) {
              details.position = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1);
            } else {
              details.position = entity.text;
            }
          } else {
            details.position = entity.text;
          }
          break;
        case 'PRICE':
          details.price = parseFloat(entity.text.replace(/[₹$]/g, ''));
          break;
        case 'DATE':
        case 'EXPIRY':
          details.expiry = entity.text;
          break;
      }
    }
  }
  
  return details;
};

/**
 * Extract product details from a voice command
 */
export const extractProductDetails = async (command: string): Promise<ProductDetails> => {
  // Process the command to extract entities
  const result = await processText(command);
  
  // Use the helper function to extract details from entities
  const details = extractProductDetailsFromEntities(result.entities);
  
  // Ensure there's at least a default name
  if (!details.name) {
    // Try to extract product name with regex as fallback
    const productMatch = command.match(/add\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|\s+price|\s+₹|$)/i);
    if (productMatch && productMatch[1]) {
      details.name = productMatch[1].trim();
    } else {
      details.name = '';
    }
  }
  
  // Set default position if not detected
  if (!details.position) {
    details.position = "unspecified";
  }
  
  return details as ProductDetails;
};

/**
 * Validate product details to ensure they meet requirements
 */
export const validateProductDetails = (product: ProductDetails): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  // Check for required fields
  if (!product.name || product.name.trim() === '') {
    missingFields.push('product name');
  }
  
  if (product.quantity === undefined || product.quantity <= 0) {
    missingFields.push('quantity');
  }
  
  if (!product.unit) {
    missingFields.push('unit');
  }
  
  // Position is now required, with a default of "unspecified"
  if (!product.position) {
    missingFields.push('location');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Parse and validate a multi-product command
 */
export const parseMultiProductCommand = (command: string): ProductDetails[] => {
  // Split by commas and "and" to handle multiple products
  const parts = command.split(/,|\s+and\s+/i);
  const products: ProductDetails[] = [];
  
  for (const part of parts) {
    if (!part.trim()) continue; // Skip empty parts
    
    // Process each part to extract product details
    processText(part.trim()).then(result => {
      const details = extractProductDetailsFromEntities(result.entities) as ProductDetails;
      
      // Set default position if not detected
      if (!details.position) {
        details.position = "unspecified";
      }
      
      products.push(details);
    });
  }
  
  return products;
};

/**
 * Update existing product details with new information from voice command
 */
export const updateProductDetails = async (
  existingDetails: ProductDetails, 
  command: string
): Promise<ProductDetails> => {
  // Process the new command to extract entities
  const result = await processText(command);
  const newDetails = extractProductDetailsFromEntities(result.entities);
  
  // Merge the new details with existing details, only updating fields
  // that were provided in the new command
  return {
    ...existingDetails,
    quantity: newDetails.quantity || existingDetails.quantity,
    unit: newDetails.unit || existingDetails.unit,
    position: newDetails.position || existingDetails.position || "unspecified",
    price: newDetails.price || existingDetails.price,
    expiry: newDetails.expiry || existingDetails.expiry,
  };
};

/**
 * Function to suggest a default location based on product type
 */
export const suggestLocationForProduct = (productName: string): string => {
  productName = productName.toLowerCase();
  
  // Define some common product categories and their default locations
  const categoryLocations: Record<string, string[]> = {
    "Fridge": [
      "milk", "cheese", "yogurt", "curd", "butter", "cream", "egg", "juice", "cold", 
      "fish", "meat", "chicken", "sausage", "bacon", "dairy"
    ],
    "Pantry": [
      "rice", "flour", "sugar", "salt", "spice", "oil", "pasta", "noodle", "cereal",
      "grain", "pulse", "lentil", "bean", "dal", "masala"
    ],
    "Freezer": [
      "ice cream", "frozen", "pizza", "ice"
    ],
    "Shelf A": [
      "snack", "biscuit", "cookie", "cracker", "chip", "chocolate", "candy", "sweet"
    ],
    "Shelf B": [
      "tea", "coffee", "beverage", "drink", "water", "soda", "soft drink"
    ],
    "Shelf C": [
      "cleaning", "soap", "detergent", "dishwash", "sanitizer", "cleaner"
    ]
  };
  
  // Check each category to find a match
  for (const [location, keywords] of Object.entries(categoryLocations)) {
    for (const keyword of keywords) {
      if (productName.includes(keyword)) {
        return location;
      }
    }
  }
  
  return "General Storage"; // Default location
};

