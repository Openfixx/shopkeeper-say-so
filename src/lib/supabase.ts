
import { createClient } from '@supabase/supabase-js';
import { supabase as officialClient } from '@/integrations/supabase/client';

// Get environment variables with better error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with proper error handling
export const supabase = (() => {
  try {
    // If we have the official client from the integration, use it
    if (officialClient) {
      return officialClient;
    }
    
    if (!supabaseUrl) {
      console.warn('Supabase URL not provided. Using demo mode.');
    }
    
    if (!supabaseAnonKey) {
      console.warn('Supabase Anon Key not provided. Using demo mode.');
    }
    
    // Use demo mode with placeholder URL if credentials are missing
    const url = supabaseUrl || 'https://dypjflendokbbixxahxp.supabase.co';
    const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cGpmbGVuZG9rYmJpeHhhaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NDIwOTAsImV4cCI6MjA1ODQxODA5MH0.gGtoHAtu9UQ466vo1cirtLls0h_Zp8TlxKhagsSNwLI';
    
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: localStorage
      }
    });
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

// Add to existing supabase client
export const uploadProductImage = async (productName: string, imageFile: File) => {
  try {
    // Generate unique filename
    const fileName = `${productName.toLowerCase().replace(/ /g, '-')}-${Date.now()}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile);

    if (error) throw error;

    // Return public URL
    return supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);
  } catch (error) {
    console.error("Image upload failed:", error);
    return { publicUrl: "/placeholder.png" };
  }
};
// Database types
// ======================

export type DbProduct = {
  name: string;          // Primary key
  image_url: string;     // URL from storage
  created_at: string;    // Auto-generated
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

// Keep existing types unchanged below this line
export type DbBill = {
  /* ... rest of your existing types ... */
