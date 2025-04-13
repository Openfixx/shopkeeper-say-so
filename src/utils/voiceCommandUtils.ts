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

/**
 * Detect command type from voice input
 */
export const detectCommandType = (text: string) => {
  const lowerText = text.toLowerCase();
  
  // Detect bill creation commands
  if (
    lowerText.includes('create bill') ||
    lowerText.includes('new bill') ||
    lowerText.includes('make bill') ||
    lowerText.includes('start bill') ||
    lowerText.includes('generate bill')
  ) {
    // Extract items mentioned in the bill command
    const items = extractBillItems(text);
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      data: { items }
    };
  }
  
  // Detect add product commands
  if (
    lowerText.includes('add ') && 
    !lowerText.includes('bill')
  ) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT
    };
  }
  
  // Detect search commands
  if (
    lowerText.includes('search') || 
    lowerText.includes('find ')
  ) {
    let searchTerm = null;
    
    // Try to extract what we're searching for
    const searchMatches = lowerText.match(/(?:search|find|look for)\s+(?:for\s+)?(.+?)(?:\s+in|\s+on|\s+at|$)/i);
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
  
  return shelves;
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
    
    // Simple pattern matching for demonstration
    // Product name
    const productMatch = text.match(/add\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|$)/i);
    if (productMatch && productMatch[1]) {
      mockedEntities.push({
        text: productMatch[1].trim(),
        label: 'PRODUCT'
      });
    }
    
    // Quantity
    const quantityMatch = text.match(/(\d+)\s*(kg|g|ml|l|pieces?|pcs)/i);
    if (quantityMatch) {
      mockedEntities.push({
        text: quantityMatch[1],
        label: 'QUANTITY'
      });
      mockedEntities.push({
        text: quantityMatch[2],
        label: 'UNIT'
      });
    }
    
    // Position (rack/shelf)
    const positionMatch = text.match(/(rack|shelf)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
    if (positionMatch) {
      mockedEntities.push({
        text: `${positionMatch[1]} ${positionMatch[2]}`,
        label: 'POSITION'
      });
    }
    
    // Price
    const priceMatch = text.match(/(?:price|cost|₹|Rs|rupees)\s*(\d+)/i);
    if (priceMatch) {
      mockedEntities.push({
        text: priceMatch[1],
        label: 'PRICE'
      });
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

// Add this function near the end of the file, before the updateProductDetails function
const extractProductDetailsFromEntities = (entities: any[]): Partial<ProductDetails> => {
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
          const positionMatch = entity.text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
          if (positionMatch) {
            // Convert number words to digits if needed
            const numberWords: Record<string, string> = {
              'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
              'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
            };
            
            const positionNumber = numberWords[positionMatch[1].toLowerCase()] || positionMatch[1];
            details.position = positionNumber;
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
  
  return details as ProductDetails;
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
    position: newDetails.position || existingDetails.position,
    price: newDetails.price || existingDetails.price,
    expiry: newDetails.expiry || existingDetails.expiry,
  };
};
