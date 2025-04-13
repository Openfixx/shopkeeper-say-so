
import { Product } from '@/types';

// Convert between different Product type versions
export const convertProduct = (product: any): Product => {
  return {
    ...product,
    image_url: product.image_url || product.image || '',
    user_id: product.user_id || product.userId || '',
    userId: product.userId || product.user_id || '',
    image: product.image || product.image_url || '',
  };
};
