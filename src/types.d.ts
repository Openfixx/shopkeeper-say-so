
export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  position?: string;
  expiry?: string;
  image?: string;
  image_url?: string;
  barcode?: string;
  description?: string;
  stockAlert?: number;
  createdAt?: string;
  updatedAt?: string;
  shopId?: string;
  user_id?: string;
  userId?: string; // Alias for user_id
}
