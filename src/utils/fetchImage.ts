
// Cache for previously fetched images to avoid unnecessary API calls
const imageCache: Record<string, string> = {};

/**
 * Fetches an image for a product with caching
 * 
 * @param productName - Name of the product to fetch an image for
 * @returns A URL to an image for the product
 */
export const getCachedImage = async (productName: string): Promise<string> => {
  // Normalize the product name for consistent caching
  const normalizedName = productName.toLowerCase().trim();
  
  // Check if we have a cached image for this product
  if (imageCache[normalizedName]) {
    console.log('Using cached image for', normalizedName);
    return imageCache[normalizedName];
  }
  
  try {
    // Generate a clean search term by removing quantities and units
    const searchTerm = normalizedName
      .replace(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|units?|pack|packs|box|boxes)/gi, '')
      .trim();
    
    // Common product images for frequently used items
    const commonProducts: Record<string, string> = {
      'rice': 'https://source.unsplash.com/featured/?rice,bag',
      'sugar': 'https://source.unsplash.com/featured/?sugar,white',
      'flour': 'https://source.unsplash.com/featured/?flour,wheat',
      'milk': 'https://source.unsplash.com/featured/?milk,bottle',
      'bread': 'https://source.unsplash.com/featured/?bread,loaf',
      'eggs': 'https://source.unsplash.com/featured/?eggs,carton',
      'dal': 'https://source.unsplash.com/featured/?lentils,dal',
      'oil': 'https://source.unsplash.com/featured/?oil,cooking',
      'salt': 'https://source.unsplash.com/featured/?salt,table',
    };
    
    // Check if it's a common product
    for (const [key, url] of Object.entries(commonProducts)) {
      if (searchTerm.includes(key)) {
        imageCache[normalizedName] = url;
        return url;
      }
    }
    
    // Add a random parameter to prevent caching by the browser/CDN
    const randomParam = Date.now();
    const imageUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(searchTerm)}&random=${randomParam}`;
    
    // Cache the result for future use
    imageCache[normalizedName] = imageUrl;
    return imageUrl;
  } catch (error) {
    console.error('Error fetching product image:', error);
    // Return a placeholder if something goes wrong
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

/**
 * Optimized batch image fetching
 * 
 * @param productNames - Array of product names to fetch images for
 * @returns Record of product names to image URLs
 */
export const batchFetchImages = async (productNames: string[]): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < productNames.length; i += batchSize) {
    const batch = productNames.slice(i, i + batchSize);
    const promises = batch.map(name => getCachedImage(name).then(url => ({ name, url })));
    
    const batchResults = await Promise.allSettled(promises);
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results[result.value.name] = result.value.url;
      } else {
        console.error('Failed to fetch image:', result.reason);
      }
    });
    
    // Add a small delay between batches
    if (i + batchSize < productNames.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
};
