
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
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: text is required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    console.log("Processing text with spaCy-like NLP:", text);
    
    // This is a mock implementation similar to what a real spaCy API would return
    // In a production environment, you would call an actual NLP service
    const mockEntities = mockProcessText(text);
    
    console.log("Identified entities:", mockEntities);
    
    return new Response(
      JSON.stringify({
        success: true,
        text: text,
        entities: mockEntities
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in spaCy NLP function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An error occurred while processing the text"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Mock function to process text and extract entities
function mockProcessText(text: string) {
  const entities = [];
  
  // Pattern matching for product quantities
  const quantityRegex = /(\d+)\s*(kg|g|liter|l|ml|pieces|pcs|box|boxes|packet|packets)/gi;
  let match;
  
  while ((match = quantityRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'QUANTITY',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Measurements, as of weight or distance'
    });
  }
  
  // Pattern matching for money
  const moneyRegex = /\$\d+(\.\d{1,2})?|\d+(\.\d{1,2})?\s*(dollars|rupees|rs\.)/gi;
  while ((match = moneyRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'MONEY',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Monetary values, including unit'
    });
  }
  
  // Pattern matching for dates
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|jan(\.|uary)?|feb(\.|ruary)?|mar(\.|ch)?|apr(\.|il)?|may|jun(\.|e)?|jul(\.|y)?|aug(\.|ust)?|sep(\.|tember)?|oct(\.|ober)?|nov(\.|ember)?|dec(\.|ember)?\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{2,4}/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: 'DATE',
      start: match.index,
      end: match.index + match[0].length,
      description: 'Absolute or relative dates or periods'
    });
  }
  
  // Pattern matching for product names (simplified)
  const productNames = ['sugar', 'rice', 'salt', 'flour', 'oil', 'milk', 'bread', 'butter', 'cheese', 'vegetables', 'fruits'];
  productNames.forEach(product => {
    const productRegex = new RegExp(`\\b${product}\\b`, 'gi');
    while ((match = productRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'PRODUCT',
        start: match.index,
        end: match.index + match[0].length,
        description: 'Objects, vehicles, foods, etc.'
      });
    }
  });
  
  // Sort entities by their position in the text
  return entities.sort((a, b) => a.start - b.start);
}
