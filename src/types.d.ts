// Database types (generated from Supabase)
declare global {
  interface Product {
    id: string;
    name: string;
    image_url: string;
    price: number;
    user_id: string;
    created_at: string;
  }

  interface InventoryItem {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    user_id: string;
    image_url?: string;
    created_at: string;
  }
}

// Extend Window for voice recognition
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
