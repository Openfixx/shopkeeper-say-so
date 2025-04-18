import { createClient } from '@supabase/supabase-js';
import { supabase as officialClient } from '@/integrations/supabase/client';

// ▼▼▼ ENVIRONMENT SETUP ▼▼▼
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ▼▼▼ CORE CLIENT INITIALIZATION ▼▼▼
export const supabase = (() => {
  try {
    if (officialClient) return officialClient;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase credentials - using demo mode');
    }

    return createClient(
      supabaseUrl || 'https://dypjflendokbbixxahxp.supabase.co',
      supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cGpmbGVuZG9rYmJpeHhhaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NDIwOTAsImV4cCI6MjA1ODQxODA5MH0.gGtoHAtu9UQ466vo1cirtLls0h_Zp8TlxKhagsSNwLI',
      {
        auth: { persistSession: true }
      }
    );
  } catch (error) {
    console.error('Supabase init error:', error);
    return createMockClient();
  }
})();

// ▼▼▼ VOICE-ENABLED PRODUCT OPERATIONS ▼▼▼
export interface VoiceProduct {
  name: string;
  quantity: number;
  unit: string;
  position: string;
  image_url?: string;
  price?: number;
}

export const saveVoiceProduct = async (product: VoiceProduct) => {
  const { data, error } = await supabase
    .from('products')
    .upsert({
      ...product,
      created_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('Voice product save failed:', error);
    throw error;
  }
  return data;
};

export const getProductByName = async (name: string) => {
  const { data, error } = await supabase
    .from('products')
    .select()
    .ilike('name', name)
    .maybeSingle();

  return { data, error };
};

// ▼▼▼ ENHANCED IMAGE HANDLING ▼▼▼
export const uploadProductImage = async (productName: string, file: File) => {
  const fileName = `${productName.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}`;
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (error) throw error;

  return supabase.storage
    .from('product-images')
    .getPublicUrl(data.path).data.publicUrl;
};

// ▼▼▼ INVENTORY INTEGRATION ▼▼▼
export const addInventoryFromVoice = async (
  product: VoiceProduct,
  options?: { price?: number; expiry?: string }
) => {
  const { data, error } = await supabase
    .from('inventory')
    .insert({
      product_name: product.name,
      quantity: product.quantity,
      price: options?.price || 0,
      expiry_date: options?.expiry || null,
      image_url: product.image_url
    })
    .select();

  if (error) throw error;
  return data;
};

// ▼▼▼ UTILITY FUNCTIONS ▼▼▼
const createMockClient = () => {
  console.warn('Using mock Supabase client');
  return {
    auth: { getUser: async () => ({ data: { user: null } }) } as any,
    from: () => ({
      select: () => ({
        ilike: () => ({ maybeSingle: async () => ({ data: null }) })
      }),
      upsert: async () => ({ data: null })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock-path' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  } as unknown as ReturnType<typeof createClient>;
};

// ▼▼▼ TYPE DEFINITIONS (keep your existing types) ▼▼▼
export type DbProduct = {
  id: string;
  name: string;
  image_url?: string;
  created_at: string;
  quantity?: number;
  unit?: string;
  position?: string;
  price?: number;
  expiry?: string;
};

export type DbInventoryItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  expiry_date?: string;
  image_url?: string;
  created_at: string;
};
