
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

// Extract product details from voice command
export function extractProductDetails(command: string): Record<string, any> {
  const lowerCommand = command.toLowerCase();
  const productDetails: Record<string, any> = {};
  
  // Extract product name
  const productNamePatterns = [
    /add\s+(\w+)/i,
    /add\s+(\d+)\s*(kg|g|l|ml|packet|box)?\s+(?:of\s+)?([a-z\s]+)/i
  ];
  
  for (const pattern of productNamePatterns) {
    const match = lowerCommand.match(pattern);
    if (match) {
      if (match.length === 2) {
        productDetails.name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        break;
      } else if (match.length === 4) {
        productDetails.name = match[3].trim().charAt(0).toUpperCase() + match[3].trim().slice(1);
        productDetails.quantity = parseInt(match[1]);
        productDetails.unit = match[2] || 'pcs';
        break;
      }
    }
  }
  
  // Extract quantity and unit
  const quantityMatch = lowerCommand.match(/(\d+)(?:\s*)(kg|g|l|ml|packet|box|packets|boxes|pieces)/i);
  if (quantityMatch) {
    productDetails.quantity = parseInt(quantityMatch[1]);
    productDetails.unit = quantityMatch[2].toLowerCase();
  }
  
  // Extract position/rack
  const rackMatch = lowerCommand.match(/(?:at|on|in)\s+(?:rack|shelf)\s+(\d+)/i);
  if (rackMatch) {
    productDetails.position = `Rack ${rackMatch[1]}`;
  }
  
  // Extract expiry date
  const expiryPatterns = [
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?(\d{1,2}\s+[a-z]+\s+\d{2,4})/i,
    /expir(?:y|es|ed)\s+(?:to be\s+)?(?:on\s+)?([a-z]+\s+\d{4})/i
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
  const priceMatch = lowerCommand.match(/price\s+(?:is\s+)?(\d+)/i);
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
    // For demo purposes, we'll just use placeholder images
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
