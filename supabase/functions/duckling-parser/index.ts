
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract number values using regular expressions
function extractNumbers(text: string) {
  const entities = [];
  const numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
  let match;
  
  while ((match = numberRegex.exec(text)) !== null) {
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "number",
      value: {
        type: "value",
        value: parseFloat(match[0])
      }
    });
  }
  
  return entities;
}

// Extract quantity values with units
function extractQuantities(text: string) {
  const entities = [];
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|किलो|kilogram|g|gm|gram|liter|liters|l|ml|packet|packets|pcs|pieces|box|boxes)/gi;
  let match;
  
  while ((match = quantityRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
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
  
  return entities;
}

// Extract monetary values
function extractMoney(text: string) {
  const entities = [];
  const moneyRegex = /(?:₹|rs\.?|rupees?|price|cost|दाम|कीमत|मूल्य)\s*(\d+(?:\.\d+)?)/gi;
  let match;
  
  while ((match = moneyRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "amount-of-money",
      value: {
        type: "value",
        value,
        unit: "INR"
      }
    });
  }
  
  return entities;
}

// Extract dates
function extractDates(text: string) {
  const entities = [];
  const dateRegex = /((?:\d{1,2}[-\/\s](?:\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\/\s]\d{2,4})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{2,4})/gi;
  let match;
  
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({
      body: match[0],
      start: match.index,
      end: match.index + match[0].length,
      dim: "time",
      value: {
        type: "value",
        value: match[0]
      }
    });
  }
  
  return entities;
}

// Parse text with duckling-like functionality
function parseText(text: string, locale = "en_US") {
  // Extract various types of structured data
  const numbers = extractNumbers(text);
  const quantities = extractQuantities(text);
  const money = extractMoney(text);
  const dates = extractDates(text);
  
  // Combine all entities
  const entities = [...numbers, ...quantities, ...money, ...dates];
  
  // Sort by position
  entities.sort((a, b) => a.start - b.start);
  
  return {
    success: true,
    text,
    locale,
    entities
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, locale = "en_US" } = await req.json();
    
    if (!text) {
      throw new Error('Text is required for parsing');
    }
    
    console.log(`Processing text with locale ${locale}: ${text}`);
    
    const result = parseText(text, locale);
    console.log(`Found ${result.entities.length} entities`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing text:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred during parsing'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
