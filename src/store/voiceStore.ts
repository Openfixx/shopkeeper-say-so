
import { create } from 'zustand';
import { toast } from 'sonner';
import { VoiceProduct } from '@/types/voice';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  products: VoiceProduct[];
  error: string | null;
  isProcessing: boolean;
  
  setIsListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  addProducts: (products: VoiceProduct[]) => void;
  clearProducts: () => void;
  setError: (error: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  transcript: '',
  products: [],
  error: null,
  isProcessing: false,
  
  setIsListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set({ transcript }),
  addProducts: (products) => {
    set((state) => ({ 
      products: [...state.products, ...products] 
    }));
    toast.success(`Added ${products.length} product(s) to your inventory`);
  },
  clearProducts: () => set({ products: [] }),
  setError: (error) => set({ error }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
}));
