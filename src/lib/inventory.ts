import { supabase } from './supabase';

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
  return data;
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
