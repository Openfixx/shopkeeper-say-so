
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CommandResult } from '@/lib/voice';
import { toast } from '@/hooks/use-toast';
import VoiceCommandConfirmation from './VoiceCommandConfirmation';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';

interface VoiceCommandPopupProps {
  result: CommandResult | null;
  onConfirm: (location?: string) => void;
  onCancel: () => void;
  loading?: boolean;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
}

const VoiceCommandPopup: React.FC<VoiceCommandPopupProps> = ({
  result,
  onConfirm,
  onCancel,
  loading = false,
  onCommand,
  productList = []
}) => {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [command, setCommand] = useState('');
  
  useEffect(() => {
    if (result) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [result]);
  
  const handleConfirm = (location: string) => {
    onConfirm(location);
    setOpen(false);
  };
  
  const handleCancel = () => {
    onCancel();
    setOpen(false);
  };

  const handleListen = async () => {
    if (!onCommand) return;
    
    try {
      setListening(true);
      toast({
        title: "Listening...",
        description: "Try saying 'Add 5kg rice, 2 kg sugar, and 3 liters milk'",
        duration: 3000,
      });
      
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Error",
          description: "Speech recognition is not supported in this browser",
          variant: "destructive",
        });
        setListening(false);
        return;
      }
      
      // Initialize speech recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        
        // Process the command to extract products
        const isMultiProduct = transcript.includes(',') || /\s+and\s+/i.test(transcript);
        
        try {
          // Parse multi-product command
          const parsed = parseMultiProductCommand(transcript, productList);
          
          // Convert to EnhancedProduct format for consistency
          const enhancedProducts: EnhancedProduct[] = parsed.map(p => ({
            name: p.name,
            quantity: p.quantity,
            unit: p.unit,
            position: p.position,
            price: p.price,
            confidence: 1.0
          }));
          
          // Pass to parent component
          if (onCommand && enhancedProducts.length > 0) {
            onCommand(transcript, enhancedProducts);
            
            toast({
              title: "Success",
              description: `Processed ${enhancedProducts.length} product(s) from your command`,
              variant: "default",
            });
          } else {
            toast({
              title: "Warning",
              description: "Could not identify any products in your command",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error processing command:", error);
          toast({
            title: "Error", 
            description: "Failed to process command",
            variant: "destructive",
          });
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({
          title: "Error",
          description: "Failed to recognize speech",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setListening(false);
      };
      
      recognition.start();
      
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast({
        title: "Error",
        description: "Voice recognition failed. Please try again.",
        variant: "destructive",
      });
      setListening(false);
    }
  };
  
  // Check if result has all required fields
  const validateResult = (result: CommandResult | null): boolean => {
    if (!result) return false;
    
    const missingFields = [];
    
    if (!result.productName || result.productName.trim() === '') {
      missingFields.push('product name');
    }
    
    if (!result.quantity || !result.quantity.value) {
      missingFields.push('quantity');
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please provide: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  // Show the voice command button if we have the onCommand prop
  if (onCommand && !result) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-md rounded-lg shadow-lg">
          {listening ? (
            <div className="text-center">
              <div className="animate-pulse h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <MicIcon className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-muted-foreground">Listening...</p>
            </div>
          ) : (
            <>
              <Button 
                onClick={handleListen} 
                className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 mb-4"
                disabled={listening}
              >
                <MicIcon className="h-8 w-8" />
              </Button>
              <p className="text-center">Say a command like:</p>
              <p className="text-sm font-medium mt-1 text-center">"Add 5 kg rice, 2 kg sugar, and 3 liters milk"</p>
            </>
          )}
        </div>
        
        {command && (
          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <p className="text-sm font-medium">Last command:</p>
            <p className="text-sm">{command}</p>
          </div>
        )}
      </div>
    );
  }
  
  // If result is invalid, don't show the dialog
  if (result && !validateResult(result)) {
    onCancel();
    return null;
  }
  
  return (
    <VoiceCommandConfirmation
      open={open}
      result={result}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
    />
  );
};

// Helper component for the icon
const MicIcon = ({ className = "h-4 w-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
);

export default VoiceCommandPopup;
