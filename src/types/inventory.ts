
// Extending the inventory types to include category field

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  position?: string;
  expiry?: string;
  notes?: string;
  image_url?: string;
  category?: string;
}

export interface InventoryContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Product) => void;
  deleteProduct: (id: string) => void;
}
