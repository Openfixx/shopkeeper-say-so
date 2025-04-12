
import { getCachedImage, cacheProductImage } from './imageCache';

export const fetchProductImage = async (productName: string) => {
  // Check cache first
  const cachedImage = await getCachedImage(productName);
  if (cachedImage) return cachedImage;

  // Use DuckDuckGo API through our Supabase edge function
  try {
    console.log("Fetching image from DuckDuckGo for:", productName);
    
    // Use the Supabase edge function to fetch from DuckDuckGo
    const { data, error } = await fetch('/api/fetch-image?q=' + encodeURIComponent(productName), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
    
    if (!error && data?.imageUrl) {
      console.log("Found image on DuckDuckGo:", data.imageUrl);
      return await cacheProductImage(productName, data.imageUrl);
    } else {
      console.log("DuckDuckGo API failed or returned no results:", error || "No image found");
      // Use a placeholder image instead
      const placeholderUrl = `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
      return await cacheProductImage(productName, placeholderUrl);
    }
  } catch (error) {
    console.error("Image fetch failed:", error);
    return "/placeholder.png";
  }
};
