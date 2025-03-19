
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
      lowerCommand.includes('add new product')) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      text: command,
    };
  }
  
  // CREATE BILL COMMANDS - Including Hindi transliteration
  if (lowerCommand.includes('create bill') || 
      lowerCommand.includes('add bill') || 
      lowerCommand.includes('new bill') || 
      lowerCommand.includes('generate bill') ||
      lowerCommand.includes('bill banao') ||  // Hindi transliteration
      lowerCommand.includes('bill banaao')) {
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
      lowerCommand.includes('locate')) {
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

// Extract item details from voice command for billing
export function extractBillItems(command: string): { name: string, quantity: number, unit: string }[] {
  const lowerCommand = command.toLowerCase();
  const items: { name: string, quantity: number, unit: string }[] = [];
  
  // Remove introductory phrases
  const cleanedCommand = lowerCommand
    .replace(/create bill|add bill|new bill|generate bill|bill banao|bill banaao/gi, '')
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
