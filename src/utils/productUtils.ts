import { Product } from '@/types';

/**
 * Converts between different product object formats in the application
 */
export const convertProduct = (product: any): Product => {
  return {
    id: product.id || '',
    name: product.name || '',
    description: product.description || '',
    price: typeof product.price === 'number' ? product.price : 0,
    quantity: typeof product.quantity === 'number' ? product.quantity : 0,
    unit: product.unit || '',
    position: product.position || '',
    image_url: product.image || product.image_url || '',
    image: product.image || product.image_url || '',
    user_id: product.userId || product.user_id || '',
    created_at: product.createdAt || product.created_at || '',
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
