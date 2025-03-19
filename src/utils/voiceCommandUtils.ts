
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
  
  // ADD PRODUCT COMMANDS
  if (lowerCommand.includes('add product') || 
      lowerCommand.match(/add \d+\s*\w+\s+\w+/) ||
      lowerCommand.includes('add new item') ||
      lowerCommand.includes('add new product') ||
      lowerCommand.startsWith('add ')) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      text: command,
    };
  }
  
  // CREATE BILL COMMANDS - Including Hindi transliteration and variations
  if (lowerCommand.includes('create bill') || 
      lowerCommand.includes('add bill') || 
      lowerCommand.includes('new bill') || 
      lowerCommand.includes('generate bill') ||
      lowerCommand.includes('bill banao') ||  // Hindi transliteration
      lowerCommand.includes('bill banaao') ||
      lowerCommand.includes('bill banado') ||
      lowerCommand.includes('make bill') ||
      lowerCommand.includes('create a bill') ||
      lowerCommand.includes('start bill') ||
      lowerCommand.includes('prepare bill') ||
      lowerCommand.includes('bill')) {
    return {
      type: VOICE_COMMAND_TYPES.CREATE_BILL,
      text: command,
    };
  }
  
  // SEARCH PRODUCT COMMANDS
  if (lowerCommand.includes('search for') || 
      lowerCommand.includes('find') || 
      lowerCommand.includes('search') ||
      lowerCommand.includes('where is') ||
      lowerCommand.includes('locate') ||
      lowerCommand.includes('look for')) {
    // Extract product name
    let searchTerm = '';
    if (lowerCommand.includes('search for')) {
      searchTerm = lowerCommand.split('search for')[1].trim();
    } else if (lowerCommand.includes('find')) {
      searchTerm = lowerCommand.split('find')[1].trim();
    } else if (lowerCommand.includes('search')) {
      searchTerm = lowerCommand.split('search')[1].trim();
    } else if (lowerCommand.includes('where is')) {
      searchTerm = lowerCommand.split('where is')[1].trim();
    } else if (lowerCommand.includes('locate')) {
      searchTerm = lowerCommand.split('locate')[1].trim();
    } else if (lowerCommand.includes('look for')) {
      searchTerm = lowerCommand.split('look for')[1].trim();
    }
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      text: command,
      data: {
        searchTerm
      }
    };
  }
  
  // Unknown command
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN,
    text: command,
  };
}

// Extract product details from voice command with improved pattern recognition
export function extractProductDetails(command: string): Record<string, any> {
  const lowerCommand = command.toLowerCase();
  const productDetails: Record<string, any> = {};
  
  // Extract product name - improved patterns
  const nameMatches = lowerCommand.match(/add\s+(?:(\d+)\s*(?:kg|g|l|ml|packet|box)?\s+)?(?:of\s+)?([a-z\s]+?)(?:\s+(?:at|on|in|with|expiry|expires|rack|shelf|price)|\s*$)/i);
  
  if (nameMatches && nameMatches[2]) {
    productDetails.name = nameMatches[2].trim().charAt(0).toUpperCase() + nameMatches[2].trim().slice(1);
    
    // If we have quantity in the same pattern
    if (nameMatches[1]) {
      productDetails.quantity = parseInt(nameMatches[1]);
    }
  }
  
  // Extract quantity and unit - more specific patterns
  const quantityMatch = lowerCommand.match(/(\d+)\s*(kg|g|l|ml|packet|box|packets|boxes|pieces)/i);
  if (quantityMatch) {
    productDetails.quantity = parseInt(quantityMatch[1]);
    productDetails.unit = quantityMatch[2].toLowerCase();
  }
  
  // Extract position/rack - more variations
  const rackMatch = lowerCommand.match(/(?:at|on|in)\s+(?:rack|shelf|position)\s+(\d+)/i) || 
                   lowerCommand.match(/rack\s+(\d+)/i) || 
                   lowerCommand.match(/shelf\s+(\d+)/i);
  if (rackMatch) {
    productDetails.position = `Rack ${rackMatch[1]}`;
  }
  
  // Extract expiry date - improved patterns
  const expiryPatterns = [
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}\s+[a-z]+\s+\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:to be\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /expires?\s+(?:in|on)?\s+([a-z]+\s+\d{4})/i,
    /(?:in|on)\s+([a-z]+\s+\d{4})/i
  ];
  
  for (const pattern of expiryPatterns) {
    const match = lowerCommand.match(pattern);
    if (match) {
      try {
        const dateString = match[1];
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          productDetails.expiry = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } else {
          // If parsing failed, store as string for manual correction
          productDetails.expiry = dateString;
        }
        break;
      } catch (e) {
        console.error('Failed to parse date:', match[1], e);
      }
    }
  }
  
  // Extract price
  const priceMatch = lowerCommand.match(/price\s+(?:is\s+)?(\d+)/i) || lowerCommand.match(/costs?\s+(\d+)/i) || lowerCommand.match(/(\d+)\s+rupees/i);
  if (priceMatch) {
    productDetails.price = parseInt(priceMatch[1]);
  }
  
  return productDetails;
}

// Extract item details from voice command for billing
export function extractBillItems(command: string): { name: string, quantity: number, unit: string }[] {
  const lowerCommand = command.toLowerCase();
  const items: { name: string, quantity: number, unit: string }[] = [];
  
  // Remove introductory phrases
  const cleanedCommand = lowerCommand
    .replace(/create bill|add bill|new bill|generate bill|bill banao|bill banaao|bill banado|create a bill|make bill|prepare bill/gi, '')
    .replace(/with|for|containing|of/gi, '')
    .trim();
  
  // Split into potential items (handle both commas and "and")
  const itemStrings = cleanedCommand
    .split(/,|\sand\s/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Process each potential item
  itemStrings.forEach(itemString => {
    // Look for pattern: quantity unit product
    // e.g., "2 kg sugar", "500 g salt", "3 packets biscuits"
    const match = itemString.match(/(\d+)\s*(kg|g|l|ml|packet|packets|box|boxes|pieces)\s+([a-z ]+)/i);
    
    if (match) {
      const quantity = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const name = match[3].trim();
      
      items.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        quantity,
        unit
      });
    }
  });
  
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
