
export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  user_id: string;
  description: string;
  quantity: number;
  unit: string;
  position?: string;
  expiry?: string;
  image?: string; // For backward compatibility
  barcode?: string;
  stockAlert?: number;
  createdAt?: string;
  updatedAt?: string;
  shopId?: string;
  // Add mappings for the other version of Product type
  userId?: string; // Maps to user_id
};

export type InventoryItem = {
  id: string;
  product_name: string;
  quantity: number;
  user_id: string;
};
