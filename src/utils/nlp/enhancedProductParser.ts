import Fuse from 'fuse.js';

export interface EnhancedProduct {
  name: string;
  quantity?: number;
  unit?: string;
  position?: string;
  price?: number;
  expiry?: string | Date;
  confidence?: number;
  variant?: {
    size?: string;
    color?: string;
    type?: string;
  };
}

interface ParsingResult {
  products: EnhancedProduct[];
  detectedLocation?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
}

// Mapping common units to standardized units
const unitMapping: Record<string, string> = {
  'kilo': 'kg',
  'kilos': 'kg',
  'kgs': 'kg',
  'gram': 'g',
  'grams': 'g',
  'liter': 'l',
  'liters': 'l',
  'litre': 'l',
  'litres': 'l',
  'ml': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'millilitre': 'ml',
  'millilitres': 'ml',
  'piece': 'pcs',
  'pieces': 'pcs',
  'pc': 'pcs',
  'packs': 'pack',
  'packets': 'pack',
  'boxes': 'box',
};

/**
 * Enhanced product voice command parser with fuzzy matching and multi-product parsing
 */
export const parseEnhancedVoiceCommand = (command: string, productList: { name: string }[] = []): ParsingResult => {
  console.log("Parsing command:", command);
  
  // Initialize result
  const result: ParsingResult = {
    products: [],
    needsClarification: false
  };

  if (!command) return result;

  // Step 1: Determine if this is a multi-product command
  const isMultiCommand = command.includes(',') || 
                         /\band\b|\balso\b|\bplus\b|\balong with\b|\btogether with\b|\bas well as\b/i.test(command);

  if (isMultiCommand) {
    // Split the command into parts for multi-product parsing
    const parts = command.split(/,|\sand\s|\salso\s|\splus\s|\salong with\s|\stogether with\s|\swith\s|\sas well as\s/i);
    
    console.log("Splitting multi-command into parts:", parts);
    
    for (const part of parts) {
      if (part.trim()) {
        const productDetails = extractProductDetails(part.trim(), productList);
        
        // Only add to results if we found a product
        if (productDetails.name) {
          // Check confidence level
          if (productDetails.confidence && productDetails.confidence < 0.8) {
            result.needsClarification = true;
            result.clarificationQuestion = `Did you mean "${productDetails.name}"?`;
            
            // Provide options based on fuzzy matches
            if (productList.length > 0) {
              const fuse = new Fuse(productList, { keys: ['name'], threshold: 0.6 });
              const matches = fuse.search(productDetails.name);
              result.clarificationOptions = matches.slice(0, 3).map(match => match.item.name);
              
              // Add the original as an option too
              if (!result.clarificationOptions.includes(productDetails.name)) {
                result.clarificationOptions.push(productDetails.name);
              }
            }
          }
          
          result.products.push(productDetails);
        }
      }
    }
    
    // Check for location in the full command
    const location = extractLocationInfo(command);
    if (location) {
      result.detectedLocation = location;
      
      // Apply location to all products
      result.products.forEach(product => {
        if (!product.position) {
          product.position = location;
        }
      });
    } else {
      // Add default location if none detected
      result.products.forEach(product => {
        if (!product.position) {
          product.position = "unspecified";
        }
      });
    }
  } else {
    // Single product parsing
    const productDetails = extractProductDetails(command, productList);
    
    // Check confidence level
    if (productDetails.name) {
      if (productDetails.confidence && productDetails.confidence < 0.8) {
        result.needsClarification = true;
        result.clarificationQuestion = `Did you mean "${productDetails.name}"?`;
        
        // Provide options based on fuzzy matches
        if (productList.length > 0) {
          const fuse = new Fuse(productList, { keys: ['name'], threshold: 0.6 });
          const matches = fuse.search(productDetails.name);
          result.clarificationOptions = matches.slice(0, 3).map(match => match.item.name);
          
          // Add the original as an option too
          if (!result.clarificationOptions.includes(productDetails.name)) {
            result.clarificationOptions.push(productDetails.name);
          }
        }
      }
      
      // Add location info
      const location = extractLocationInfo(command);
      if (location) {
        productDetails.position = location;
        result.detectedLocation = location;
      } else {
        productDetails.position = "unspecified";
      }
      
      result.products.push(productDetails);
    }
  }
  
  // Apply validation logic
  result.products = result.products.filter(product => {
    // Reject products with low confidence
    if (product.confidence && product.confidence < 0.8) {
      return false;
    }
    
    // Ensure quantity is present
    if (product.quantity === undefined || product.quantity <= 0) {
      product.quantity = 1; // Default quantity
    }
    
    // Ensure unit is present
    if (!product.unit) {
      product.unit = 'pcs'; // Default unit
    }
    
    // Location is already handled above with defaults
    return true;
  });
  
  console.log("Parsing result:", result);
  
  return result;
};

/**
 * Extract detailed product information from a voice command segment
 */
function extractProductDetails(text: string, productList: { name: string }[] = []): EnhancedProduct {
  const product: EnhancedProduct = {
    name: '',
    confidence: 1.0,
    quantity: undefined,
    unit: undefined,
    position: undefined,
    price: undefined,
  };

  // Clean the command to remove common add/create prefixes
  const cleanedText = text.replace(/^(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\s+/i, '');
  
  // Extract quantity and unit with regex
  const quantityUnitMatch = cleanedText.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|litres|liter|liters|piece|pieces|pc|pcs|pack|packs|box|boxes|unit|units|carton|dozen|bottle|bottles|bag|bags)s?\b/i);
  
  if (quantityUnitMatch) {
    product.quantity = parseFloat(quantityUnitMatch[1]);
    
    // Standardize the unit
    const rawUnit = quantityUnitMatch[2].toLowerCase();
    product.unit = unitMapping[rawUnit] || rawUnit;
    
    // Extract product name - everything after quantity and unit
    const afterQuantityUnit = cleanedText.substring(quantityUnitMatch.index! + quantityUnitMatch[0].length).trim();
    
    // Clean up the product name
    product.name = afterQuantityUnit
      .replace(/\s+(in|at|on)\s+(shelf|rack|aisle|section|position|bin|box|cabinet)\s+\d+/i, '') // Remove location info
      .replace(/\s+(for|at|price|cost|costing|worth)\s+(\d+|₹\d+|rs\d+)/i, '') // Remove price info
      .trim();
  } else {
    // If no quantity/unit found, extract product name directly
    product.name = cleanedText
      .replace(/\s+(in|at|on)\s+(shelf|rack|aisle|section|position|bin|box|cabinet)\s+\d+/i, '')
      .replace(/\s+(for|at|price|cost|costing|worth)\s+(\d+|₹\d+|rs\d+)/i, '')
      .trim();
    
    // Default quantity and unit
    product.quantity = 1;
    product.unit = 'pcs';
  }
  
  // Extract price information
  const priceMatch = text.match(/(?:price|cost|for|at|worth|costing|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    product.price = parseFloat(priceMatch[1]);
  }
  
  // Extract position/location 
  const positionMatch = text.match(/(in|at|on)\s+(shelf|rack|aisle|section|position|bin|box|cabinet)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  if (positionMatch) {
    const locationNumber = positionMatch[3];
    const locationWord = positionMatch[2].charAt(0).toUpperCase() + positionMatch[2].slice(1);
    
    // Convert word numbers to digits if needed
    const numberWords: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    
    const locationValue = numberWords[locationNumber.toLowerCase()] || locationNumber;
    product.position = `${locationWord} ${locationValue}`;
  }
  
  // Extract product type/variant information (e.g., basmati rice vs. jasmine rice)
  const variantPatterns = [
    { type: 'color', pattern: /(red|blue|green|yellow|black|white|pink|purple|brown|orange|gray|grey)\s+([a-z]+)/i },
    { type: 'size', pattern: /(small|medium|large|extra large|xl|xxl|mini|regular|jumbo|family size)\s+([a-z]+)/i },
    { type: 'type', pattern: /(organic|fresh|frozen|canned|dried|raw|ripe|unripe|processed|whole grain|refined)\s+([a-z]+)/i },
  ];
  
  for (const { type, pattern } of variantPatterns) {
    const match = product.name.match(pattern);
    if (match) {
      if (!product.variant) product.variant = {};
      
      if (type === 'color') {
        product.variant.color = match[1];
      } else if (type === 'size') {
        product.variant.size = match[1];
      } else if (type === 'type') {
        product.variant.type = match[1];
      }
    }
  }
  
  // Now use fuzzy matching to improve name recognition if we have a product list
  if (productList.length > 0 && product.name) {
    const fuse = new Fuse(productList, { 
      keys: ['name'],
      includeScore: true,
      threshold: 0.6 
    });
    
    const results = fuse.search(product.name);
    
    if (results.length > 0) {
      const bestMatch = results[0];
      product.name = bestMatch.item.name;
      
      // Convert Fuse.js score (0 is perfect match, 1 is bad match) to confidence (1 is perfect, 0 is bad)
      product.confidence = bestMatch.score ? 1 - bestMatch.score : 1;
    } else {
      // No good match found, keep original but with lower confidence
      product.confidence = 0.5;
    }
  }
  
  return product;
}

/**
 * Extract location information from a command
 */
function extractLocationInfo(text: string): string | undefined {
  // Match patterns like "at shelf 7", "in aisle 3", "on rack 2"
  const locationMatch = text.match(/(in|at|on)\s+(shelf|rack|aisle|section|position|bin|box|cabinet)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  
  if (locationMatch) {
    const locationType = locationMatch[2].charAt(0).toUpperCase() + locationMatch[2].slice(1);
    const locationNumber = locationMatch[3];
    
    // Convert word numbers to digits if needed
    const numberWords: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    
    const locationValue = numberWords[locationNumber.toLowerCase()] || locationNumber;
    return `${locationType} ${locationValue}`;
  }
  
  // Check for other location patterns like "top shelf", "bottom drawer"
  const relativeLocationMatch = text.match(/(top|bottom|upper|lower|left|right|middle|center|front|back)\s+(shelf|rack|aisle|section|position|bin|box|cabinet)/i);
  
  if (relativeLocationMatch) {
    const position = relativeLocationMatch[1].charAt(0).toUpperCase() + relativeLocationMatch[1].slice(1);
    const locationType = relativeLocationMatch[2].charAt(0).toUpperCase() + relativeLocationMatch[2].slice(1);
    return `${position} ${locationType}`;
  }
  
  return undefined;
}
