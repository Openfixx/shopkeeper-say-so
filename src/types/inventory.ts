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
  category?: string; // Added category field
}

export interface InventoryContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Product) => void;
  deleteProduct: (id: string) => void;
}

// Add missing interfaces that were causing errors
export interface BillItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  total: number;
  image?: string;
}

export interface Bill {
  id: string;
  items: BillItem[];
  total: number;
  timestamp: string;
  status: 'completed' | 'cancelled' | 'pending';
}

export interface StockAlert {
  productId: string;
  threshold: number;
}

export interface ProductFindResult {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image?: string;
  image_url?: string;
}

export interface Shop {
  id: string;
  name: string;
  type: string;
  location: string;
  distance: number;
  products?: ProductFindResult[];
}
