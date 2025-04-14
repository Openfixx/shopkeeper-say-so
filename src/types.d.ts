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
  stock_alert?: number;
  created_at?: string;
  updated_at?: string;
  shop_id?: string;
  user_id?: string;
}
