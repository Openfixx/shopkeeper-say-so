import { getCachedImage, cacheProductImage } from './imageCache';

export const fetchProductImage = async (productName: string) => {
  // Check cache first
  const cachedImage = await getCachedImage(productName);
  if (cachedImage) return cachedImage;

  // Fetch from DuckDuckGo
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json`
    );
    const imageUrl = (await res.json()).image_results[0]?.thumbnail;
    
    if (imageUrl) {
      return await cacheProductImage(productName, imageUrl);
    }
  } catch (error) {
    console.error("Image fetch failed:", error);
  }

  return "/placeholder.png";
};
