
import { createClient } from '@supabase/supabase-js';
import { supabase as officialClient } from '@/integrations/supabase/client';

// Get environment variables with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Add this near other supabase functions
export const withUser = async (data: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  return { ...data, user_id: user?.id };
};

// Create Supabase client with proper error handling
export const supabase = (() => {
  try {
    // If we have the official client from the integration, use it
    if (officialClient) {
      console.log('Using official Supabase client from integration');
      return officialClient;
    }
    
    if (!supabaseUrl) {
      console.warn('Supabase URL not provided. Using demo mode.');
    }
    
    if (!supabaseAnonKey) {
      console.warn('Supabase Anon Key not provided. Using demo mode.');
    }
    
    // Use credentials if available, otherwise use the same defaults
    console.log('Creating Supabase client with URL:', supabaseUrl || 'https://dypjflendokbbixxahxp.supabase.co');
    const client = createClient(
      supabaseUrl || 'https://dypjflendokbbixxahxp.supabase.co', 
      supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cGpmbGVuZG9rYmJpeHhhaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NDIwOTAsImV4cCI6MjA1ODQxODA5MH0.gGtoHAtu9UQ466vo1cirtLls0h_Zp8TlxKhagsSNwLI',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: localStorage
        }
      }
    );
    
    return client;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Return a placeholder client that won't throw errors but won't actually connect
    const mockClient = {
      auth: {
        signInWithPassword: async () => ({ data: { session: { user: { id: 'demo-user-id', email: 'demo@example.com' } } }, error: null }),
        signUp: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: { path: 'mock-path.jpg' }, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '/placeholder.png' } })
        })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null })
          }),
          insert: async () => ({ data: null, error: null }),
          upsert: async () => ({ data: null, error: null })
        })
      }),
      functions: {
        invoke: async () => ({ data: null, error: null })
      }
    };
    return mockClient as any;
  }
})();

// ======================
// Storage Functions
// ======================

export const uploadProductImage = async (productName: string, imageFile: File) => {
  try {
    // Sanitize filename
    const fileName = `${productName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    
    // Upload with error handling
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false // Prevent accidental overwrites
      });

    if (error) throw error;

    // Get long-lived URL
    return supabase.storage
      .from('product-images')
      .getPublicUrl(data.path, {
        download: false
      }).data.publicUrl;
      
  } catch (error) {
    console.error("[Supabase] Image upload failed:", error);
    return null;
  }
};

// ======================
// Product CRUD Operations
// ======================

export const findProduct = async (name: string) => {
  const { data, error } = await supabase
    .from('products')
    .select()
    .eq('name', name.toLowerCase())
    .maybeSingle();

  return { data, error };
};

export const saveProduct = async (product: Omit<DbProduct, 'created_at'>) => {
  return await supabase
    .from('products')
    .upsert({
      ...product,
      created_at: new Date().toISOString()
    })
    .select();
};

// ======================
// Inventory Operations
// ======================

export const addInventoryItem = async (
  item: Omit<DbInventoryItem, 'id' | 'created_at'>
) => {
  return await supabase
    .from('inventory')
    .insert({
      ...item,
      created_at: new Date().toISOString()
    })
    .select();
};

// ======================
// Database Types
// ======================

export type DbProduct = {
  id: string;           // Added for compatibility with InventoryContext
  name: string;         // Primary key
  image_url: string;    // URL from storage
  created_at: string;   // Auto-generated
  quantity?: number;    // Added for compatibility with InventoryContext
  unit?: string;        // Added for compatibility with InventoryContext
  position?: string;    // Added for compatibility with InventoryContext
  price?: number;       // Added for compatibility with InventoryContext
  expiry?: string;      // Added for compatibility with InventoryContext
  barcode?: string;     // Added for compatibility with InventoryContext
  stock_alert?: number; // Added for compatibility with InventoryContext
  updated_at?: string;  // Added for compatibility with InventoryContext
  shop_id?: string;     // Added for compatibility with InventoryContext
  user_id?: string;     // Added for compatibility with InventoryContext
};

export type DbInventoryItem = {
  id: number;            // Auto-increment
  product_name: string;  // References products.name
  hindi_name: string | null;
  quantity: number;
  price: number;         // In paise (₹100 = 10000)
  expiry_date: string | null;
  image_url: string | null;
  created_at: string;    // Auto-generated
};

// Keep your existing types below
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
