
import { toast } from 'sonner';

/**
 * Fetch product image from Pixabay API
 */
export const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) {
    return `https://placehold.co/300x300?text=No+Product+Name`;
  }

  try {
    toast.loading(`Finding image for ${productName}...`);
    
    const PIXABAY_API_KEY = '36941293-fbca42b94c62a046e799269fa'; // Free API key with limited usage
    const encodedQuery = encodeURIComponent(productName.trim());
    
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodedQuery}&image_type=photo&per_page=3`
    );
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    toast.dismiss();
    
    if (data.hits && data.hits.length > 0) {
      toast.success('Image found!');
      return data.hits[0].webformatURL;
    }
    
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
