
/**
 * Fetch a product image based on the product name
 * @param name Product name to search for
 * @returns URL of an image for the product
 */
export const fetchProductImage = async (name: string): Promise<string> => {
  try {
    // Try to use Unsplash API (would require API key in production)
    // For demo purposes, we'll use a placeholder with the product name
    return `https://source.unsplash.com/300x300/?${encodeURIComponent(name)}`;
  } catch (error) {
    console.error("Error fetching product image:", error);
    // Fallback to a placeholder
    return `https://placehold.co/300x300?text=${encodeURIComponent(name)}`;
  }
};
