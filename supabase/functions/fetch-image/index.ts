
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
    
    // Use Pixabay API
    const PIXABAY_API_KEY = Deno.env.get('PIXABAY_API_KEY') || '36941293-fbca42b94c62a046e799269fa';
    
    const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&safesearch=true`;
    
    const pixabayResponse = await fetch(pixabayUrl);
    
    if (pixabayResponse.ok) {
      const data = await pixabayResponse.json();
      
      if (data.hits && data.hits.length > 0) {
        // Get the first image result
        const imageUrl = data.hits[0].webformatURL;
        
        return new Response(
          JSON.stringify({ 
            success: true,
            source: 'pixabay',
            imageUrl: imageUrl 
          }),
          { headers: corsHeaders }
        );
      }
    }
    
    // Fallback to placeholder
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
