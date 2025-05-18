
// Central definition for VoiceProduct to ensure consistency across the app
export interface VoiceProduct {
  name: string;
  quantity: number;
  unit: string;
  position?: string;
  price?: number;
  image_url?: string;
  expiry?: string;
}

// Command types for voice processing
export const VOICE_COMMAND_TYPES = {
  CREATE_BILL: 'create_bill',
  ADD_PRODUCT: 'add_product',
  REMOVE_PRODUCT: 'remove_product',
  SEARCH_PRODUCT: 'search_product',
  UNKNOWN: 'unknown'
};

// Add a dedicated interface for the voice command result
export interface VoiceCommandResult {
  type: string;
  data?: {
    products?: VoiceProduct[];
    searchTerm?: string;
    [key: string]: any;
  };
  rawText: string;
}

// Add the missing CommandResult interface
export interface CommandResult {
  type: string;
  productName: string;
  quantity?: {
    value: number;
    unit: string;
  };
  position?: string;
  price?: number;
  imageUrl?: string;
  rawText: string;
}
