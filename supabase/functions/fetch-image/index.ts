
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter q is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Searching for image of: ${query}`);
    
    // Construct DuckDuckGo search URL
    const searchQuery = encodeURIComponent(`${query} product`);
    const searchUrl = `https://duckduckgo.com/?q=${searchQuery}&iax=images&ia=images`;
    
    // Fetch the search results page
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract image URLs from the response
    // This regex looks for image URLs in the DuckDuckGo response
    const imageRegex = /"image":"([^"]+)"/g;
    const matches = [...html.matchAll(imageRegex)];
    
    let imageUrl = null;
    if (matches.length > 0) {
      // Get the first image URL that isn't a data URL
      for (const match of matches) {
        if (match[1] && !match[1].startsWith('data:')) {
          imageUrl = match[1];
          break;
        }
      }
    }
    
    if (!imageUrl) {
      // Fallback to a different regex pattern
      const fallbackRegex = /"source":"([^"]+\.(?:jpg|png|jpeg))"/g;
      const fallbackMatches = [...html.matchAll(fallbackRegex)];
      
      if (fallbackMatches.length > 0) {
        imageUrl = fallbackMatches[0][1];
      }
    }
    
    // If still no image, use placeholder
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No image found',
          imageUrl: `https://placehold.co/300x300?text=${encodeURIComponent(query)}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while fetching the image'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
