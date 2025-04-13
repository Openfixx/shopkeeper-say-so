
import React, { useState } from 'react';

// Helper functions for voice parsing
const parseRackNumber = (text: string): number | null => {
  const numberMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  
  // Look for patterns like "rack 3", "rack number 4", "on rack five"
  const rackPatterns = [
    /rack\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
    /on\s+rack\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
    /to\s+rack\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
    /in\s+rack\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
  ];
  
  for (const pattern of rackPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Convert word to number if needed
      if (isNaN(parseInt(match[1]))) {
        return numberMap[match[1].toLowerCase()] || null;
      }
      return parseInt(match[1]);
    }
  }
  
  return null;
};

const fetchProductImage = async (productName: string): Promise<string> => {
  try {
    console.log("Fetching image for:", productName);
    const response = await fetch(`/api/fetch-image?q=${encodeURIComponent(productName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Image fetch response:", data);
    
    if (data?.imageUrl) {
      return data.imageUrl;
    }
    
    // Fallback to placeholder
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  } catch (error) {
    console.error("Error fetching product image:", error);
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    productName?: string;
    rackNumber?: number | null;
    imageUrl?: string;
  } | null>(null);

  const recognize = async (lang: string, attempts = 3): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;

    try {
      return await new Promise((resolve, reject) => {
        recognition.onresult = (e) => resolve(e.results[0][0].transcript);
        recognition.onerror = () => 
          attempts > 1 
            ? resolve(recognize(lang, attempts - 1)) 
            : reject('Recognition failed');
        recognition.start();
        setTimeout(() => reject('Timeout'), 5000);
      });
    } catch (error) {
      throw new Error(`Voice recognition failed: ${error}`);
    }
  };

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);

      console.log("Raw transcript:", transcript);
      
      // Parse the voice command
      // Extract rack number directly
      const rackNumber = parseRackNumber(transcript);
      console.log("Extracted rack number:", rackNumber);
      
      // Extract product name by removing rack references
      const productName = transcript
        .replace(/(?:on|in|at|to)\s+rack\s+(?:number\s+)?\w+/i, '')
        .replace(/rack\s+(?:number\s+)?\w+/i, '')
        .replace(/(add|create|\s+to|\s+in|\s+on)/ig, '')
        .trim();
      
      console.log("Extracted product name:", productName);
      
      // Fetch image
      const imageUrl = await fetchProductImage(productName);
      console.log("Fetched image URL:", imageUrl);

      setCommandResult({ productName, rackNumber, imageUrl });
    } catch (error) {
      console.error("Voice recognition error:", error);
    } finally {
      setIsListening(false);
    }
  };

  return { text, isListening, listen, commandResult };
};
