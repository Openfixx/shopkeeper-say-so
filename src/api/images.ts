export async function fetchProductImage(productName: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json`
    );
    const data = await response.json();
    return data.Image || ''; // Fallback if no image found
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return ''; // Return empty string on error
  }
}
