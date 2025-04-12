
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetch product image from DuckDuckGo
 */
export const fetchProductImage = async (productName: string): Promise<string | null> => {
  try {
    toast.loading(`Finding image for ${productName}...`);
    
    // Use the fetch-image edge function
    const response = await fetch('/api/fetch-image?q=' + encodeURIComponent(productName), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    toast.dismiss();
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.imageUrl) {
      console.log('Image found:', data.imageUrl);
      toast.success('Image found!');
      return data.imageUrl;
    } else {
      console.log('No image found from API');
      // Use a placeholder instead of Unsplash
      return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    toast.error('Could not find an image');
    
    // Use a placeholder
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

/**
 * Cache images to improve performance
 */
const imageCache = new Map<string, string>();

export const getCachedImage = async (productName: string): Promise<string | null> => {
  const normalizedName = productName.toLowerCase().trim();
  
  if (imageCache.has(normalizedName)) {
    return imageCache.get(normalizedName) || null;
  }
  
  const imageUrl = await fetchProductImage(normalizedName);
  
  if (imageUrl) {
    imageCache.set(normalizedName, imageUrl);
  }
  
  return imageUrl;
};
