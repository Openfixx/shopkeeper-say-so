
import { toast } from 'sonner';

// Voice command types
export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  UNKNOWN: 'unknown',
};

// Interface for recognized commands
export interface RecognizedCommand {
  type: string;
  text: string;
  data?: Record<string, any>;
}

export function detectCommandType(command: string): RecognizedCommand {
  const lowerCommand = command.toLowerCase().trim();
  
  // Enhanced pattern detection for CREATE BILL
  // First check for bill-related keywords in the command
  if (lowerCommand.includes('bill') || 
      lowerCommand.includes('receipt') ||
      lowerCommand.includes('invoice') ||
      lowerCommand.includes('banao') || // Hindi
      lowerCommand.includes('banaao') ||
      lowerCommand.includes('banado') ||
      lowerCommand.includes('factura') || // Spanish
      lowerCommand.includes('cuenta') ||
      lowerCommand.includes('ticket') ||
      lowerCommand.includes('reçu') || // French
      lowerCommand.includes('facture')) {
    
    // If the command has bill-related keywords, extract product info if present
    let billData: Record<string, any> = {};
    
    // Extract product details if they exist in the bill command
    // Pattern: quantity + unit + product name
    const productMatch = lowerCommand.match(/(\d+)\s*(kg|g|l|ml|packet|box|packets|boxes|pieces)\s+([a-z ]+)/i);
    if (productMatch) {
      billData.items = [{
        name: productMatch[3].trim(),
        quantity: parseInt(productMatch[1]),
        unit: productMatch[2].toLowerCase()
      }];
    }
    
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      text: command,
      data: Object.keys(billData).length > 0 ? billData : undefined
    };
  }
  
  // ADD PRODUCT COMMANDS - Enhanced pattern detection
  if (lowerCommand.includes('add product') || 
      lowerCommand.match(/add \d+\s*\w+\s+\w+/) ||
      lowerCommand.includes('add new item') ||
      lowerCommand.includes('add new product') ||
      lowerCommand.startsWith('add ') ||
      // Detect product details without explicit "add" command
      lowerCommand.match(/(\d+)\s*(kg|g|l|ml|packet|box)\s+([a-z ]+)(\s+at|\s+on|\s+in|\s+rack|\s+shelf|\s+price|\s+expiry|\s+expires)/i) ||
      // Multi-language support
      lowerCommand.includes('añadir producto') || // Spanish
      lowerCommand.includes('agregar') ||
      lowerCommand.includes('ajouter') || // French
      lowerCommand.includes('उत्पाद जोड़ें') || // Hindi transliteration
      lowerCommand.includes('utpād joṛēṁ')) {
    
    // Extract product details from the command
    const productDetails = extractProductDetails(command);
    
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      text: command,
      data: Object.keys(productDetails).length > 0 ? productDetails : undefined
    };
  }
  
  // SEARCH PRODUCT COMMANDS - Enhanced pattern detection
  if (lowerCommand.includes('search for') || 
      lowerCommand.includes('find') || 
      lowerCommand.includes('search') ||
      lowerCommand.includes('where is') ||
      lowerCommand.includes('locate') ||
      lowerCommand.includes('look for') ||
      lowerCommand.includes('buscar') || // Spanish
      lowerCommand.includes('encontrar') ||
      lowerCommand.includes('chercher') || // French
      lowerCommand.includes('trouver') ||
      lowerCommand.includes('खोजें') || // Hindi transliteration
      lowerCommand.includes('ढूंढें') ||
      lowerCommand.includes('khojena') ||
      lowerCommand.includes('dhundhna')) {
    
    // Extract product name to search for
    let searchTerm = '';
    const searchPatterns = [
      /(?:search for|find|search|where is|locate|look for|buscar|encontrar|chercher|trouver|खोजें|ढूंढें|khojena|dhundhna)\s+([a-z0-9 ]+)/i,
      /([a-z0-9 ]+)(?:\s+की\s+तलाश|\s+कहां\s+है|\s+को\s+खोजें)/i // Hindi patterns
    ];
    
    for (const pattern of searchPatterns) {
      const match = lowerCommand.match(pattern);
      if (match && match[1]) {
        searchTerm = match[1].trim();
        break;
      }
    }
    
    // If no explicit search term found, check if there's a product name alone
    if (!searchTerm) {
      // Try to find a product name in the command
      const words = lowerCommand.split(/\s+/).filter(word => word.length > 3);
      if (words.length === 1) {
        searchTerm = words[0];
      }
    }
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      text: command,
      data: searchTerm ? { searchTerm } : undefined
    };
  }
  
  // If no explicit command pattern is found, try to extract meaningful information
  // Look for product-related information that might indicate intent
  const productDetails = extractProductDetails(command);
  if (Object.keys(productDetails).length > 0) {
    if (productDetails.name) {
      // If we found a product name, decide based on other clues
      if (productDetails.quantity || productDetails.price) {
        // If quantity or price is mentioned, likely adding to bill
        return {
          type: VOICE_COMMAND_TYPES.CREATE_BILL,
          text: command,
          data: {
            items: [{
              name: productDetails.name,
              quantity: productDetails.quantity || 1,
              unit: productDetails.unit || 'piece'
            }]
          }
        };
      } else {
        // If only name is mentioned, likely searching
        return {
          type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
          text: command,
          data: { searchTerm: productDetails.name }
        };
      }
    }
  }
  
  // Unknown command
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    text: command,
  };
}

// Enhanced product detail extraction with multi-language support
export function extractProductDetails(command: string): Record<string, any> {
  const lowerCommand = command.toLowerCase();
  const productDetails: Record<string, any> = {};
  
  // Extract product name with improved patterns
  const namePatterns = [
    // Standard English patterns
    /add\s+(?:(\d+)\s*(?:kg|g|l|ml|packet|box)?\s+)?(?:of\s+)?([a-z\s]+?)(?:\s+(?:at|on|in|with|expiry|expires|rack|shelf|price)|\s*$)/i,
    /(\d+)\s*(?:kg|g|l|ml|packet|box)\s+([a-z\s]+?)(?:\s+(?:at|on|in|with|expiry|expires|rack|shelf|price)|\s*$)/i,
    
    // Hindi transliteration patterns
    /(\d+)\s*(?:kg|g|l|ml|packet|box)\s+([a-z\s]+?)(?:\s+(?:par|mein|ke saath|expiry|expires|rack|shelf|price|kimat)|\s*$)/i,
    
    // Standalone product name (if it's the only word in the command)
    /^([a-z]{3,})\s*$/i
  ];
  
  for (const pattern of namePatterns) {
    const nameMatches = lowerCommand.match(pattern);
    if (nameMatches) {
      // Different patterns have product name in different capture groups
      let nameIndex = 2;
      let quantityIndex = 1;
      
      // Single word pattern case
      if (pattern.toString().includes('^([a-z]{3,})')) {
        nameIndex = 1;
        quantityIndex = -1;
      }
      
      if (nameMatches[nameIndex]) {
        productDetails.name = nameMatches[nameIndex].trim().charAt(0).toUpperCase() + nameMatches[nameIndex].trim().slice(1);
        
        // If we have quantity in the same pattern
        if (quantityIndex > 0 && nameMatches[quantityIndex]) {
          productDetails.quantity = parseInt(nameMatches[quantityIndex]);
        }
        
        break;
      }
    }
  }
  
  // Extract quantity and unit - more specific patterns
  if (!productDetails.quantity) {
    const quantityPatterns = [
      /(\d+)\s*(kg|g|l|ml|packet|box|packets|boxes|pieces)/i,
      /(\d+)\s*(किलो|ग्राम|लीटर|मिली|पैकेट|बॉक्स|डिब्बा)/i,  // Hindi units
      /(\d+)\s*(kilogram|gram|liter|milliliter|paquete|caja)/i,  // Spanish units
    ];
    
    for (const pattern of quantityPatterns) {
      const quantityMatch = lowerCommand.match(pattern);
      if (quantityMatch) {
        productDetails.quantity = parseInt(quantityMatch[1]);
        productDetails.unit = quantityMatch[2].toLowerCase();
        break;
      }
    }
  }
  
  // Extract position/rack - more variations
  const rackPatterns = [
    // English patterns
    /(?:at|on|in)\s+(?:rack|shelf|position)\s+(\d+)/i,
    /rack\s+(\d+)/i,
    /shelf\s+(\d+)/i,
    
    // Hindi transliteration patterns
    /(?:par|pe|mein)\s+(?:rack|shelf|position)\s+(\d+)/i,
    /rack\s+(\d+)\s+(?:par|pe|mein)/i,
    
    // Spanish patterns
    /(?:en|sobre)\s+(?:estante|posición|rack)\s+(\d+)/i,
  ];
  
  for (const pattern of rackPatterns) {
    const rackMatch = lowerCommand.match(pattern);
    if (rackMatch) {
      productDetails.position = `Rack ${rackMatch[1]}`;
      break;
    }
  }
  
  // Extract expiry date - enhanced patterns with multi-language support
  const expiryPatterns = [
    // English patterns
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}\s+[a-z]+\s+\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:to be\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /expires?\s+(?:in|on)?\s+([a-z]+\s+\d{4})/i,
    /(?:in|on)\s+([a-z]+\s+\d{4})/i,
    
    // Hindi transliteration patterns
    /expiry\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /samapti\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    
    // Month and year direct mention (e.g. "July 2025")
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i,
  ];
  
  for (const pattern of expiryPatterns) {
    const match = lowerCommand.match(pattern);
    if (match) {
      try {
        // Special handling for month and year direct mention
        if (pattern.toString().includes('january|february|march')) {
          const month = match[1];
          const year = match[2];
          const dateString = `${month} 1, ${year}`;
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            productDetails.expiry = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
        } else {
          const dateString = match[1];
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            productDetails.expiry = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } else {
            // If parsing failed, store as string for manual correction
            productDetails.expiry = dateString;
          }
        }
        break;
      } catch (e) {
        console.error('Failed to parse date:', match[1], e);
      }
    }
  }
  
  // Extract price - enhanced patterns with multi-language support
  const pricePatterns = [
    // English patterns
    /price\s+(?:is\s+)?(\d+)/i,
    /costs?\s+(\d+)/i,
    /(\d+)\s+rupees/i,
    
    // Hindi transliteration patterns
    /(?:keemat|daam|mol)\s+(?:hai\s+)?(\d+)/i,
    /(\d+)\s+(?:rupaye|rupee|rupiya)/i,
    
    // Spanish patterns
    /precio\s+(?:es\s+)?(\d+)/i,
    /cuesta\s+(\d+)/i,
  ];
  
  for (const pattern of pricePatterns) {
    const priceMatch = lowerCommand.match(pattern);
    if (priceMatch) {
      productDetails.price = parseInt(priceMatch[1]);
      break;
    }
  }
  
  return productDetails;
}

// Enhanced bill item extraction with intelligent parsing
export function extractBillItems(command: string): { name: string, quantity: number, unit: string }[] {
  const lowerCommand = command.toLowerCase();
  const items: { name: string, quantity: number, unit: string }[] = [];
  
  // Clean the command by removing introductory phrases
  const cleanedCommand = lowerCommand
    .replace(/create bill|add bill|new bill|generate bill|bill banao|bill banaao|bill banado|create a bill|make bill|prepare bill|factura|compte|ticket|reçu/gi, '')
    .replace(/with|for|containing|of|con|para|avec|pour|के साथ|के लिए/gi, '')
    .trim();
  
  // First try explicit quantity patterns
  const explicitItemPattern = /(\d+)\s*(kg|g|l|ml|packet|packets|box|boxes|pieces)\s+([a-z ]+?)(?:,|\sand\s|$)/gi;
  let match;
  
  while ((match = explicitItemPattern.exec(cleanedCommand)) !== null) {
    const quantity = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const name = match[3].trim();
    
    items.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity,
      unit
    });
  }
  
  // If no explicit patterns found, try more flexible approach
  if (items.length === 0) {
    // Split into potential items (handle both commas and "and")
    const itemStrings = cleanedCommand
      .split(/,|\sand\s|&/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Process each potential item
    itemStrings.forEach(itemString => {
      // Standard pattern: quantity unit product
      const standardMatch = itemString.match(/(\d+)\s*(kg|g|l|ml|packet|packets|box|boxes|pieces)\s+([a-z ]+)/i);
      
      if (standardMatch) {
        const quantity = parseInt(standardMatch[1]);
        const unit = standardMatch[2].toLowerCase();
        const name = standardMatch[3].trim();
        
        items.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity,
          unit
        });
      } else {
        // Try to extract just product names (for cases without quantity)
        // Ensure it's not just noise - must be at least 3 characters
        const cleanedItem = itemString.replace(/and|with|of|the|a|an/gi, '').trim();
        if (cleanedItem.length >= 3 && !cleanedItem.match(/^\d+$/)) {
          items.push({
            name: cleanedItem.charAt(0).toUpperCase() + cleanedItem.slice(1),
            quantity: 1,
            unit: 'piece'
          });
        }
      }
    });
  }
  
  // For single word commands that are likely just product names
  if (items.length === 0 && cleanedCommand.split(/\s+/).length === 1 && cleanedCommand.length >= 3) {
    items.push({
      name: cleanedCommand.charAt(0).toUpperCase() + cleanedCommand.slice(1),
      quantity: 1,
      unit: 'piece'
    });
  }
  
  return items;
}

// Fetch product image from search
export async function fetchProductImageUrl(productName: string): Promise<string | null> {
  try {
    // In a real app, you would call an image search API
    // For demo purposes, we'll use placeholder images
    const placeholders = [
      'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a',
      'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a',
      'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8',
      'https://images.unsplash.com/photo-1543168256-418811576931',
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df',
    ];
    
    // Randomly select a placeholder
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  } catch (error) {
    console.error('Error fetching product image:', error);
    return null;
  }
}

// Handle voice recognition for billing process
export function processBillingVoiceCommand(
  command: string, 
  addToBill: (productId: string, quantity: number) => void,
  findProduct: (query: string) => any[]
): boolean {
  try {
    const items = extractBillItems(command);
    
    if (items.length === 0) {
      toast.warning("Couldn't identify any items for billing");
      return false;
    }
    
    let addedItems = 0;
    
    // Try to find and add each item
    items.forEach(item => {
      const matchingProducts = findProduct(item.name);
      
      if (matchingProducts.length > 0) {
        // Get the first matching product
        const product = matchingProducts[0];
        
        // Convert units if necessary (simplified)
        let quantity = item.quantity;
        
        // Add to bill
        addToBill(product.id, quantity);
        addedItems++;
      } else {
        toast.error(`Product "${item.name}" not found in inventory`);
      }
    });
    
    if (addedItems > 0) {
      toast.success(`Added ${addedItems} item(s) to bill`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error processing billing voice command:', error);
    toast.error('Error processing voice command');
    return false;
  }
}

// Function to simulate automatic image search
export async function searchProductImage(productName: string): Promise<string> {
  console.log(`Searching for image of ${productName}...`);
  
  // In a real app, you would use Google Custom Search API or similar
  // For demo purposes, we'll use placeholder images
  const placeholders = [
    'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a',
    'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a',
    'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8',
    'https://images.unsplash.com/photo-1543168256-418811576931',
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df',
  ];
  
  // Introduce a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return a random image as a placeholder
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

// Function to identify shelves in rack image
export function identifyShelves(rackImageUrl: string): { shelfCount: number, shelfCoordinates: Array<{top: number, left: number, width: number, height: number}> } {
  // This function would use computer vision to identify shelves in the rack image
  // For demo purposes, we'll return mock data
  const mockShelfCoordinates = [
    { top: 0, left: 0, width: 100, height: 20 },
    { top: 25, left: 0, width: 100, height: 20 },
    { top: 50, left: 0, width: 100, height: 20 },
    { top: 75, left: 0, width: 100, height: 20 },
  ];
  
  return {
    shelfCount: mockShelfCoordinates.length,
    shelfCoordinates: mockShelfCoordinates
  };
}
