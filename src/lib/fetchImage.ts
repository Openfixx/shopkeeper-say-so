
import { toast } from 'sonner';

/** 
 * Fetch product image via Unsplash Source API (free & unlimited) 
 */
export const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) {
    return `https://placehold.co/300x300?text=No+Product+Name`;
  }
  try {
    // 300×300px, random photo of “<productName>”
    const url = `https://source.unsplash.com/300x300/?${encodeURIComponent(productName)}`;
    return url;
  } catch (err) {
    console.error('Unsplash Source error:', err);
    // last‐ditch placeholder
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

// Keep the cache logic as is below...
    
    // Try with a more general term if specific search fails
    const genericTerm = productName.split(' ')[0];
    if (genericTerm !== productName) {
      const genericResponse = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(genericTerm)}&image_type=photo&per_page=3`
      );
      
      if (genericResponse.ok) {
        const genericData = await genericResponse.json();
        if (genericData.hits && genericData.hits.length > 0) {
          toast.success('Generic image found');
          return genericData.hits[0].webformatURL;
        }
      }
    }
    
    toast.error('No image found');
    return `https://placehold.co/300x300?text=${encodedQuery}`;
    
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
