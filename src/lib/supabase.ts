
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

// ▼▼▼ TYPE DEFINITIONS ▼▼▼
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
  user_id?: string;
};

export type DbInventoryItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  expiry_date?: string;
  image_url?: string;
  created_at: string;
  product_id?: string;
  user_id?: string;
  position?: string;
};

// Add missing bill-related types
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

// Add type for profile
export type DbProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_id?: string;
  preferred_language?: string;
  avatar?: string;
};
