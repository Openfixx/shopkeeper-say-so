
import { toast } from 'sonner';

/**
 * Fetch product image via Unsplash Source API (free & unlimited) 
 */
export const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) {
    return `https://placehold.co/300x300?text=No+Product+Name`;
  }
  
  const encodedQuery = encodeURIComponent(productName);
  
  try {
    toast.loading(`Finding image for ${productName}...`);
    
    // Primary strategy: Unsplash Source API
    try {
      // 300×300px, random photo of "<productName>"
      const url = `https://source.unsplash.com/300x300/?${encodedQuery}`;
      toast.dismiss();
      toast.success('Image found!');
      return url;
    } catch (unsplashErr) {
      console.error('Unsplash Source error:', unsplashErr);
      
      // Secondary strategy: Try with a more general term if specific search fails
      const genericTerm = productName.split(' ')[0];
      if (genericTerm !== productName) {
        try {
          const PIXABAY_API_KEY = '36941293-fbca42b94c62a046e799269fa'; // This should ideally be in an env var
          const genericResponse = await fetch(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(genericTerm)}&image_type=photo&per_page=3`
          );
          
          if (genericResponse.ok) {
            const genericData = await genericResponse.json();
            if (genericData.hits && genericData.hits.length > 0) {
              toast.dismiss();
              toast.success('Generic image found');
              return genericData.hits[0].webformatURL;
            }
          }
        } catch (genericErr) {
          console.error('Generic term search error:', genericErr);
        }
      }
      
      // Fallback if all else fails
      toast.dismiss();
      toast.error('No image found');
      return `https://placehold.co/300x300?text=${encodedQuery}`;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    toast.dismiss();
    toast.error('Image search failed');
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

// Cache images to improve performance
const imageCache = new Map<string, string>();

export const getCachedImage = async (productName: string): Promise<string> => {
  const normalizedName = productName.toLowerCase().trim();
  
  if (imageCache.has(normalizedName)) {
    return imageCache.get(normalizedName) || `https://placehold.co/300x300?text=${encodeURIComponent(normalizedName)}`;
  }
  
  const imageUrl = await fetchProductImage(normalizedName);
  
  if (imageUrl) {
    imageCache.set(normalizedName, imageUrl);
  }
  
  return imageUrl;
};
