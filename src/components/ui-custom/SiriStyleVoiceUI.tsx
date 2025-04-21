
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/lib/voice';
import { Badge } from '@/components/ui/badge';
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import VoiceCommandPopup from './VoiceCommandPopup';

interface SiriStyleVoiceUIProps {
  onCommand?: (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => void;
  className?: string;
}

export default function SiriStyleVoiceUI({ onCommand, className = '' }: SiriStyleVoiceUIProps) {
  const { text, isListening, listen, commandResult, reset } = useVoiceRecognition();
  const [processing, setProcessing] = useState(false);
  const [processedText, setProcessedText] = useState('');
  const [extractedProduct, setExtractedProduct] = useState<{name: string, quantity?: number, unit?: string} | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<MultiProduct[]>([]);
  const [waveformActive, setWaveformActive] = useState(false);
  const [isMultiCommand, setIsMultiCommand] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);

  const handleListen = async () => {
    try {
      setWaveformActive(true);
      toast.info("Listening... Say commands like 'Add 5kg rice, 2kg sugar'", { duration: 3000 });
      
      const result = await listen();
      setProcessing(true);
      
      setTimeout(() => {
        const rawText = result.rawText;
        setProcessedText(rawText);
        
        // Check if it's a multi-product command
        const isMulti = rawText.includes(',') || /\band\b/i.test(rawText);
        setIsMultiCommand(isMulti);
        
        if (isMulti) {
          // Use the multi-product parser
          const parsedProducts = parseMultiProductCommand(rawText, []);
          setExtractedProducts(parsedProducts);
          
          // For UI display, use the first product
          if (parsedProducts.length > 0) {
            const firstProduct = parsedProducts[0];
            setExtractedProduct({
              name: firstProduct.name,
              quantity: firstProduct.quantity,
              unit: firstProduct.unit
            });
          }
        } else {
          // Process as single product command
          setExtractedProduct({
            name: result.productName,
            quantity: result.quantity?.value,
            unit: result.quantity?.unit
          });
        }
        
        setProcessing(false);
        setShowPopup(true);
        
        toast.success("Voice command processed!");
      }, 1000);
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error("Voice recognition failed. Please try again.");
      setProcessing(false);
      setWaveformActive(false);
    }
  };

  const handleConfirmProduct = () => {
    setIsAddingToInventory(true);
    
    try {
      if (onCommand) {
        if (isMultiCommand) {
          // Pass the first product for backward compatibility
          const firstProduct = extractedProducts[0] || { name: '', quantity: 1, unit: 'unit' };
          onCommand(processedText, firstProduct);
        } else {
          onCommand(processedText, extractedProduct || { name: '', quantity: undefined, unit: undefined });
        }
      }
      
      toast.success("Product added to inventory!");
    } catch (error) {
      toast.error("Failed to add product.");
      console.error("Error adding product:", error);
    } finally {
      setIsAddingToInventory(false);
      setShowPopup(false);
      reset();
    }
  };

  const handleCancelProduct = () => {
    setShowPopup(false);
    reset();
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative flex items-center justify-center"
              >
                <div className="absolute -inset-4">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-violet-500/30"
                      style={{ 
                        rotate: `${i * 15}deg`,
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.3, 0.7]
                      }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 2,
                        delay: i * 0.05
                      }}
                    />
                  ))}
                </div>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {}} 
                  className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-violet-500/50 text-red-500 animate-pulse"
                >
                  <MicOff className="h-8 w-8" />
                </Button>
              </motion.div>
            ) : processing ? (
              <motion.div
                key="processing"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    className="absolute -inset-4 rounded-full border-2 border-violet-500/30"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 0.3, 0.7]
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 1.5
                    }}
                  />
                  <Button 
                    size="lg" 
                    variant="outline"
                    disabled
                    className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-violet-500/50"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Button 
                  size="lg" 
                  onClick={handleListen}
                  className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 border-0"
                >
                  <Mic className="h-8 w-8" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {(isListening || waveformActive) && (
              <motion.div 
                className="mt-6 h-10 w-48 flex items-center justify-center space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="w-1 bg-gradient-to-t from-violet-600 to-indigo-600 rounded-full"
                    animate={{ 
                      height: [
                        Math.random() * 10 + 5,
                        Math.random() * 30 + 10,
                        Math.random() * 10 + 5
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 0.8,
                      delay: i * 0.05
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {processedText && !isListening && !showPopup && (
            <motion.div 
              className="mt-6 text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isMultiCommand ? (
                <div>
                  <motion.div 
                    className="p-3 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 backdrop-blur-sm rounded-xl"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-base sm:text-lg font-medium mb-2">Multiple Products</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {extractedProducts.map((product, index) => (
                        <Badge 
                          key={index}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-1"
                        >
                          {product.quantity} {product.unit} {product.name}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Adding {extractedProducts.length} products to inventory
                  </p>
                </div>
              ) : (
                <motion.div 
                  className="p-3 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 backdrop-blur-sm rounded-xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-lg font-medium">{extractedProduct?.name}</p>
                  {extractedProduct?.quantity && (
                    <Badge className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600">
                      {extractedProduct.quantity} {extractedProduct.unit || 'units'}
                    </Badge>
                  )}
                </motion.div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {processedText && (
                  <>
                    <span className="font-medium">Original: </span>
                    {processedText}
                  </>
                )}
              </p>
            </motion.div>
          )}
          
          {!isListening && !processing && !processedText && (
            <div className="mt-6 text-center text-muted-foreground text-sm">
              <p>Try saying:</p>
              <p className="italic mt-1">"Add 5kg rice, 2kg sugar, 3 packs of biscuits"</p>
            </div>
          )}
        </div>
      </Card>
      
      <AnimatePresence>
        {showPopup && (
          <VoiceCommandPopup 
            result={commandResult} 
            onConfirm={handleConfirmProduct}
            onCancel={handleCancelProduct}
            loading={isAddingToInventory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
