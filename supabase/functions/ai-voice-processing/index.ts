
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of product terms and their labels
const PRODUCT_TERMS = {
  "sugar": "PRODUCT",
  "rice": "PRODUCT",
  "oil": "PRODUCT",
  "milk": "PRODUCT",
  "flour": "PRODUCT",
  "salt": "PRODUCT",
  "coffee": "PRODUCT",
  "tea": "PRODUCT",
  "spices": "PRODUCT",
  "चीनी": "PRODUCT", // sugar in Hindi
  "दूध": "PRODUCT",  // milk in Hindi
  "चावल": "PRODUCT", // rice in Hindi
  "तेल": "PRODUCT",  // oil in Hindi
};

// Process text with custom NER (Named Entity Recognition)
function customNER(text: string) {
  const entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    description?: string;
  }> = [];
  
  const lowerText = text.toLowerCase();
  
  // Extract products
  Object.keys(PRODUCT_TERMS).forEach(term => {
    let index = 0;
    while ((index = lowerText.indexOf(term, index)) !== -1) {
      entities.push({
        text: text.substring(index, index + term.length),
        label: PRODUCT_TERMS[term],
        start: index,
        end: index + term.length,
        description: "Product name"
      });
      index += term.length;
    }
  });
  
  // Extract quantities with regex patterns similar to the Python examples
  const quantityRegex = /(\d+)\s*(kg|किलो|kilogram|kilograms|liter|लीटर|liters|l|g|grams|ml|milliliter|packet|packets|pcs|pieces)/gi;
  let match;
  while ((match = quantityRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "QUANTITY",
      start: match.index,
      end: match.index + match[0].length,
      description: "Product quantity"
    });
  }
  
  // Extract rack/location information
  const locationRegex = /rack\s*(\d+)|रैक\s*(\d+)|shelf\s*(\d+)|location\s*(\d+)|में/gi;
  while ((match = locationRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "POSITION",
      start: match.index,
      end: match.index + match[0].length,
      description: "Storage position"
    });
  }
  
  // Extract price information
  const priceRegex = /₹(\d+)|rs\.?\s*(\d+)|price\s*(\d+)|cost\s*(\d+)|दाम\s*₹?(\d+)|कीमत\s*₹?(\d+)/gi;
  while ((match = priceRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "MONEY",
      start: match.index,
      end: match.index + match[0].length,
      description: "Price information"
    });
  }
  
  // Sort entities by their position in the text
  return entities.sort((a, b) => a.start - b.start);
}

// Simulate audio processing with Whisper - in real implementation, 
// this would connect to Whisper API or a local Whisper model
function processAudio(base64Audio: string): string {
  // In a real implementation, this would call Whisper API
  // For now, returning a placeholder as we'd need a server-side implementation
  console.log("Processing audio (simulation)");
  return "Simulated audio transcription - this would use Whisper in a real backend";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    if (type === 'audio') {
      // Process audio with Whisper (simulated)
      if (!data || typeof data !== 'string') {
        throw new Error('Audio data is required');
      }
      
      const transcribedText = processAudio(data);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          text: transcribedText,
          message: "Note: This is a simulation. For actual Whisper integration, deploy Python with Whisper to a dedicated service." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    else if (type === 'text') {
      // Process text with NER
      if (!data || typeof data !== 'string') {
        throw new Error('Text data is required');
      }
      
      const entities = customNER(data);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          text: data,
          entities: entities,
          message: "Using enhanced rule-based NER. For better results, train a custom spaCy model."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else {
      throw new Error('Invalid request type. Use "audio" or "text".');
    }
  } catch (error) {
    console.error('Error in AI voice processing:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred during processing'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
