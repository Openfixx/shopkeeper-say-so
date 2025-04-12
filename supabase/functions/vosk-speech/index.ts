
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple word tokenizer to help with word segmentation
function tokenizeText(text: string): { word: string, start: number, end: number, conf: number }[] {
  const words = text.trim().split(/\s+/);
  const results = [];
  let position = 0;
  
  for (const word of words) {
    if (word) {
      const start = position;
      const end = position + word.length;
      results.push({
        word,
        start,
        end,
        conf: 0.9 + Math.random() * 0.1 // Simulate confidence scores
      });
      position = end + 1; // +1 for the space
    }
  }
  
  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, audioData, language } = await req.json();
    
    if (!text && !audioData) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: either text or audioData is required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Here we're simulating what a real speech recognition system would do
    // In a production environment, this would connect to a real speech recognition API
    const inputText = text || "simulated transcription";
    const lang = language || "en-US";
    
    console.log(`Processing speech request for language: ${lang}, text: ${inputText}`);
    
    // Process the text to extract words with timing information
    const words = tokenizeText(inputText);
    
    // Simulate processing delay like a real service would have
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = {
      success: true,
      text: inputText,
      language: lang,
      confidence: 0.95,
      words,
      duration: words.length * 0.3 // Rough estimate of audio duration
    };
    
    console.log("Speech recognition result:", JSON.stringify(result, null, 2));
    
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
