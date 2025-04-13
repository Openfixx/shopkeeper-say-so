

export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  user_id: string;
  description?: string;
  quantity?: number;
  unit?: string;
  position?: string;
  expiry?: string;
};

export type InventoryItem = {
  id: string;
  product_name: string;
  quantity: number;
  user_id: string;
};

