
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceStore } from '@/store/voiceStore';
import { parseMultipleProducts, detectCommandType } from '@/utils/voiceCommandUtils';
import { VoiceProduct, VOICE_COMMAND_TYPES } from '@/types/voice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface VoiceCommandButtonProps {
  onVoiceCommand?: (command: string) => void;
  showDialog?: boolean;
  label?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  showDialog = false,
  label = 'Voice',
  variant = 'default',
  size = 'default'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<VoiceProduct[]>([]);
  
  const handleVoiceCommand = async () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    
    try {
      setIsListening(true);
      setTranscript('');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        toast.info("Listening... Speak your command");
      };
      
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processCommand(text);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Failed to recognize speech");
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } catch (error) {
      console.error("Voice command error:", error);
      toast.error("Failed to start voice recognition");
      setIsListening(false);
    }
  };
  
  const processCommand = (command: string) => {
    setIsProcessing(true);
    
    try {
      console.log("Processing command:", command);
      
      // Use our enhanced command detection
      const commandResult = detectCommandType(command);
      console.log("Command result:", commandResult);
      
      if (commandResult.type === VOICE_COMMAND_TYPES.ADD_PRODUCT && 
          commandResult.data?.products && 
          commandResult.data.products.length > 0) {
        
        setDetectedProducts(commandResult.data.products);
        
        if (showDialog) {
          setShowResults(true);
        }
      }
      
      if (onVoiceCommand) {
        onVoiceCommand(command);
      }
      
      toast.success("Command processed!");
    } catch (error) {
      console.error("Error processing command:", error);
      toast.error("Failed to process command");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConfirm = () => {
    setShowResults(false);
    toast.success(`Added ${detectedProducts.length} product(s)`);
  };
  
  return (
    <>
      <Button
        onClick={handleVoiceCommand}
        disabled={isListening || isProcessing}
        variant={isListening ? "destructive" : variant}
        size={size}
        className="flex items-center gap-2"
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {label}
      </Button>
      
      {showDialog && (
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Voice Command Results</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <h4 className="font-medium">You said:</h4>
                <p className="text-sm bg-muted p-2 rounded mt-1">{transcript}</p>
              </div>
              
              {detectedProducts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Detected Products:</h4>
                  <ul className="space-y-2">
                    {detectedProducts.map((product, idx) => (
                      <li key={idx} className="flex justify-between p-2 bg-secondary/20 rounded">
                        <span>{product.name}</span>
                        <span>
                          {product.quantity} {product.unit}
                          {product.position ? ` (${product.position})` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={handleConfirm}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VoiceCommandButton;
