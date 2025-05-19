
import { useState, useEffect, useCallback } from 'react';
import { VoiceProduct } from '@/types/voice';
import { toast } from 'sonner';
import voiceCommandService from '@/services/VoiceCommandService';

interface UseVoiceCommandsOptions {
  onCommand?: (command: string, products: VoiceProduct[]) => void;
  autoProcess?: boolean;
}

export function useVoiceCommands(options?: UseVoiceCommandsOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<VoiceProduct[]>([]);
  
  useEffect(() => {
    voiceCommandService.setListeners({
      onStart: () => {
        setIsListening(true);
        setTranscript('');
        setProducts([]);
      },
      onResult: (text, detectedProducts) => {
        setTranscript(text);
        setProducts(detectedProducts);
        
        if (options?.onCommand) {
          options.onCommand(text, detectedProducts);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (error) => {
        console.error("Voice command error:", error);
        setIsListening(false);
      },
      onProcessing: (processing) => {
        setIsProcessing(processing);
      }
    });
    
    return () => {
      // Clean up
      voiceCommandService.setListeners({});
    };
  }, [options?.onCommand]);
  
  const startListening = useCallback(() => {
    if (!voiceCommandService.isSupported()) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    
    voiceCommandService.start();
  }, []);
  
  const stopListening = useCallback(() => {
    voiceCommandService.stop();
  }, []);
  
  const resetState = useCallback(() => {
    setTranscript('');
    setProducts([]);
  }, []);
  
  return {
    isListening,
    transcript,
    isProcessing,
    products,
    startListening,
    stopListening,
    resetState,
    isSupported: voiceCommandService.isSupported()
  };
}

export default useVoiceCommands;
