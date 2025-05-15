
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
  user_id?: string;
  product_id?: string;
  position?: string;
}

// 1. Add new product (with image caching)
export const addProduct = async (
  name: string, 
  imageFile: File
): Promise<Product> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
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
      image_url: urlData.publicUrl,
      user_id: user?.id // Add user_id for RLS
    })
    .select()
    .single();

  if (error) throw error;
  
  const now = new Date().toISOString();
  
  // Return product with parsed id and standard properties
  return {
    id: data?.id || name, // Use actual ID from the database
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
    updatedAt: now, // Use the current timestamp instead of trying to access data.updated_at
    userId: user?.id || 'demo-user', // Use actual user ID or fallback
  };
};

// 2. Add inventory item
export const addInventoryItem = async (
  item: Omit<InventoryItem, 'id' | 'created_at' | 'user_id'>
) => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // First ensure the referenced product exists
    let productId = item.product_id;
    
    if (!productId) {
      // Look up product by name
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .ilike('name', item.product_name)
        .maybeSingle();
        
      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        // Create the product first
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: item.product_name,
            image_url: item.image_url || '',
            user_id: user?.id
          })
          .select('id')
          .single();
          
        if (productError) {
          throw new Error(`Failed to create product: ${productError.message}`);
        }
        
        productId = newProduct.id;
      }
    }
    
    // Add user_id and product_id to the item
    const itemWithUser = {
      ...item,
      user_id: user?.id,
      product_id: productId
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert(itemWithUser)
      .select();

    if (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error in addInventoryItem:', error);
    throw error;
  }
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

// 5. Add multiple products at once
export const addMultipleProducts = async (products: Array<{
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
  hindi_name?: string;
  expiry_date?: string;
  position?: string;
}>) => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const results = [];
    const errors = [];
    
    // Process each product sequentially to handle foreign key constraints
    for (const product of products) {
      try {
        // First check if product exists in products table
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .ilike('name', product.product_name)
          .maybeSingle();
          
        let productId = existingProduct?.id;
        
        // If product doesn't exist, create it first
        if (!existingProduct) {
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              name: product.product_name,
              image_url: product.image_url || '',
              user_id: user?.id
            })
            .select('id')
            .single();
            
          if (productError) {
            console.error(`Failed to create product ${product.product_name}:`, productError);
            errors.push({ product: product.product_name, error: productError.message });
            continue; // Skip to next product
          }
          
          productId = newProduct.id;
        }
        
        // Now add to inventory with the valid product ID
        const { data, error } = await supabase
          .from('inventory')
          .insert({
            ...product,
            product_id: productId,
            user_id: user?.id
          })
          .select();
          
        if (error) {
          console.error(`Failed to add ${product.product_name} to inventory:`, error);
          errors.push({ product: product.product_name, error: error.message });
          continue;
        }
        
        results.push(data[0]);
        
      } catch (productError) {
        console.error(`Error processing ${product.product_name}:`, productError);
        errors.push({ product: product.product_name, error: String(productError) });
      }
    }
    
    return { results, errors };
    
  } catch (error) {
    console.error('Error in addMultipleProducts:', error);
    throw error;
  }
};
