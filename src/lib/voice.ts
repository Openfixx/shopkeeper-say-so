
import { useState } from 'react';

// Simple utility to get product images from Pixabay
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) return '';
  
  const PIXABAY_API_KEY = '36941293-fbca42b94c62a046e799269fa'; // Free API key with limited usage
  
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(productName)}&image_type=photo&per_page=3`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If we found any images, return the first one
    if (data.hits && data.hits.length > 0) {
      return data.hits[0].webformatURL;
    }
  } catch (error) {
    console.error('Error fetching image from Pixabay:', error);
  }

  // Fallback to placeholder
  return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
};

export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);

  // Basic speech recognition function
  const recognize = async (lang: string): Promise<string> => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    return new Promise((resolve, reject) => {
      recognition.onresult = (e) => {
        if (e.results && e.results[0] && e.results[0][0]) {
          resolve(e.results[0][0].transcript);
        } else {
          reject('No speech detected');
        }
      };
      
      recognition.onerror = (e) => {
        reject(`Speech recognition error: ${e.error}`);
      };
      
      recognition.start();
    });
  };

  // Main function to listen and process voice commands
  const listen = async (lang = 'en-US') => {
    setIsListening(true);
    try {
      const transcript = await recognize(lang);
      setText(transcript);
      console.log('Voice transcript:', transcript);

      // Extract product name from the speech
      // Remove common commands and focus on the product name
      const productName = transcript
        .replace(/\b(add|create|new|inventory|product|item)\b/gi, '')
        .replace(/\b\d+\s*(kg|g|ml|l|pieces?|pcs)\b/gi, '') // Remove quantities
        .replace(/\b(rack|shelf|position)\s*\d+\b/gi, '') // Remove locations
        .trim();

      console.log('Extracted product name:', productName);

      // Fetch image for the product
      const imageUrl = await fetchProductImage(productName);
      
      // Set the result with all extracted information
      setCommandResult({
        productName,
        imageUrl,
        rawText: transcript
      });

    } catch (error) {
      console.error('Speech recognition error:', error);
      throw error;
    } finally {
      setIsListening(false);
    }
  };

  return { text, isListening, listen, commandResult };
};
