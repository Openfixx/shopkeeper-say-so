
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import { useInventory } from '@/context/InventoryContext';

export interface VoiceCommandButtonProps {
  onVoiceCommand: (command: string, processedProduct?: { name: string, quantity?: number, unit?: string }) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showDialog?: boolean;
  label?: string;
  pulseColor?: string;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  className,
  variant = "default",
  size = "default",
  showDialog = false,
  label = "Voice",
  pulseColor = "bg-blue-500"
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const { products } = useInventory();
  
  const processCommand = (transcript: string) => {
    // Check if it's a multi-product command by looking for commas or "and"
    if (transcript.includes(',') || /\band\b/i.test(transcript)) {
      // Use our multi-product parser
      const productNames = products.map(p => ({ name: p.name }));
      const parsedProducts = parseMultiProductCommand(transcript, productNames);
      
      if (parsedProducts.length > 0) {
        // Extract first product for basic processing
        const firstProduct = parsedProducts[0];
        
        // Pass all products in the command for further processing
        onVoiceCommand(transcript, { 
          name: firstProduct.name, 
          quantity: firstProduct.quantity, 
          unit: firstProduct.unit 
        });
        return;
      }
    }
    
    // Extract potential product name from command
    const productMatch = transcript.match(/\b(add|create)\s+(?:\d+\s+)?([a-zA-Z\s]+)(?:\s+(?:to|on|in|for|at|price|₹|\d)|\s*$)/i);
    const productName = productMatch ? productMatch[2].trim() : '';
    
    // Extract potential quantity
    const quantityMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|units?|pack|packs|box|boxes)/i);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : undefined;
    const unit = quantityMatch ? quantityMatch[2].toLowerCase() : undefined;
    
    // Process the voice command with extracted product information
    onVoiceCommand(transcript, { 
      name: productName, 
      quantity: quantity, 
      unit: unit 
    });
  };
  
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }
    
    setIsListening(true);
    if (showDialog) {
      setIsDialogOpen(true);
    }
    
    // Speech recognition setup
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCurrentTranscript(transcript);
      console.log("Voice transcript:", transcript);
      
      // Process the command with improved product detection
      processCommand(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Failed to recognize speech");
    };
    
    recognition.start();
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(
          "relative",
          className
        )}
        onClick={startListening}
        disabled={isListening}
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4 mr-2" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            {label}
            
            {/* Pulse animation */}
            <span className={cn(
              "absolute -top-1 -right-1 flex h-3 w-3",
              isListening && "animate-ping"
            )}>
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                pulseColor
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                pulseColor
              )}></span>
            </span>
          </>
        )}
      </Button>
      
      {showDialog && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Voice Command</DialogTitle>
              <DialogDescription>
                {isListening ? "Listening..." : "Processing your voice command..."}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg">
              {isListening ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">Transcript:</p>
                  <p className="text-sm">{currentTranscript}</p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VoiceCommandButton;
