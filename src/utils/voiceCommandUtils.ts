// Define command types
export const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  FIND_SHOPS: 'find_shops',
  UPDATE_STOCK: 'update_stock',
  CHANGE_SHOP_TYPE: 'change_shop_type',
  SCAN_BARCODE: 'scan_barcode',
  STOCK_ALERT: 'stock_alert',
  SHARED_DATABASE: 'shared_database',
  UNKNOWN: 'unknown'
} as const;

// Interface for command data
interface CommandData {
  type: (typeof VOICE_COMMAND_TYPES)[keyof typeof VOICE_COMMAND_TYPES];
  data?: any;
}

// Interface for product data
export interface ProductInfo {
  name?: string;
  quantity?: number;
  position?: string;
  unit?: string;
  expiry?: string;
  price?: number;
  image?: string;
  barcode?: string;
  shopId?: string;
  shared?: boolean;
}

// Interface for bill data
export interface BillInfo {
  items?: {
    name: string;
    quantity: number;
    unit?: string;
  }[];
  partialPayment?: boolean;
  deliveryOption?: boolean;
  paymentMethod?: string;
}

// Interface for shop search data
export interface ShopSearchInfo {
  product?: string;
  distance?: number;
  shopType?: string;
  location?: string;
}

// Interface for stock update data
export interface StockUpdateInfo {
  product?: string;
  quantity?: number;
  unit?: string;
  threshold?: number;
}

// Interface for shop type info
export interface ShopTypeInfo {
  type?: 'Grocery' | 'Electronics' | 'Clothing' | 'Pharmacy' | string;
}

// Multi-language keyword maps
const languageKeywords = {
  // Add product keywords
  add: ['add', 'create', 'new', 'make', 'register', 'put', 'जोड़ें', 'बनाएं', 'नया', 'डालें', 'agregar', 'crear', 'nuevo', 'ajouter', 'créer', 'nouveau'],
  
  // Bill keywords
  bill: ['bill', 'invoice', 'receipt', 'billing', 'बिल', 'रसीद', 'चालान', 'factura', 'recibo', 'facture', 'reçu'],
  
  // Search keywords
  search: ['search', 'find', 'where', 'locate', 'खोजें', 'ढूंढें', 'कहां', 'buscar', 'encontrar', 'dónde', 'chercher', 'trouver', 'où'],
  
  // Shop keywords
  shop: ['shop', 'store', 'market', 'दुकान', 'बाज़ार', 'tienda', 'mercado', 'boutique', 'marché'],
  
  // Stock keywords
  stock: ['stock', 'inventory', 'स्टॉक', 'इन्वेंटरी', 'inventario', 'stock', 'inventaire'],
  
  // Update keywords
  update: ['update', 'change', 'modify', 'अपडेट', 'बदलें', 'actualizar', 'cambiar', 'mettre à jour', 'modifier'],
  
  // Nearby keywords
  nearby: ['nearby', 'close', 'near', 'around', 'नज़दीक', 'पास', 'cercano', 'cerca', 'à proximité', 'proche'],
  
  // Barcode keywords
  barcode: ['barcode', 'scan', 'qr', 'बारकोड', 'स्कैन', 'código de barras', 'escanear', 'code-barres', 'scanner'],
  
  // Alert keywords
  alert: ['alert', 'notification', 'warn', 'सूचना', 'अलर्ट', 'alerta', 'notificación', 'alerte', 'notification'],
  
  // Shop type keywords
  shopType: ['shop type', 'store type', 'category', 'दुकान का प्रकार', 'tipo de tienda', 'categoría', 'type de magasin', 'catégorie'],
  
  // Payment keywords
  payment: ['payment', 'pay', 'भुगतान', 'pago', 'paiement'],
  
  // Delivery keywords
  delivery: ['delivery', 'deliver', 'डिलीवरी', 'पहुंचाना', 'entrega', 'livraison'],
  
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
  expiry: ['expiry', 'expiration', 'expires', 'expiring', 'समाप्ति', 'एक्सपायरी', 'caducidad', 'vencimiento', 'expiration', 'péremption'],
  
  // Distance keywords
  distance: ['km', 'kilometer', 'kilometers', 'miles', 'mile', 'किलोमीटर', 'मील', 'kilómetro', 'kilómetros', 'milla', 'millas', 'kilomètre', 'kilomètres']
};

// Extract product details from the command
export function extractProductDetails(command: string): ProductInfo {
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

// Extract bill items from a voice command
export function extractBillItems(command: string): { name: string; quantity: number; unit?: string }[] {
  const items: { name: string; quantity: number; unit?: string }[] = [];
  
  // Extract product details using the existing function
  const productInfo = extractProductDetails(command);
  
  if (productInfo.name) {
    items.push({
      name: productInfo.name,
      quantity: productInfo.quantity || 1,
      unit: productInfo.unit
    });
  }
  
  return items;
}

// Process a billing voice command with flexible units
export function processBillingVoiceCommand(command: string): BillInfo {
  const billInfo: BillInfo = { items: [] };
  const items = extractBillItems(command);
  
  if (items.length > 0) {
    billInfo.items = items;
  }
  
  // Check for delivery option
  const lowerCmd = command.toLowerCase();
  if (languageKeywords.delivery.some(keyword => lowerCmd.includes(keyword))) {
    billInfo.deliveryOption = true;
  }
  
  // Check for payment method mentions
  if (lowerCmd.includes('upi') || lowerCmd.includes('qr') || lowerCmd.includes('online')) {
    billInfo.paymentMethod = 'online';
  } else if (lowerCmd.includes('cash') || lowerCmd.includes('नकद') || lowerCmd.includes('efectivo')) {
    billInfo.paymentMethod = 'cash';
  }
  
  // Check for partial payment
  if (lowerCmd.includes('partial') || lowerCmd.includes('advance') || lowerCmd.includes('आंशिक') || lowerCmd.includes('अग्रिम')) {
    billInfo.partialPayment = true;
  }
  
  return billInfo;
}

// For product image searches and shared database
export function searchProductImage(productName: string): string {
  // This would normally call an API to find images
  return `/placeholder.svg`;
}

// For fetching product images 
export function fetchProductImageUrl(productName: string): Promise<string> {
  // Mock function that would normally fetch from an API
  return Promise.resolve(`/placeholder.svg`);
}

// Check if product exists in shared database
export function checkProductInSharedDatabase(productName: string): Promise<ProductInfo | null> {
  // This would normally query a database
  // For demo, return a mock product for sugar, rice, and salt
  const commonProducts = {
    'sugar': {
      name: 'Sugar',
      image: '/placeholder.svg',
      unit: 'kg',
      price: 45
    },
    'rice': {
      name: 'Rice',
      image: '/placeholder.svg',
      unit: 'kg',
      price: 60
    },
    'salt': {
      name: 'Salt',
      image: '/placeholder.svg',
      unit: 'kg',
      price: 20
    }
  };
  
  const normalizedName = productName.toLowerCase();
  
  return new Promise(resolve => {
    setTimeout(() => {
      for (const [key, value] of Object.entries(commonProducts)) {
        if (normalizedName.includes(key)) {
          resolve(value as ProductInfo);
          return;
        }
      }
      resolve(null);
    }, 500); // Simulate network delay
  });
}

// Extract shop search info
export function extractShopSearchInfo(command: string): ShopSearchInfo {
  const info: ShopSearchInfo = {};
  const words = command.toLowerCase().split(/\s+/);
  
  // Extract product name
  const productInfo = extractProductDetails(command);
  if (productInfo.name) {
    info.product = productInfo.name;
  }
  
  // Extract distance
  const distancePattern = /(\d+)\s*(km|kilometer|kilometers|miles|mile)/i;
  const distanceMatch = command.match(distancePattern);
  if (distanceMatch) {
    info.distance = parseInt(distanceMatch[1], 10);
  } else {
    // Default to 10km if not specified
    info.distance = 10;
  }
  
  // Extract shop type if mentioned
  const shopTypes = ['grocery', 'electronics', 'clothing', 'pharmacy'];
  for (const word of words) {
    if (shopTypes.includes(word)) {
      info.shopType = word.charAt(0).toUpperCase() + word.slice(1);
      break;
    }
  }
  
  return info;
}

// Extract stock alert info
export function extractStockAlertInfo(command: string): StockUpdateInfo {
  const info: StockUpdateInfo = {};
  
  // Extract product details first
  const productInfo = extractProductDetails(command);
  if (productInfo.name) {
    info.product = productInfo.name;
  }
  
  // Extract threshold quantity
  const lowerCommand = command.toLowerCase();
  const words = lowerCommand.split(/\s+/);
  
  const alertWords = ['alert', 'when', 'below', 'less than', 'under'];
  for (let i = 0; i < words.length; i++) {
    for (const alertWord of alertWords) {
      if (words[i].includes(alertWord) && i + 1 < words.length) {
        const numberPattern = /(\d+\.?\d*)/;
        if (numberPattern.test(words[i + 1])) {
          info.threshold = parseFloat(words[i + 1].match(numberPattern)![1]);
          break;
        }
      }
    }
    if (info.threshold) break;
  }
  
  return info;
}

// Extract shop type from command
export function extractShopTypeInfo(command: string): ShopTypeInfo {
  const info: ShopTypeInfo = {};
  const lowerCommand = command.toLowerCase();
  
  const shopTypes = {
    'grocery': ['grocery', 'groceries', 'food', 'supermarket', 'किराना'],
    'electronics': ['electronics', 'gadgets', 'devices', 'इलेक्ट्रॉनिक्स'],
    'clothing': ['clothing', 'clothes', 'apparel', 'fashion', 'कपड़े'],
    'pharmacy': ['pharmacy', 'medicine', 'drug', 'medical', 'फार्मेसी']
  };
  
  for (const [type, keywords] of Object.entries(shopTypes)) {
    if (keywords.some(keyword => lowerCommand.includes(keyword))) {
      info.type = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }
  
  return info;
}

// Extract barcode info
export function extractBarcodeInfo(barcode: string): Promise<ProductInfo | null> {
  // This would normally query a database based on barcode
  // For demo, return mock data for a few barcodes
  const barcodeProducts: Record<string, ProductInfo> = {
    '8901234567890': {
      name: 'Sugar',
      quantity: 1,
      unit: 'kg',
      price: 45,
      image: '/placeholder.svg'
    },
    '8901234567891': {
      name: 'Rice',
      quantity: 1,
      unit: 'kg',
      price: 60,
      image: '/placeholder.svg'
    }
  };
  
  return new Promise(resolve => {
    setTimeout(() => {
      if (barcode in barcodeProducts) {
        resolve(barcodeProducts[barcode]);
      } else {
        resolve(null);
      }
    }, 300);
  });
}

// Mock function to identify shelves in a rack image
export function identifyShelves(imageUrl: string): { shelfCoordinates: Array<{top: number, left: number, width: number, height: number}> } {
  // In a real implementation, this would use image recognition to identify shelves
  // For demo purposes, return mock shelf coordinates
  return {
    shelfCoordinates: [
      { top: 10, left: 5, width: 90, height: 15 },
      { top: 30, left: 5, width: 90, height: 15 },
      { top: 50, left: 5, width: 90, height: 15 },
      { top: 70, left: 5, width: 90, height: 15 }
    ]
  };
}

// Main function to detect command type and extract data
export function detectCommandType(command: string): CommandData {
  const lowerCmd = command.toLowerCase();
  
  // Check for shop finder commands
  if ((lowerCmd.includes('find') || lowerCmd.includes('search') || lowerCmd.includes('locate')) && 
      (lowerCmd.includes('shop') || lowerCmd.includes('store'))) {
    return {
      type: VOICE_COMMAND_TYPES.FIND_SHOPS,
      data: extractShopSearchInfo(command)
    };
  }
  
  // Check for barcode scanning commands
  if (lowerCmd.includes('barcode') || lowerCmd.includes('scan')) {
    return {
      type: VOICE_COMMAND_TYPES.SCAN_BARCODE,
      data: { action: 'scan' }
    };
  }
  
  // Check for stock alert commands
  if ((lowerCmd.includes('alert') || lowerCmd.includes('notification')) && 
      (lowerCmd.includes('stock') || lowerCmd.includes('inventory'))) {
    return {
      type: VOICE_COMMAND_TYPES.STOCK_ALERT,
      data: extractStockAlertInfo(command)
    };
  }
  
  // Check for shop type change commands
  if ((lowerCmd.includes('change') || lowerCmd.includes('update') || lowerCmd.includes('set')) && 
      (lowerCmd.includes('shop type') || lowerCmd.includes('store type'))) {
    return {
      type: VOICE_COMMAND_TYPES.CHANGE_SHOP_TYPE,
      data: extractShopTypeInfo(command)
    };
  }
  
  // Check if this is a bill-related command (contains any bill keyword)
  const isBillCommand = languageKeywords.bill.some(keyword => lowerCmd.includes(keyword));
  
  // If it contains a bill keyword or just has product information (like "5kg sugar")
  if (isBillCommand || /\d+\s*([a-zA-Z]+\s+)?[a-zA-Z]+/.test(lowerCmd)) {
    const billInfo = processBillingVoiceCommand(command);
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
  
  // Check for stock update commands
  if ((lowerCmd.includes('update') || lowerCmd.includes('change')) && 
      (lowerCmd.includes('stock') || lowerCmd.includes('inventory'))) {
    const stockInfo = extractStockAlertInfo(command);
    return {
      type: VOICE_COMMAND_TYPES.UPDATE_STOCK,
      data: stockInfo
    };
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
