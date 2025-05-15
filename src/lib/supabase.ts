
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
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // First ensure the product exists in the products table
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select()
      .ilike('name', product.name)
      .maybeSingle();
    
    let productId = existingProduct?.id;
    
    // If product doesn't exist, create it first
    if (!existingProduct) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          image_url: product.image_url || '',
          user_id: user?.id
        })
        .select()
        .single();
      
      if (productError) {
        console.error('Failed to create product:', productError);
        throw productError;
      }
      
      productId = newProduct.id;
    }
    
    // Now add to inventory with the valid product_id reference
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        product_name: product.name,
        quantity: product.quantity,
        price: product.price || 0,
        expiry_date: null,
        image_url: product.image_url,
        product_id: productId,
        user_id: user?.id
      })
      .select();

    if (error) {
      console.error('Voice product save failed:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveVoiceProduct:', error);
    throw error;
  }
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
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // First ensure the product exists in the products table
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', product.name)
      .maybeSingle();

    let productId = existingProduct?.id;
    
    // If product doesn't exist, create it first
    if (!existingProduct) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          image_url: product.image_url || '',
          user_id: user?.id
        })
        .select('id')
        .single();
        
      if (productError) {
        console.error('Failed to create product:', productError);
        throw new Error(`Failed to create product: ${productError.message}`);
      }
      
      productId = newProduct.id;
    }
    
    // Now add to inventory with the valid product_id reference
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        product_name: product.name,
        quantity: product.quantity,
        price: options?.price || product.price || 0,
        expiry_date: options?.expiry || null,
        image_url: product.image_url,
        product_id: productId,
        user_id: user?.id
      })
      .select();

    if (error) {
      console.error('Inventory addition failed:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in addInventoryFromVoice:', error);
    throw error;
  }
};

// ▼▼▼ BATCH OPERATIONS FOR MULTI-PRODUCT COMMANDS ▼▼▼
export const addMultipleProductsToInventory = async (products: VoiceProduct[]) => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const results = [];
    const errors = [];
    
    // Process each product sequentially to ensure proper error handling
    for (const product of products) {
      try {
        // First ensure the product exists in products table
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .ilike('name', product.name)
          .maybeSingle();
          
        let productId = existingProduct?.id;
        
        // If product doesn't exist, create it first
        if (!existingProduct) {
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              image_url: product.image_url || '',
              user_id: user.id
            })
            .select('id')
            .single();
            
          if (productError) {
            console.error(`Failed to create product ${product.name}:`, productError);
            errors.push({ product: product.name, error: productError.message });
            continue; // Skip to next product
          }
          
          productId = newProduct.id;
        }
        
        // Now add to inventory with valid product reference
        const { data, error } = await supabase
          .from('inventory')
          .insert({
            product_name: product.name,
            quantity: product.quantity,
            price: product.price || 0,
            expiry_date: null,
            image_url: product.image_url,
            product_id: productId,
            user_id: user.id,
            position: product.position || 'General Storage'
          })
          .select();
          
        if (error) {
          console.error(`Failed to add ${product.name} to inventory:`, error);
          errors.push({ product: product.name, error: error.message });
          continue;
        }
        
        results.push(data[0]);
        
      } catch (productError) {
        console.error(`Error processing ${product.name}:`, productError);
        errors.push({ product: product.name, error: productError.message });
      }
    }
    
    return { results, errors };
    
  } catch (error) {
    console.error('Error in addMultipleProductsToInventory:', error);
    throw error;
  }
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
