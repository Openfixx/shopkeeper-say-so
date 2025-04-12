
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Product terms and their entity types
const PRODUCT_TERMS: Record<string, string> = {
  // English products
  "sugar": "PRODUCT",
  "rice": "PRODUCT",
  "oil": "PRODUCT",
  "milk": "PRODUCT",
  "flour": "PRODUCT",
  "salt": "PRODUCT",
  "coffee": "PRODUCT",
  "tea": "PRODUCT",
  "spices": "PRODUCT",
  "onion": "PRODUCT",
  "potato": "PRODUCT",
  "tomato": "PRODUCT",
  "garlic": "PRODUCT",
  "bread": "PRODUCT",
  
  // Hindi products
  "चीनी": "PRODUCT", // sugar in Hindi
  "दूध": "PRODUCT",  // milk in Hindi
  "चावल": "PRODUCT", // rice in Hindi
  "तेल": "PRODUCT",  // oil in Hindi
  "आटा": "PRODUCT",  // flour in Hindi
  "नमक": "PRODUCT",  // salt in Hindi
  "चाय": "PRODUCT",  // tea in Hindi
  "प्याज": "PRODUCT", // onion in Hindi
  "आलू": "PRODUCT",  // potato in Hindi
  "टमाटर": "PRODUCT", // tomato in Hindi
  "लहसुन": "PRODUCT", // garlic in Hindi
  "रोटी": "PRODUCT",  // bread in Hindi
};

// Named Entity Recognition function
function processEntities(text: string) {
  const entities = [];
  const lowerText = text.toLowerCase();
  
  // Extract products
  for (const [term, label] of Object.entries(PRODUCT_TERMS)) {
    let index = 0;
    const termLower = term.toLowerCase();
    
    while ((index = lowerText.indexOf(termLower, index)) !== -1) {
      entities.push({
        text: text.substring(index, index + term.length),
        label,
        start: index,
        end: index + term.length,
        description: "Product name"
      });
      index += term.length;
    }
  }
  
  // Extract quantities
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|किलो|किग्रा|कि\.ग्रा|kilogram|kilograms|gram|gm|g|गम|गाम|लीटर|लि|ml|मि\.ली|liter|liters|l|पैकेट|packet|packets|pcs|pieces|box|boxes)/gi;
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
  
  // Extract locations
  const locationRegex = /(rack|रैक|शेल्फ|shelf)\s*(\d+|[a-zA-Z]+)|(\d+|[a-zA-Z]+)\s*(rack|रैक|शेल्फ|shelf)|में रख|में रखें|(on|at|in)\s+storage|बॉक्स\s*(\d+)|ड्रॉवर\s*(\d+)/gi;
  
  while ((match = locationRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "POSITION",
      start: match.index,
      end: match.index + match[0].length,
      description: "Storage position"
    });
  }
  
  // Extract prices
  const priceRegex = /₹(\d+(?:\.\d+)?)|rs\.?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*rupees|(\d+(?:\.\d+)?)\s*rs\.?|price\s*(\d+(?:\.\d+)?)|cost\s*(\d+(?:\.\d+)?)|दाम\s*₹?\s*(\d+(?:\.\d+)?)|कीमत\s*₹?\s*(\d+(?:\.\d+)?)|मूल्य\s*₹?\s*(\d+(?:\.\d+)?)/gi;
  
  while ((match = priceRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "MONEY",
      start: match.index,
      end: match.index + match[0].length,
      description: "Price information"
    });
  }
  
  // Extract dates
  const dateRegex = /(expiry|expires|expiration|exp|एक्सपायरी)\s*(date|on)?\s*((?:\d{1,2}[-\/\s](?:\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\/\s]\d{2,4})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{2,4})/gi;
  
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "DATE",
      start: match.index,
      end: match.index + match[0].length,
      description: "Expiry date"
    });
  }
  
  // Sort entities by position
  return entities.sort((a, b) => a.start - b.start);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, lang = "en" } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Text is required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Processing text with spaCy NLP simulation (lang: ${lang}): ${text}`);
    
    // Simulate spaCy processing
    const entities = processEntities(text);
    
    console.log(`Found ${entities.length} entities`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        text,
        entities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spaCy NLP processing:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An error occurred during NLP processing"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
