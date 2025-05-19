
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { parseProductVoiceCommand, ProductEntity } from '@/utils/nlp/productVoiceParser';
import { parseEnhancedVoiceCommand, EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';

interface VoiceCommandButtonProps {
  className?: string;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ className }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [recognizedProducts, setRecognizedProducts] = useState<EnhancedProduct[]>([]);
  const [commandType, setCommandType] = useState<'inventory' | 'bill' | null>(null);
  const [progress, setProgress] = useState(0);
  const { products, addProduct, startNewBill, addToBill } = useInventory();
  const navigate = useNavigate();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setShowDialog(true);
      setTranscript('');
      setProgress(0);
      setCommandType(null);
      setRecognizedProducts([]);
      
      // Start progress bar animation
      let progressValue = 0;
      progressTimerRef.current = window.setInterval(() => {
        progressValue += 1;
        if (progressValue > 100) {
          if (progressTimerRef.current) {
            window.clearInterval(progressTimerRef.current);
          }
          recognition.stop();
          return;
        }
        setProgress(progressValue);
      }, 100); // 10 seconds total
      
      toast.info('Listening... Say a command like "Add 5kg rice (shelf 3)"');
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
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      if (event.error === 'no-speech') {
        toast.warning("No speech detected");
      } else if (event.error === 'aborted') {
        // Do nothing for aborted
      } else {
        toast.error(`Error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      if (transcript) {
        processTranscript(transcript);
      }
    };
    
    recognition.start();
  };
  
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    
    setIsListening(false);
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Determine if it's an inventory command or billing command
      const lowerText = text.toLowerCase();
      
      // Check if it's a bill command
      if (lowerText.includes('bill:') || lowerText.startsWith('bill') || 
          lowerText.includes('create bill') || lowerText.includes('new bill')) {
        processAsBillCommand(text);
      } else {
        // Default to inventory command
        processAsInventoryCommand(text);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Failed to process command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processAsInventoryCommand = (text: string) => {
    // Get product names from inventory for matching
    const productNames = products.map(p => ({ name: p.name }));
    
    // Parse the voice command using the enhanced parser
    const result = parseEnhancedVoiceCommand(text, productNames);
    
    if (result.products.length > 0) {
      setCommandType('inventory');
      setRecognizedProducts(result.products);
      toast.success(`Recognized ${result.products.length} products`);
    } else {
      toast.warning('No products recognized. Please try again.');
    }
  };
  
  const processAsBillCommand = (text: string) => {
    // Extract bill information using regex
    const billItemsRegex = /(\d+)x\s*([^@]+)@\$(\d+(?:\.\d+)?)\s*(?:\(([^)]+)\))?/gi;
    const matches = [...text.matchAll(billItemsRegex)];
    
    if (matches.length > 0) {
      setCommandType('bill');
      
      const items = matches.map(match => {
        return {
          name: match[2].trim(),
          quantity: parseInt(match[1], 10),
          price: parseFloat(match[3]),
          // Additional discount information if available
          discount: match[4] ? match[4] : undefined,
        };
      });
      
      setRecognizedProducts(items as EnhancedProduct[]);
      toast.success(`Recognized ${items.length} bill items`);
    } else {
      // Fallback to try to extract product names
      processAsInventoryCommand(text);
    }
  };
  
  const handleAddToInventory = () => {
    if (recognizedProducts.length === 0) return;
    
    recognizedProducts.forEach(product => {
      addProduct({
        name: product.name,
        quantity: product.quantity || 1,
        unit: product.unit || 'pcs',
        position: product.position || '',
        price: product.price || 0,
        expiry: product.expiry ? new Date(product.expiry).toISOString() : undefined,
      });
    });
    
    toast.success(`Added ${recognizedProducts.length} products to inventory`);
    setShowDialog(false);
    navigate('/products');
  };
  
  const handleCreateBill = () => {
    if (recognizedProducts.length === 0) return;
    
    startNewBill();
    
    // Find products in inventory by name and add to bill
    recognizedProducts.forEach(item => {
      const inventoryProduct = products.find(
        p => p.name.toLowerCase() === item.name.toLowerCase()
      );
      
      if (inventoryProduct) {
        addToBill(inventoryProduct.id, item.quantity || 1);
      } else {
        toast.warning(`Product "${item.name}" not found in inventory`);
      }
    });
    
    toast.success('Bill created successfully');
    setShowDialog(false);
    navigate('/billing');
  };

  return (
    <>
      <Button
        onClick={startRecognition}
        variant="outline"
        size="icon"
        className={`rounded-full shadow-md hover:shadow-lg transition-all ${className}`}
        aria-label="Voice command"
      >
        <Mic className="h-5 w-5" />
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isListening ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Mic className="h-5 w-5 text-primary" />
                  </motion.div>
                  Listening...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Voice Command'
              )}
            </DialogTitle>
            <DialogDescription>
              Try saying: "Add 5kg rice (shelf 3)" or "Bill: 2x milk @$3"
            </DialogDescription>
          </DialogHeader>
          
          {isListening && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="italic text-sm text-center">
                {transcript || "Listening..."}
              </p>
            </div>
          )}
          
          {!isListening && recognizedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md max-h-48 overflow-y-auto">
                <h4 className="font-medium mb-2">
                  {commandType === 'bill' ? 'Bill Items' : 'Products'}:
                </h4>
                <ul className="space-y-2">
                  {recognizedProducts.map((product, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span>
                        {product.name}
                        {product.position && <span className="text-xs ml-1 text-muted-foreground">({product.position})</span>}
                      </span>
                      <span className="font-medium">
                        {product.quantity} {product.unit || 'pcs'}
                        {product.price && ` @ $${product.price}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                {commandType === 'bill' ? (
                  <Button onClick={handleCreateBill}>
                    Create Bill
                  </Button>
                ) : (
                  <Button onClick={handleAddToInventory}>
                    Add to Inventory
                  </Button>
                )}
                
                <Button variant="ghost" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!isListening && transcript && recognizedProducts.length === 0 && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                <p>Unable to recognize command. Please try again with a format like:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>"Add 5kg rice (shelf 3)"</li>
                  <li>"Bill: 2x milk @$3, 1x sugar @$2"</li>
                </ul>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {isListening && (
            <div className="flex justify-center">
              <Button 
                variant="destructive" 
                onClick={stopRecognition}
                className="rounded-full"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop Listening
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCommandButton;
