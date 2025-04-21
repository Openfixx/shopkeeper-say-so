
export type Product = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  position: string; // This is required in InventoryContext.Product
  image_url: string;
  user_id?: string;
  expiry?: string;
  image?: string; // For backward compatibility
  barcode?: string;
  stockAlert?: number;
  created_at?: string; // For backward compatibility
  createdAt: string; // Now required
  updatedAt: string; // Now required (making it required instead of optional)
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
