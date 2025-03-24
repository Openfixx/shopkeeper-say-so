
import { createClient } from '@supabase/supabase-js';

// Get environment variables with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Create Supabase client with proper error handling
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', // Fallback to prevent runtime errors
  supabaseAnonKey || 'placeholder-key'
);

// Database types
export type DbProduct = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image_url?: string;
  barcode?: string;
  stock_alert?: number;
  created_at: string;
  updated_at: string;
  shop_id?: string;
  user_id: string;
};

export type DbBill = {
  id: string;
  total: number;
  delivery_option: boolean;
  payment_method: string;
  partial_payment: boolean;
  created_at: string;
  user_id: string;
};

export type DbBillItem = {
  id: string;
  bill_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
};

export type DbShop = {
  id: string;
  name: string;
  type: string;
  location: string;
  distance?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type DbStockAlert = {
  id: string;
  product_id: string;
  threshold: number;
  notification_sent: boolean;
  created_at: string;
  user_id: string;
};
