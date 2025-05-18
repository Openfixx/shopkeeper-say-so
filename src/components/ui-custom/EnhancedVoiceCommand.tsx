
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';
import { VoiceProduct } from '@/types/voice';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';

interface EnhancedVoiceCommandProps {
  onCommand?: (command: string, products: VoiceProduct[]) => void;
  onClose?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'floating' | 'minimal';
  autoClose?: boolean;
}

export const EnhancedVoiceCommand: React.FC<EnhancedVoiceCommandProps> = ({ 
  onCommand,
  onClose,
  className,
  variant = 'default',
  autoClose = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<VoiceProduct[]>([]);
  
  const { addProduct } = useInventory();
  const navigate = useNavigate();
  
  // Recognition reference to prevent recreation on each render
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (isListening) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    
    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        toast.info("Listening. Try saying 'Add 2kg rice and 3 sugar'");
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript(transcript);
          } else {
            interimTranscript += transcript;
            setTranscript(interimTranscript);
          }
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error("Failed to recognize speech");
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          processCommand(transcript);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error("Voice recognition failed. Please try again.");
      setIsListening(false);
    }
  }, [isListening, transcript]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.onend = null; // Prevent automatic processing
      recognitionRef.current.abort();
      setIsListening(false);
      
      if (transcript) {
        processCommand(transcript);
      }
    }
  }, [isListening, transcript]);
  
  const processCommand = useCallback((command: string) => {
    if (!command.trim()) {
      toast.warning("No voice input detected. Please try again.");
      return;
    }
    
    setIsProcessing(true);
    console.log("Processing command:", command);
    
    try {
      // Process the command to extract products
      const parsedProducts = parseMultipleProducts(command);
      console.log("Parsed products:", parsedProducts);
      
      if (parsedProducts.length > 0) {
        setProducts(parsedProducts);
        
        // Pass the command to parent if handler provided
        if (onCommand) {
          onCommand(command, parsedProducts);
        }
        
        toast.success(`Detected ${parsedProducts.length} product(s)`);
      } else {
        toast.warning("Could not detect any products. Try speaking more clearly.");
      }
    } catch (error) {
      console.error("Error processing command:", error);
      toast.error("Failed to process voice command. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [onCommand]);
  
  const handleAddProducts = useCallback(() => {
    if (!products.length) return;
    
    products.forEach(product => {
      addProduct({
        name: product.name,
        quantity: product.quantity || 1,
        unit: product.unit || 'piece',
        position: product.position || 'General Storage',
        price: product.price || 0,
        image_url: ''
      });
      
      toast.success(`Added ${product.quantity} ${product.unit} of ${product.name}`);
    });
    
    // Auto close dialog if enabled
    if (autoClose) {
      setIsOpen(false);
      if (onClose) onClose();
    }
    
    // Reset state
    setProducts([]);
    setTranscript('');
    
    // Navigate to products page
    navigate('/products');
  }, [products, addProduct, autoClose, onClose, navigate]);
  
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setTranscript('');
    setProducts([]);
    if (onClose) onClose();
  }, [onClose]);
  
  // Render different variants
  if (variant === 'minimal') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className={cn("p-2", className)}
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }
  
  if (variant === 'inline') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={cn("flex items-center gap-2", className)}
      >
        <Mic className="h-4 w-4" />
        Voice Command
      </Button>
    );
  }
  
  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="icon"
          className={cn("fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg", className)}
        >
          <Mic className="h-5 w-5" />
        </Button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <Card className="w-full max-w-md mx-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    Voice Command
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant={isListening ? "destructive" : "default"}
                      size="lg"
                      className="w-full"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Listening
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Listening
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {transcript && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> You said:
                      </p>
                      <p className={cn("text-sm", isListening && "animate-pulse")}>
                        {transcript}
                      </p>
                    </div>
                  )}
                  
                  {products.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Detected Products:</p>
                      {products.map((product, index) => (
                        <div 
                          key={index}
                          className="p-2 border rounded flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.position && (
                              <p className="text-xs text-muted-foreground">
                                Location: {product.position}
                              </p>
                            )}
                          </div>
                          <Badge>
                            {product.quantity} {product.unit}
                          </Badge>
                        </div>
                      ))}
                      
                      <div className="pt-4 flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddProducts}>
                          Add Products
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
  
  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Voice Command</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant={isListening ? "destructive" : "default"}
            className="w-full"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Listening
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>
        </div>
        
        {transcript && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">You said:</p>
            <p className={cn("text-sm", isListening && "animate-pulse")}>
              {transcript}
            </p>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Detected Products:</p>
            {products.map((product, index) => (
              <div 
                key={index}
                className="p-2 border rounded flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  {product.position && (
                    <p className="text-xs text-muted-foreground">
                      Location: {product.position}
                    </p>
                  )}
                </div>
                <Badge>
                  {product.quantity} {product.unit}
                </Badge>
              </div>
            ))}
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setProducts([]);
                  setTranscript('');
                }}
              >
                Clear
              </Button>
              <Button onClick={handleAddProducts}>
                Add Products
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVoiceCommand;
