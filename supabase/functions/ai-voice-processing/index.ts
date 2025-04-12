
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of product terms and their labels
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
  
  // Extract quantities with regex patterns
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
  
  // Extract rack/location information
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
  
  // Extract price information
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

  // Extract date/expiry information
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

  // Extract command types
  const commandRegex = /(add|create|find|search|update|remove|delete|bill|आइटम जोड़ें|जोड़ना|खोजें|खोज|अपडेट|अद्यतन|हटाएं|बिल)/gi;
  while ((match = commandRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      label: "COMMAND",
      start: match.index,
      end: match.index + match[0].length,
      description: "Action command"
    });
  }
  
  // Sort entities by their position in the text
  return entities.sort((a, b) => a.start - b.start);
}

// Fetch product image from DuckDuckGo
async function fetchProductImage(product: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(`${product} product`);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to get image from Image entity
    if (data.Image && data.Image.length > 0) {
      return `https://duckduckgo.com${data.Image}`;
    }
    
    // Try to get from related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      for (const topic of data.RelatedTopics) {
        if (topic.Icon && topic.Icon.URL && topic.Icon.URL.length > 0) {
          return `https://duckduckgo.com${topic.Icon.URL}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching product image:", error);
    return null;
  }
}

// Process extracted entities into structured format
function processEntities(entities: any[], text: string) {
  const result: {
    product?: string,
    quantity?: { value: number, unit: string },
    position?: string,
    price?: number,
    expiryDate?: string,
    command?: string,
  } = {};
  
  // Find product
  const productEntity = entities.find(e => e.label === "PRODUCT");
  if (productEntity) {
    result.product = productEntity.text;
  }
  
  // Find quantity
  const quantityEntity = entities.find(e => e.label === "QUANTITY");
  if (quantityEntity) {
    const quantityMatch = quantityEntity.text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+|किलो|किग्रा|गम|गाम|लीटर|लि|मि\.ली|पैकेट)/);
    if (quantityMatch) {
      result.quantity = {
        value: parseFloat(quantityMatch[1]),
        unit: quantityMatch[2]
      };
    }
  }
  
  // Find position
  const positionEntity = entities.find(e => e.label === "POSITION");
  if (positionEntity) {
    result.position = positionEntity.text;
  }
  
  // Find price
  const priceEntity = entities.find(e => e.label === "MONEY");
  if (priceEntity) {
    const priceMatch = priceEntity.text.match(/(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      result.price = parseFloat(priceMatch[1]);
    }
  }
  
  // Find expiry date
  const dateEntity = entities.find(e => e.label === "DATE");
  if (dateEntity) {
    result.expiryDate = dateEntity.text.replace(/\b(?:expiry|expires|expiration|exp|एक्सपायरी)(?:\s+(?:date|on))?\s+/i, '');
  }
  
  // Find command
  const commandEntity = entities.find(e => e.label === "COMMAND");
  if (commandEntity) {
    result.command = commandEntity.text.toLowerCase();
  }
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, language } = await req.json();
    
    if (type === 'audio') {
      // Process audio with Whisper (simulated)
      if (!data || typeof data !== 'string') {
        throw new Error('Audio data is required');
      }
      
      const transcribedText = "Simulated audio transcription result";
      
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
      const processedData = processEntities(entities, data);
      
      // If we found a product, try to fetch an image for it
      let imageUrl = null;
      if (processedData.product) {
        imageUrl = await fetchProductImage(processedData.product);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          text: data,
          entities,
          processed: processedData,
          imageUrl,
          message: "Using enhanced rule-based NER. For better results, train a custom spaCy model."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else if (type === 'fetch_image') {
      if (!data || typeof data !== 'string') {
        throw new Error('Product name is required');
      }
      
      const imageUrl = await fetchProductImage(data);
      
      return new Response(
        JSON.stringify({
          success: true,
          product: data,
          imageUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else {
      throw new Error('Invalid request type. Use "audio", "text", or "fetch_image".');
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
