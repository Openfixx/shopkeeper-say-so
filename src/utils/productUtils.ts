
import { Product } from '@/types';

// Utility function to convert product data from different sources to a consistent Product type
export const convertProduct = (input: any): Product => {
  if (!input) {
    return {
      id: '',
      name: '',
      quantity: 0,
      unit: '',
      price: 0,
      position: '',
      description: '',
      image: '',
      image_url: '',
      created_at: new Date().toISOString()
    };
  }

  // Create a standardized product object
  return {
    id: input.id || '',
    name: input.name || input.product_name || '',
    quantity: typeof input.quantity === 'number' ? input.quantity : 0,
    unit: input.unit || '',
    position: input.position || '',
    price: typeof input.price === 'number' ? input.price : 0,
    image: input.image || '',
    image_url: input.image_url || input.imageUrl || '',
    created_at: input.created_at || input.createdAt || new Date().toISOString(),
    expiry: input.expiry || input.expiry_date || '',
    barcode: input.barcode || '',
    description: input.description || '',
  };
};

// Function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
};

// Function to format date
export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString();
};

// Function to get expiry status
export const getExpiryStatus = (expiryDate: string | null | undefined): 'expired' | 'expiring' | 'valid' => {
  if (!expiryDate) return 'valid';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays < 30) return 'expiring';
  return 'valid';
};
