
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved function to fetch images from DuckDuckGo with better reliability
async function fetchDuckDuckGoImage(query: string): Promise<string | null> {
  try {
    console.log(`Searching DuckDuckGo for images of: ${query}`);
    
    // Try different variations of the query to improve results
    const queryVariations = [
      query,
      `${query} product`,
      `${query} package`,
      `${query} grocery item`,
      `${query} food item`
    ];
    
    // Try each query variation
    for (const currentQuery of queryVariations) {
      try {
        console.log(`Trying query variation: ${currentQuery}`);
        
        // Use DuckDuckGo API with a unique parameter to avoid caching
        const timestamp = new Date().getTime();
        const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(currentQuery)}&format=json&t=lovableshop${timestamp}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.log(`DuckDuckGo API returned status: ${response.status} for query: ${currentQuery}`);
          continue;  // Try next variation
        }
        
        const data = await response.json();
        console.log(`Got DuckDuckGo response for: ${currentQuery}`);
        
        // Try to extract image from various parts of the response
        if (data.Image && data.Image.length > 0) {
          const imageUrl = `https://duckduckgo.com${data.Image}`;
          console.log(`Found image in Image field: ${imageUrl}`);
          return imageUrl;
        }
        
        // Check for related topics with icons
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          for (const topic of data.RelatedTopics) {
            if (topic.Icon && topic.Icon.URL && topic.Icon.URL.length > 0) {
              const imageUrl = `https://duckduckgo.com${topic.Icon.URL}`;
              console.log(`Found image in RelatedTopics: ${imageUrl}`);
              return imageUrl;
            }
          }
        }
      } catch (innerError) {
        console.error(`Error with query variation ${currentQuery}:`, innerError);
      }
    }
    
    console.log("No images found in DuckDuckGo response after trying all variations");
    return null;
  } catch (error) {
    console.error("Error in fetchDuckDuckGoImage:", error);
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
    
    console.log(`Processing image search for: ${query}`);
    
    // Try to get image from DuckDuckGo with multiple attempts
    const imageUrl = await fetchDuckDuckGoImage(query);
    
    if (imageUrl) {
      console.log(`Found image for "${query}": ${imageUrl}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          query,
          imageUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // If no image found, use placeholder
      console.log(`No image found on DuckDuckGo for: ${query}, using placeholder`);
      const placeholderUrl = `https://placehold.co/300x300?text=${encodeURIComponent(query)}`;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          query,
          imageUrl: placeholderUrl,
          isPlaceholder: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
