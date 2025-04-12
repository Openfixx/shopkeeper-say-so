
import { getCachedImage, cacheProductImage } from './imageCache';

export const fetchProductImage = async (productName: string) => {
  // Check cache first
  const cachedImage = await getCachedImage(productName);
  if (cachedImage) return cachedImage;

  // First try DuckDuckGo API
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
    }
  } catch (error) {
    console.error("DuckDuckGo image fetch failed:", error);
  }
  
  // Fallback to Unsplash if DuckDuckGo fails
  try {
    console.log("Falling back to Unsplash for:", productName);
    const unsplashUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(productName + " product")}`;
    return await cacheProductImage(productName, unsplashUrl);
  } catch (error) {
    console.error("All image fetch methods failed:", error);
    return "/placeholder.png";
  }
};
