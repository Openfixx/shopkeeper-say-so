
// Central definition for VoiceProduct to ensure consistency across the app
export interface VoiceProduct {
  name: string;
  quantity: number;
  unit: string; // Making unit required to match lib/supabase.ts
  position?: string;
  price?: number;
  image_url?: string; // Adding this to match usage in UnifiedVoiceCommand
  expiry?: string;
}

// Command types for voice processing
export const VOICE_COMMAND_TYPES = {
  CREATE_BILL: 'create_bill',
  ADD_PRODUCT: 'add_product',
  REMOVE_PRODUCT: 'remove_product',
  SEARCH_PRODUCT: 'search_product',
  GENERATE_BILL: 'generate_bill',
  UNKNOWN: 'unknown'
};

export interface CommandResult {
  type: string;
  productName?: string;
  quantity?: {
    value: number;
    unit: string;
  };
  position?: string;
  price?: number;
  imageUrl?: string;
  rawText: string;
}
