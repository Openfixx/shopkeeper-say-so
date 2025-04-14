
import { toast } from 'sonner';

/**
 * Fetch product image from Pixabay
 */
export const fetchProductImage = async (productName: string): Promise<string> => {
  try {
    toast.loading(`Finding image for ${productName}...`);
    
    // Try multiple image search strategies
    const strategies = [
      fetchImageFromAPI,
      fetchImageFromFallbackAPI,
      createPlaceholderImage
    ];
    
    for (const strategy of strategies) {
      try {
        const result = await strategy(productName);
        if (result) {
          toast.dismiss();
          toast.success('Image found!');
          return result;
        }
      } catch (error) {
        console.error(`Strategy failed:`, error);
        // Continue to next strategy
      }
    }
    
    toast.dismiss();
    toast.error('Could not find an image');
    
    // Final fallback - use placeholder
    return createPlaceholderImage(productName);
  } catch (error) {
    console.error('Error in image fetching process:', error);
    toast.dismiss();
    toast.error('Image search failed');
    
    // Ultimate fallback
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

/**
 * Primary strategy - use our API endpoint with Pixabay
 */
async function fetchImageFromAPI(productName: string): Promise<string | null> {
  const response = await fetch(`/api/fetch-image?q=${encodeURIComponent(productName)}`, {
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  // Check if response is HTML instead of JSON (common error with our API)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Received HTML instead of JSON');
  }
  
  try {
    const data = await response.json();
    return data?.imageUrl || null;
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Failed to parse API response');
  }
}

/**
 * Fallback strategy - try alternative search terms
 */
async function fetchImageFromFallbackAPI(productName: string): Promise<string | null> {
  // Try with alternative search terms
  const searchTerms = [
    `${productName} product`,
    `${productName} package`,
    `${productName} grocery`
  ];
  
  for (const term of searchTerms) {
    try {
      const response = await fetch(`/api/fetch-image?q=${encodeURIComponent(term)}`, {
        method: 'GET'
      });
      
      if (!response.ok) continue;
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) continue;
      
      const data = await response.json();
      if (data?.imageUrl) {
        return data.imageUrl;
      }
    } catch (error) {
      console.error(`Error with search term "${term}":`, error);
      // Continue to next term
    }
  }
  
  return null;
}

/**
 * Last resort - generate placeholder image
 */
function createPlaceholderImage(productName: string): string {
  return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
}

/**
 * Cache images to improve performance
 */
const imageCache = new Map<string, string>();

export const getCachedImage = async (productName: string): Promise<string> => {
  const normalizedName = productName.toLowerCase().trim();
  
  if (imageCache.has(normalizedName)) {
    return imageCache.get(normalizedName) || createPlaceholderImage(normalizedName);
  }
  
  const imageUrl = await fetchProductImage(normalizedName);
  
  if (imageUrl) {
    imageCache.set(normalizedName, imageUrl);
  }
  
  return imageUrl;
};
