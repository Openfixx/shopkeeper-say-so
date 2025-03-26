
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
    // In a real implementation, this would receive audio data
    // For now, we'll accept text to simulate speech recognition
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: text is required to simulate speech" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    console.log("Processing speech request (simulated):", text);
    
    // Simulate processing time for speech recognition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // This is a mock implementation similar to what Vosk would return
    const result = {
      success: true,
      text: text,
      confidence: 0.95,
      words: text.split(' ').map((word, index) => ({
        word,
        start: index * 0.3,
        end: (index + 1) * 0.3,
        conf: 0.9 + Math.random() * 0.1
      }))
    };
    
    console.log("Speech recognition result:", result);
    
    return new Response(
      JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in speech recognition function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An error occurred while processing the speech"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
