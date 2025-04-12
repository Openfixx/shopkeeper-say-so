
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetch product image from DuckDuckGo or other sources
 */
export const fetchProductImage = async (productName: string): Promise<string | null> => {
  try {
    // First try to fetch from DuckDuckGo via edge function
    try {
      toast.loading(`Finding image for ${productName}...`);
      
      const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
        body: { 
          type: 'fetch_image', 
          data: productName 
        }
      });
      
      toast.dismiss();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.imageUrl) {
        console.log('Image found:', data.imageUrl);
        toast.success('Image found!');
        return data.imageUrl;
      }
    } catch (error) {
      console.error('Error fetching from edge function:', error);
    }
    
    // Fallback to Unsplash API if DuckDuckGo failed
    console.log('Falling back to Unsplash for images');
    toast.info('Trying alternative image source...');
    
    const unsplashUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(`${productName} product`)}`;
    return unsplashUrl;
  } catch (error) {
    console.error('All image fetching methods failed:', error);
    toast.error('Could not find an image');
    
    // Final fallback to placeholder
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
