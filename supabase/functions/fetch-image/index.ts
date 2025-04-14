
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
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
        { headers: corsHeaders, status: 400 }
      );
    }
    
    console.log(`Searching for image of: ${query}`);
    
    // Try using Unsplash API first - more reliable than scraping
    try {
      const unsplashUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(query + " product")}`;
      const unsplashResponse = await fetch(unsplashUrl, { 
        method: 'GET',
        redirect: 'follow',
        headers: { 'Accept': 'image/*' }
      });
      
      if (unsplashResponse.ok) {
        const finalUrl = unsplashResponse.url;
        return new Response(
          JSON.stringify({ 
            success: true,
            source: 'unsplash',
            imageUrl: finalUrl 
          }),
          { headers: corsHeaders }
        );
      }
    } catch (unsplashError) {
      console.error('Unsplash fetch failed:', unsplashError);
      // Continue to backup method
    }
    
    // Fallback to Pexels or Pixabay or placeholder
    const placeholderUrl = `https://placehold.co/300x300?text=${encodeURIComponent(query)}`;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        source: 'placeholder',
        imageUrl: placeholderUrl
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in fetch-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while fetching the image',
        details: error.message
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
