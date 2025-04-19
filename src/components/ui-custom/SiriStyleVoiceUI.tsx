
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { extractProductDetailsFromEntities } from '@/utils/voiceCommandUtils';
import { useVoiceRecognition } from '@/lib/voice';
import { Badge } from '@/components/ui/badge';

interface SiriStyleVoiceUIProps {
  onCommand?: (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => void;
  className?: string;
}

export default function SiriStyleVoiceUI({ onCommand, className = '' }: SiriStyleVoiceUIProps) {
  const { text, isListening, listen, commandResult } = useVoiceRecognition();
  const [processing, setProcessing] = useState(false);
  const [processedText, setProcessedText] = useState('');
  const [extractedProduct, setExtractedProduct] = useState<{name: string, quantity?: number, unit?: string} | null>(null);
  const [waveformActive, setWaveformActive] = useState(false);

  const handleListen = async () => {
    try {
      setWaveformActive(true);
      toast.info("Listening...", { duration: 2000 });
      
      await listen();
      setProcessing(true);
      
      // Process the voice input to extract the product name
      setTimeout(() => {
        const rawText = text || "";
        
        // Extract product name from the full sentence
        let productName = "";
        
        // Try to extract using regex patterns for common voice commands
        const addProductMatch = rawText.match(/add\s+(?:a|an|some)?\s*([a-zA-Z0-9\s]+?)(?:\s+to|\s+in|\s+at|\s+with|\s+for|\s+price|\s*$)/i);
        if (addProductMatch && addProductMatch[1]) {
          productName = addProductMatch[1].trim();
        } else {
          // Fallback to basic entity extraction
          const entities = commandResult?.productName ? [{ label: 'PRODUCT', text: commandResult.productName }] : [];
          const extracted = extractProductDetailsFromEntities(entities);
          productName = extracted.name || rawText;
        }
        
        // Clean up common issues in product names
        productName = productName
          .replace(/^\s*(add|create|new|get|find)\s+/i, '')
          .replace(/\s+(to|in|at|with|for)\s+.*$/i, '')
          .trim();
        
        // Capitalize first letter of each word
        productName = productName.replace(/\b\w/g, c => c.toUpperCase());
        
        // Extract quantity and unit if available
        let quantity: number | undefined = undefined;
        let unit: string | undefined = undefined;
        
        if (commandResult?.quantity) {
          quantity = commandResult.quantity.value;
          unit = commandResult.quantity.unit;
        } else {
          // Try to extract quantity and unit with regex
          const quantityMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pcs|pieces?|units?|boxes?|packs?)/i);
          if (quantityMatch) {
            quantity = parseFloat(quantityMatch[1]);
            unit = quantityMatch[2].toLowerCase();
          }
        }
        
        setExtractedProduct({ name: productName, quantity, unit });
        setProcessedText(productName);
        setProcessing(false);
        
        if (onCommand) {
          onCommand(rawText, { name: productName, quantity, unit });
        }
        
        toast.success("Voice command processed!");
      }, 1000);
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error("Voice recognition failed. Please try again.");
      setProcessing(false);
    } finally {
      setWaveformActive(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md">
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
                      className="absolute inset-0 rounded-full border-2 border-purple-500/30"
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
                  className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-purple-500/50 text-red-500 animate-pulse"
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
                    className="absolute -inset-4 rounded-full border-2 border-purple-500/30"
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
                    className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-purple-500/50"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
                  className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 border-0"
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
                    className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
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
          
          {processedText && !isListening && (
            <motion.div 
              className="mt-6 text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-lg font-medium">{processedText}</p>
                {extractedProduct?.quantity && (
                  <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500">
                    {extractedProduct.quantity} {extractedProduct.unit || 'units'}
                  </Badge>
                )}
              </motion.div>
              
              <p className="text-xs text-muted-foreground">
                {text && (
                  <>
                    <span className="font-medium">Original: </span>
                    {text}
                  </>
                )}
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
