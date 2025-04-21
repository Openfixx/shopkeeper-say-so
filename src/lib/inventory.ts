import { supabase } from './supabase';
import { Product } from '@/types';

// Types
export interface InventoryItem {
  id: string; 
  product_name: string;
  quantity: number;
  price: number;
  hindi_name?: string;
  expiry_date?: string;
  image_url?: string;
  created_at: string;
}

// 1. Add new product (with image caching)
export const addProduct = async (
  name: string, 
  imageFile: File
): Promise<Product> => {
  // Upload image to storage
  const fileName = `${name}-${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, imageFile);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(uploadData.path);

  // Save to products table
  const { data, error } = await supabase
    .from('products')
    .insert({ 
      name: name.toLowerCase(), 
      image_url: urlData.publicUrl 
    })
    .select()
    .single();

  if (error) throw error;
  
  const now = new Date().toISOString();
  
  // Return product with parsed id and standard properties
  return {
    id: data?.name || name, // Fallback to name if no id exists
    name: data?.name || name,
    description: '',
    quantity: 0,
    unit: '',
    price: 0,
    position: '',
    image: '',
    image_url: data?.image_url || urlData.publicUrl,
    created_at: data?.created_at || now,
    createdAt: data?.created_at || now,
    updatedAt: data?.updated_at || now,
    userId: 'demo-user', // Default user ID
  };
};

// 2. Add inventory item
export const addInventoryItem = async (
  item: Omit<InventoryItem, 'id' | 'created_at'>
) => {
  const { data, error } = await supabase
    .from('inventory')
    .insert(item)
    .select();

  if (error) throw error;
  return data[0];
};

// 3. Get all inventory items with product info
export const getInventory = async () => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      products!inner(name, image_url)
    `);

  if (error) throw error;
  return data;
};

// 4. Generate bill from items
export const generateBill = (items: { name: string; price: number }[]) => {
  const billItems = items.map(item => ({
    name: item.name,
    price: item.price
  }));
  
  const total = billItems.reduce((sum, item) => sum + item.price, 0);
  
  return {
    items: billItems,
    total
  };
};
