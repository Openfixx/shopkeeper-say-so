

// Define common types used throughout the inventory system

export type BillItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  total: number;
  image?: string;
  image_url?: string;
};

export type Bill = {
  id: string;
  items: BillItem[];
  total: number;
  customerId?: string;
  customerName?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'cancelled';
};

export type Shop = {
  id: string;
  name: string;
  type: string;
  location: string;
  distance: number;
  products?: string[];
};

export type StockAlert = {
  productId: string;
  threshold: number;
};

// Type for the utility functions
export type ProductFindResult = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image?: string;
  image_url?: string;
};

