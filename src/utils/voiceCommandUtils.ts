
import { VoiceProduct } from '@/types/voice';

export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'kg': 'kilogram',
    'g': 'gram',
    'kgs': 'kilogram',
    'grams': 'gram',
    'kilos': 'kilogram',
    'kilo': 'kilogram',
    'kilograms': 'kilogram',
    'kilogram': 'kilogram',
    'l': 'liter',
    'ml': 'milliliter',
    'liter': 'liter',
    'litre': 'liter',
    'liters': 'liter',
    'litres': 'liter',
    'milliliter': 'milliliter',
    'millilitre': 'milliliter',
    'milliliters': 'milliliter',
    'millilitres': 'milliliter',
    'packet': 'packet',
    'packets': 'packet',
    'pack': 'packet',
    'packs': 'packet',
    'bottle': 'bottle',
    'bottles': 'bottle',
    'can': 'can',
    'cans': 'can',
    'sachet': 'sachet',
    'sachets': 'sachet',
    'piece': 'piece',
    'pieces': 'piece',
    'pcs': 'piece',
    'pc': 'piece',
    'box': 'box',
    'boxes': 'box',
    'unit': 'unit',
    'units': 'unit',
    'dozen': 'dozen',
    'dozens': 'dozen',
    'bag': 'bag',
    'bags': 'bag'
  };

  return unitMap[unit.toLowerCase()] || 'piece';
}

export function parseMultipleProducts(command: string): VoiceProduct[] {
  if (!command) return [];
  
  // Normalize text
  const normalizedCommand = command.toLowerCase().trim();
  
  // Patterns to identify product segments
  const productSegments: string[] = normalizedCommand
    // Replace common connectors with commas for easier splitting
    .replace(/\s+and\s+|\s+plus\s+|\s+also\s+|\s+with\s+/gi, ', ')
    // Split by commas
    .split(/\s*,\s*/);
  
  // Process each segment
  const products: VoiceProduct[] = [];
  
  productSegments.forEach(segment => {
    if (!segment.trim()) return;
    
    // Extract command type
    let productName = '';
    let quantity = 1;
    let unit = 'piece';
    let position = '';
    
    // Extract quantity and unit
    const quantityMatch = segment.match(/(\d+(?:\.\d+)?)\s*(kg|g|kgs|grams|l|ml|liter|litre|packet|packets|pack|packs|bottle|bottles|can|cans|piece|pieces|pcs|pc|box|boxes|unit|units|dozen|dozens|bag|bags)/i);
    
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = normalizeUnit(quantityMatch[2]);
      
      // Remove the quantity and unit from the segment to extract product name
      productName = segment.replace(quantityMatch[0], '').trim();
      
      // If segment starts with "add", "get", etc., remove it
      productName = productName.replace(/^(add|get|buy|need|want)\s+/i, '').trim();
    } else {
      // No quantity/unit found
      // Check if segment starts with "add", "get", etc.
      const actionMatch = segment.match(/^(add|get|buy|need|want)\s+(.*)/i);
      if (actionMatch) {
        productName = actionMatch[2].trim();
      } else {
        productName = segment.trim();
      }
    }
    
    // Extract position if available
    const positionMatch = segment.match(/\b(?:in|on|at|to)\s+(rack|shelf|section|aisle|row|cabinet|drawer|bin|box)\s*(\d+|[a-z])\b/i);
    if (positionMatch) {
      position = `${positionMatch[1]} ${positionMatch[2]}`.trim();
      // Remove position from product name
      productName = productName.replace(positionMatch[0], '').trim();
    }
    
    // Only add if we have a product name
    if (productName) {
      products.push({
        name: productName,
        quantity,
        unit,
        position,
        image_url: ''
      });
    }
  });
  
  return products;
}

export function validateProductDetails(product: { 
  name: string; 
  quantity?: number; 
  unit?: string;
  position?: string;
  price?: number;
}): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!product.name) missingFields.push('name');
  if (!product.quantity) missingFields.push('quantity');
  if (!product.unit) missingFields.push('unit');
  if (!product.position) missingFields.push('location');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
