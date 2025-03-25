
import { createClient } from '@supabase/supabase-js';

// Get environment variables with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with proper error handling
export const supabase = (() => {
  try {
    if (!supabaseUrl) {
      console.warn('Supabase URL not provided. Using demo mode.');
    }
    
    if (!supabaseAnonKey) {
      console.warn('Supabase Anon Key not provided. Using demo mode.');
    }
    
    // Use demo mode with placeholder URL if credentials are missing
    const url = supabaseUrl || 'https://placeholder-url.supabase.co';
    const key = supabaseAnonKey || 'placeholder-key';
    
    return createClient(url, key);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Return a placeholder client that won't throw errors but won't actually connect
    const mockClient = {
      auth: {
        signInWithPassword: async () => ({ data: { session: { user: { id: 'demo-user-id', email: 'demo@example.com' } } }, error: null }),
        signUp: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null })
          }),
          insert: async () => ({ error: null })
        })
      })
    };
    return mockClient as any;
  }
})();

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
