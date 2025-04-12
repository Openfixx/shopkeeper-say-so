
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to fetch images from DuckDuckGo with improved reliability
async function fetchDuckDuckGoImage(query: string): Promise<string | null> {
  try {
    console.log(`Searching DuckDuckGo for images of: ${query}`);
    
    // API endpoint for DuckDuckGo
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=lovable_inventory_app`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("DuckDuckGo response received");
    
    // Attempt to extract image from various parts of the response
    if (data.Image && data.Image.length > 0) {
      return `https://duckduckgo.com${data.Image}`;
    }
    
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      // Try to find an image in any of the related topics
      for (const topic of data.RelatedTopics) {
        if (topic.Icon && topic.Icon.URL && topic.Icon.URL.length > 0) {
          return `https://duckduckgo.com${topic.Icon.URL}`;
        }
      }
    }
    
    // If no image found, return null
    return null;
  } catch (error) {
    console.error("Error fetching from DuckDuckGo:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse query parameter
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      throw new Error('Missing query parameter');
    }
    
    // Try multiple variations of the query for better results
    const queryVariations = [
      query,
      `${query} product`,
      `${query} grocery item`,
      `${query} food`
    ];
    
    let imageUrl = null;
    
    // Try each query variation until we find an image
    for (const variation of queryVariations) {
      imageUrl = await fetchDuckDuckGoImage(variation);
      if (imageUrl) {
        console.log(`Found image for "${variation}": ${imageUrl}`);
        break;
      }
    }
    
    // If no image found from DuckDuckGo, fallback to Unsplash
    if (!imageUrl) {
      console.log(`No image found on DuckDuckGo, falling back to Unsplash for: ${query}`);
      imageUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(query)}`;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        query,
        imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in fetch-image function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unknown error occurred"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
