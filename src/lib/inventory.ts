
// Define a simple inventory management library with key functions

/**
 * Generate a bill from items
 * @param items The items to include in the bill
 * @returns A bill object with items and total
 */
export function generateBill(items: { name: string; price: number }[]) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  
  return {
    items: items.map(item => ({
      name: item.name,
      price: item.price
    })),
    total
  };
}

/**
 * Calculate inventory value
 * @param items Inventory items with quantity and price
 * @returns Total value of inventory
 */
export function calculateInventoryValue(items: { quantity: number; price: number }[]) {
  return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

/**
 * Check if item is low in stock
 * @param quantity Current quantity
 * @param threshold Low stock threshold (default: 5)
 * @returns Boolean indicating if item is low in stock
 */
export function isLowStock(quantity: number, threshold: number = 5) {
  return quantity < threshold;
}

/**
 * Format price with currency symbol
 * @param price The price to format
 * @param currency The currency symbol (default: ₹)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '₹') {
  return `${currency}${price.toFixed(2)}`;
}

// Note: The addProduct function is actually provided by the InventoryContext,
// not in this utility file. The ImageUploader has been updated to use the context.
