import { supabase } from './supabase';

export const getCachedImage = async (productName: string) => {
  const { data } = await supabase
    .from('products')
    .select('image_url')
    .eq('name', productName.toLowerCase())
    .single();

  return data?.image_url || null;
};

export const cacheProductImage = async (productName: string, imageUrl: string) => {
  // Download image to store in Supabase
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], `${productName}.jpg`, { type: blob.type });

  // Upload to Supabase Storage
  const { publicUrl } = await supabase.uploadProductImage(productName, file);

  // Save reference in database
  await supabase
    .from('products')
    .upsert({ 
      name: productName.toLowerCase(), 
      image_url: publicUrl 
    });
  
  return publicUrl;
};
