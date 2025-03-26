
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
    const { text, locale } = await req.json();
    
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
    
    const localeToUse = locale || 'en_US';
    console.log(`Processing text with Duckling-like parser: "${text}" (locale: ${localeToUse})`);
    
    // This is a mock implementation similar to what a real Duckling parser would return
    const entities = extractEntities(text, localeToUse);
    
    console.log("Extracted entities:", entities);
    
    return new Response(
      JSON.stringify({
        success: true,
        text: text,
        locale: localeToUse,
        entities: entities
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in Duckling parser function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An error occurred while parsing the text"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Mock function to extract entities similar to Duckling
function extractEntities(text: string, locale: string) {
  const entities = [];
  
  // Number extraction
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  let match;
  while ((match = numberRegex.exec(text)) !== null) {
    const value = parseFloat(match[0]);
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "number",
      value: {
        type: "value",
        value
      }
    });
  }
  
  // Quantity extraction
  const quantityRegex = /(\d+(\.\d+)?)\s*(kg|g|liter|l|ml|pieces|pcs|box|boxes|packet|packets)/gi;
  while ((match = quantityRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[3].toLowerCase();
    
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "quantity",
      value: {
        type: "value",
        value,
        unit
      }
    });
  }
  
  // Time extraction (simplified)
  const timeRegex = /\b(\d{1,2}):(\d{2})\b/g;
  while ((match = timeRegex.exec(text)) !== null) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "time",
      value: {
        type: "value",
        hour,
        minute
      }
    });
  }
  
  // Date extraction (simplified)
  const dateRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/g;
  while ((match = dateRegex.exec(text)) !== null) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    const fullYear = match[3].length === 2 ? 2000 + year : year;
    
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "date",
      value: {
        type: "value",
        day,
        month,
        year: fullYear
      }
    });
  }
  
  // Money extraction
  const moneyRegex = /\$(\d+(\.\d{1,2})?)|\b(\d+(\.\d{1,2})?)\s*(dollars|rupees|rs\.)\b/gi;
  while ((match = moneyRegex.exec(text)) !== null) {
    const amount = parseFloat(match[1] || match[3]);
    const currency = match[0].includes('$') ? 'USD' : 
                    match[0].toLowerCase().includes('rupees') || match[0].toLowerCase().includes('rs') ? 'INR' : 'USD';
    
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "amount-of-money",
      value: {
        type: "value",
        value: amount,
        unit: currency
      }
    });
  }
  
  return entities;
}
