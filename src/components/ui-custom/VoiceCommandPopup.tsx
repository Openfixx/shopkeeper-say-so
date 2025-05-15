
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CommandResult } from '@/lib/voice';
import { toast } from '@/hooks/use-toast';
import VoiceCommandConfirmation from './VoiceCommandConfirmation';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { VoiceProduct } from '@/utils/voiceCommandUtils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Box, MapPin, Tag } from 'lucide-react';

interface VoiceCommandPopupProps {
  result: CommandResult | null;
  onConfirm: (location?: string) => void;
  onCancel: () => void;
  loading?: boolean;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
  multiProductMode?: boolean;
  multiProducts?: VoiceProduct[];
}

const VoiceCommandPopup: React.FC<VoiceCommandPopupProps> = ({
  result,
  onConfirm,
  onCancel,
  loading = false,
  onCommand,
  productList = [],
  multiProductMode = false,
  multiProducts = []
}) => {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [command, setCommand] = useState('');
  const [showMultiProductDialog, setShowMultiProductDialog] = useState(false);
  
  useEffect(() => {
    if (result) {
      setOpen(true);
      
      if (multiProductMode && multiProducts && multiProducts.length > 1) {
        setShowMultiProductDialog(true);
      } else {
        setShowMultiProductDialog(false);
      }
    } else {
      setOpen(false);
      setShowMultiProductDialog(false);
    }
  }, [result, multiProductMode, multiProducts]);
  
  const handleConfirm = (location: string) => {
    onConfirm(location);
    setOpen(false);
    setShowMultiProductDialog(false);
  };
  
  const handleCancel = () => {
    onCancel();
    setOpen(false);
    setShowMultiProductDialog(false);
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
        
        // Pass to parent component for processing
        if (onCommand) {
          const emptyEnhancedProducts: EnhancedProduct[] = [];
          onCommand(transcript, emptyEnhancedProducts);
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
  
  // Multi-Product Dialog
  if (showMultiProductDialog && multiProducts && multiProducts.length > 0) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent className="sm:max-w-md max-h-[90vh]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Multiple Products Detected</AlertDialogTitle>
            <AlertDialogDescription>
              We detected {multiProducts.length} products in your voice command.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <ScrollArea className="h-[50vh] mt-2 pr-3">
            <div className="space-y-3">
              {multiProducts.map((product, index) => (
                <div key={index} className="border rounded-md p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Box className="h-4 w-4 mr-2 text-indigo-500" />
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{product.quantity || 1} {product.unit || 'piece'}</Badge>
                    </div>
                  </div>
                  
                  {product.position && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      <span className="text-muted-foreground">{product.position}</span>
                    </div>
                  )}
                  
                  {product.price !== undefined && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Tag className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">₹{product.price}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => onConfirm()}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? "Adding Products..." : `Add ${multiProducts.length} Products`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  // Check if result has all required fields for standard view
  if (result && !showMultiProductDialog) {
    // Regular single product confirmation
    return (
      <VoiceCommandConfirmation
        open={open}
        result={result}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={loading}
      />
    );
  }
  
  // Show the voice command button if we have the onCommand prop and no result yet
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
  
  return null;
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
