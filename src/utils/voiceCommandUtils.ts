
// Define command types
export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  UNKNOWN: 'unknown'
} as const;

// Interface for command data
interface CommandData {
  type: (typeof VOICE_COMMAND_TYPES)[keyof typeof VOICE_COMMAND_TYPES];
  data?: any;
}

// Interface for product data
interface ProductInfo {
  name?: string;
  quantity?: number;
  position?: string;
  unit?: string;
  expiry?: string;
  price?: number;
}

// Interface for bill data
interface BillInfo {
  items?: {
    name: string;
    quantity: number;
    unit?: string;
  }[];
}

// Multi-language keyword maps
const languageKeywords = {
  // Add product keywords
  add: ['add', 'create', 'new', 'make', 'register', 'put', 'जोड़ें', 'बनाएं', 'नया', 'डालें', 'agregar', 'crear', 'nuevo', 'ajouter', 'créer', 'nouveau'],
  
  // Bill keywords
  bill: ['bill', 'invoice', 'receipt', 'billing', 'बिल', 'रसीद', 'चालान', 'factura', 'recibo', 'facture', 'reçu'],
  
  // Search keywords
  search: ['search', 'find', 'where', 'locate', 'खोजें', 'ढूंढें', 'कहां', 'buscar', 'encontrar', 'dónde', 'chercher', 'trouver', 'où'],
  
  // Units
  units: {
    weight: {
      kg: ['kg', 'kilo', 'kilos', 'kilogram', 'kilograms', 'किलो', 'किलोग्राम', 'kilo', 'kilogramo', 'kilogramos'],
      g: ['g', 'gram', 'grams', 'ग्राम', 'gramo', 'gramos', 'gramme', 'grammes'],
      mg: ['mg', 'milligram', 'milligrams', 'मिलीग्राम', 'miligramo', 'miligramos', 'milligramme', 'milligrammes'],
      lb: ['lb', 'lbs', 'pound', 'pounds', 'पाउंड', 'libra', 'libras', 'livre', 'livres'],
      oz: ['oz', 'ounce', 'ounces', 'औंस', 'onza', 'onzas', 'once', 'onces']
    },
    volume: {
      l: ['l', 'liter', 'liters', 'litre', 'litres', 'लीटर', 'litro', 'litros', 'litre', 'litres'],
      ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'मिलीलीटर', 'mililitro', 'mililitros', 'millilitre', 'millilitres'],
      gal: ['gal', 'gallon', 'gallons', 'गैलन', 'galón', 'galones', 'gallon', 'gallons']
    },
    quantity: {
      pcs: ['pcs', 'piece', 'pieces', 'टुकड़ा', 'टुकड़े', 'pieza', 'piezas', 'pièce', 'pièces'],
      box: ['box', 'boxes', 'डिब्बा', 'डिब्बे', 'caja', 'cajas', 'boîte', 'boîtes'],
      pkt: ['pkt', 'packet', 'packets', 'पैकेट', 'paquete', 'paquetes', 'paquet', 'paquets'],
      dz: ['dz', 'dozen', 'dozens', 'दर्जन', 'docena', 'docenas', 'douzaine', 'douzaines']
    }
  },
  
  // Position keywords
  position: ['rack', 'shelf', 'aisle', 'section', 'रैक', 'शेल्फ', 'गलियारा', 'सेक्शन', 'estante', 'pasillo', 'sección', 'étagère', 'rayon', 'section'],
  
  // Expiry keywords
  expiry: ['expiry', 'expiration', 'expires', 'expiring', 'समाप्ति', 'एक्सपायरी', 'caducidad', 'vencimiento', 'expiration', 'péremption']
};

// Extract product details from the command
function extractProductDetails(command: string): ProductInfo {
  const productInfo: ProductInfo = {};
  const words = command.toLowerCase().split(/\s+/);
  
  // Pattern for quantity + unit (e.g., 5kg, 10pcs)
  const quantityUnitPattern = /(\d+\.?\d*)([a-zA-Z]+)/;
  const numberPattern = /(\d+\.?\d*)/;
  
  // Extract product name, quantity, unit
  let potentialProductNames: string[] = [];
  let foundQuantity = false;
  let foundUnit = false;
  
  // First pass - find quantity and unit
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check for combined quantity+unit (e.g., 5kg)
    const quantityUnitMatch = word.match(quantityUnitPattern);
    if (quantityUnitMatch) {
      const [_, qtyStr, unitStr] = quantityUnitMatch;
      productInfo.quantity = parseFloat(qtyStr);
      foundQuantity = true;
      
      // Find matching unit
      for (const [unitType, unitValues] of Object.entries(languageKeywords.units)) {
        for (const [unitKey, unitArr] of Object.entries(unitValues)) {
          if (unitArr.some(u => unitStr.toLowerCase() === u)) {
            productInfo.unit = unitKey;
            foundUnit = true;
            break;
          }
        }
        if (foundUnit) break;
      }
      
      continue;
    }
    
    // Check for separate quantity
    if (!foundQuantity && numberPattern.test(word)) {
      productInfo.quantity = parseFloat(word.match(numberPattern)![1]);
      foundQuantity = true;
      
      // Check if next word is a unit
      if (i + 1 < words.length) {
        const nextWord = words[i + 1];
        for (const [unitType, unitValues] of Object.entries(languageKeywords.units)) {
          for (const [unitKey, unitArr] of Object.entries(unitValues)) {
            if (unitArr.some(u => nextWord.toLowerCase() === u)) {
              productInfo.unit = unitKey;
              foundUnit = true;
              i++; // Skip the unit word
              break;
            }
          }
          if (foundUnit) break;
        }
      }
      
      continue;
    }
    
    // Check for position (rack, shelf)
    if (languageKeywords.position.some(p => word.includes(p))) {
      // If the next word is a number or contains a number
      if (i + 1 < words.length && numberPattern.test(words[i + 1])) {
        productInfo.position = `${word.charAt(0).toUpperCase() + word.slice(1)} ${words[i + 1]}`;
        i++; // Skip the number
      }
      continue;
    }
    
    // Check for expiry
    if (languageKeywords.expiry.some(e => word.includes(e))) {
      // Extract next few words as expiry date
      if (i + 1 < words.length) {
        const expiryWords = [];
        for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
          expiryWords.push(words[j]);
        }
        productInfo.expiry = expiryWords.join(' ');
        i += expiryWords.length;
      }
      continue;
    }
    
    // If not a special word, add to potential product names
    potentialProductNames.push(word);
  }
  
  // Process potential product names
  if (potentialProductNames.length > 0) {
    // Filter out command words and other special words
    const filteredNames = potentialProductNames.filter(word => 
      !languageKeywords.add.includes(word) &&
      !languageKeywords.bill.includes(word) &&
      !languageKeywords.search.includes(word) &&
      word !== 'to' && 
      word !== 'of' &&
      word !== 'in' &&
      word !== 'with' &&
      word !== 'and' &&
      word !== 'the' &&
      word !== 'a' &&
      word !== 'an'
    );
    
    if (filteredNames.length > 0) {
      // Capitalize the first letter of each word
      productInfo.name = filteredNames
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  
  return productInfo;
}

// Extract information about a bill from the command
function extractBillInfo(command: string): BillInfo {
  const billInfo: BillInfo = { items: [] };
  const words = command.toLowerCase().split(/\s+/);
  
  // Process the command for extracting bill items
  // In a real app, we'd use more sophisticated NLP here
  const productInfo = extractProductDetails(command);
  
  if (productInfo.name) {
    billInfo.items?.push({
      name: productInfo.name,
      quantity: productInfo.quantity || 1,
      unit: productInfo.unit
    });
  }
  
  return billInfo;
}

// Main function to detect command type and extract data
export function detectCommandType(command: string): CommandData {
  const lowerCmd = command.toLowerCase();
  
  // Check if this is a bill-related command (contains any bill keyword)
  const isBillCommand = languageKeywords.bill.some(keyword => lowerCmd.includes(keyword));
  
  // If it contains a bill keyword or just has product information (like "5kg sugar")
  if (isBillCommand || /\d+\s*([a-zA-Z]+\s+)?[a-zA-Z]+/.test(lowerCmd)) {
    const billInfo = extractBillInfo(command);
    // If we extracted items, treat it as a bill command
    if (billInfo.items && billInfo.items.length > 0) {
      return {
        type: VOICE_COMMAND_TYPES.CREATE_BILL,
        data: billInfo
      };
    }
  }
  
  // Check if this is explicitly an add product command
  const isAddCommand = languageKeywords.add.some(keyword => lowerCmd.includes(keyword));
  if (isAddCommand) {
    const productInfo = extractProductDetails(command);
    if (productInfo.name) {
      return {
        type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
        data: productInfo
      };
    }
  }
  
  // Check if this is a search command
  const isSearchCommand = languageKeywords.search.some(keyword => lowerCmd.includes(keyword));
  if (isSearchCommand) {
    // Extract search term (everything after the search keyword)
    const searchIndex = Math.max(
      ...languageKeywords.search.map(keyword => lowerCmd.indexOf(keyword))
      .filter(index => index !== -1)
    );
    
    if (searchIndex >= 0) {
      const searchKeyword = lowerCmd.substring(searchIndex, lowerCmd.indexOf(' ', searchIndex) !== -1 ? 
        lowerCmd.indexOf(' ', searchIndex) : lowerCmd.length);
      
      const searchTerm = lowerCmd.substring(lowerCmd.indexOf(' ', searchIndex) + 1);
      
      return {
        type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
        data: { searchTerm: searchTerm.trim() }
      };
    }
  }
  
  // For any other command, try to extract product details and consider it an add command
  const productInfo = extractProductDetails(command);
  if (productInfo.name) {
    return {
      type: VOICE_COMMAND_TYPES.ADD_PRODUCT,
      data: productInfo
    };
  }
  
  // If we can't determine a specific command type
  return {
    type: VOICE_COMMAND_TYPES.UNKNOWN
  };
}
