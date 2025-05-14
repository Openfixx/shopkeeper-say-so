
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { parseProductVoiceCommand, ProductEntity } from '@/utils/nlp/productVoiceParser';

interface VoiceProductRecognitionProps {
  onProductsRecognized?: (products: ProductEntity[]) => void;
  onAddToInventory?: (products: ProductEntity[]) => void;
  className?: string;
}

const VoiceProductRecognition: React.FC<VoiceProductRecognitionProps> = ({ 
  onProductsRecognized, 
  onAddToInventory,
  className 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [clarificationOptions, setClarificationOptions] = useState<string[]>([]);
  const [currentConfirmation, setCurrentConfirmation] = useState<number | null>(null);
  const { products: inventoryProducts } = useInventory();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast.info('Listening... Say something like "Add 2 kg rice and 3 sugar"');
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
          setTranscript(finalTranscript);
        } else {
          interimTranscript += transcript;
          setTranscript(interimTranscript);
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast.warning("No speech detected");
      } else {
        toast.error(`Error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      
      if (finalTranscript) {
        processTranscript(finalTranscript);
      }
    };
    
    recognition.start();
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Get product names from inventory for matching
      const productNames = inventoryProducts.map(p => ({ name: p.name }));
      
      // Parse the voice command
      const result = parseProductVoiceCommand(text, productNames);
      
      // Update state with parsed products
      setProducts(result.products);
      
      // Handle clarification if needed
      if (result.needsClarification) {
        setClarificationNeeded(true);
        setClarificationQuestion(result.clarificationQuestion || 'Did you mean one of these products?');
        setClarificationOptions(result.clarificationOptions || []);
      } else {
        setClarificationNeeded(false);
        
        // Call the callback if provided
        if (onProductsRecognized && result.products.length > 0) {
          onProductsRecognized(result.products);
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToInventory = () => {
    if (products.length === 0) return;
    
    if (onAddToInventory) {
      onAddToInventory(products);
    }
    
    toast.success(`Added ${products.length} products to inventory`);
    setProducts([]);
  };

  const handleClarificationSelect = (option: string) => {
    // Update the product with the selected option
    const updatedProducts = [...products];
    
    // Find the product with low confidence (first one if multiple)
    const lowConfidenceIndex = products.findIndex(p => p.confidence < 0.5);
    
    if (lowConfidenceIndex >= 0) {
      updatedProducts[lowConfidenceIndex] = {
        ...updatedProducts[lowConfidenceIndex],
        name: option,
        confidence: 1.0 // Now we're certain
      };
      
      setProducts(updatedProducts);
      setClarificationNeeded(false);
      
      // Call the callback if provided
      if (onProductsRecognized) {
        onProductsRecognized(updatedProducts);
      }
      
      toast.success(`Updated product to "${option}"`);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Product Recognition</span>
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={isListening ? () => setIsListening(false) : startListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Voice
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Transcript Display */}
        {(transcript || isListening) && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">You said:</p>
            <p className={`${isListening ? "animate-pulse" : ""}`}>
              {transcript || "Listening..."}
            </p>
          </div>
        )}
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Processing voice command...</span>
          </div>
        )}
        
        {/* Clarification UI */}
        {clarificationNeeded && !isProcessing && (
          <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/20">
            <p className="font-medium mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              {clarificationQuestion}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {clarificationOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleClarificationSelect(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Recognized Products */}
        {products.length > 0 && !isProcessing && !clarificationNeeded && (
          <div className="space-y-3">
            <p className="font-medium">Recognized Products:</p>
            
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={`${product.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center">
                    {product.confidence > 0.7 ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                    )}
                    <span className="font-medium">{product.name}</span>
                    
                    {/* Variants if any */}
                    {product.variant && (
                      <div className="ml-2 flex gap-1">
                        {product.variant.size && (
                          <Badge variant="outline" className="text-xs">
                            Size: {product.variant.size}
                          </Badge>
                        )}
                        {product.variant.color && (
                          <Badge variant="outline" className="text-xs">
                            Color: {product.variant.color}
                          </Badge>
                        )}
                        {product.variant.type && (
                          <Badge variant="outline" className="text-xs">
                            Type: {product.variant.type}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.quantity || 1}
                      onChange={(e) => {
                        const newProducts = [...products];
                        newProducts[index].quantity = parseInt(e.target.value) || 1;
                        setProducts(newProducts);
                      }}
                      className="w-16 text-right"
                      min="1"
                    />
                    <Badge variant="secondary">
                      {product.unit || 'pcs'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleAddToInventory}>
                Add to Inventory
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceProductRecognition;
