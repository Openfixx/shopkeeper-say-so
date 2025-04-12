// Fetch product image from DuckDuckGo API
export async function fetchProductImage(productName: string): Promise<string> {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(productName)}&iax=images&ia=images&format=json`
  );
  const data = await response.json();
  return data.Image || ""; // Fallback to empty string if no image
}
