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
  // Verify image exists
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject('Invalid image');
    img.src = imageUrl;
  });

  const { data, error } = await supabase
    .from('products')
    .upsert({ 
      name: productName.toLowerCase(),
      image_url: imageUrl 
    })
    .select();

  if (error) throw error;
  return data[0].image_url;
};

export const fetchProductImage = async (productName: string) => {
  // Check cache first
  const cached = await getCachedImage(productName);
  if (cached) {
    const { error } = await supabase.storage
      .from('product-images')
      .download(cached.split('/').pop()!);
    if (!error) return cached;
  }

  // Fetch new image
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${productName}&iax=images&ia=images&format=json`
    );
    const imageUrl = (await res.json()).image_results[0]?.thumbnail;
    return imageUrl ? await cacheProductImage(productName, imageUrl) : null;
  } catch {
    return null;
  }
};
