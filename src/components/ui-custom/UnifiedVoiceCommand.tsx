import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/lib/voice';
import { Badge } from '@/components/ui/badge';
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import VoiceCommandPopup from './VoiceCommandPopup';
import { CommandResult } from '@/lib/voice';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedVoiceCommandProps {
  className?: string;
  compact?: boolean;
}

export default function UnifiedVoiceCommand({ className = '', compact = false }: UnifiedVoiceCommandProps) {
  const { text, isListening, listen, commandResult, reset } = useVoiceRecognition();
  const [processing, setProcessing] = useState(false);
  const [processedText, setProcessedText] = useState('');
  const [extractedProduct, setExtractedProduct] = useState<{name: string, quantity?: number, unit?: string} | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<MultiProduct[]>([]);
  const [waveformActive, setWaveformActive] = useState(false);
  const [isMultiCommand, setIsMultiCommand] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);
  const { products, addProduct } = useInventory();
  const navigate = useNavigate();

  const handleListen = async () => {
    try {
      setWaveformActive(true);
      toast.info("Listening... Say commands like 'Add 5kg rice, 2kg sugar' or 'Create bill for 5 rice and 3 milk'", { duration: 3000 });
      
      const result = await listen();
      setProcessing(true);
      
      setTimeout(() => {
        const rawText = result.rawText;
        setProcessedText(rawText);
        
        // Check if it's a multi-product command
        const isMulti = rawText.includes(',') || /\\band\\b/i.test(rawText);
        setIsMultiCommand(isMulti);
        
        if (isMulti) {
          // Use the multi-product parser
          const productNames = products.map(p => ({ name: p.name }));
          const parsedProducts = parseMultiProductCommand(rawText, productNames);
          setExtractedProducts(parsedProducts);
          
          // For UI display, use the first product and update the commandResult
          if (parsedProducts.length > 0) {
            const firstProduct = parsedProducts[0];
            setExtractedProduct({
              name: firstProduct.name,
              quantity: firstProduct.quantity,
              unit: firstProduct.unit
            });
            
            // Update the commandResult with the first product info
            if (result && parsedProducts[0]) {
              result.productName = parsedProducts[0].name;
              result.quantity = { 
                value: parsedProducts[0].quantity || 1, 
                unit: parsedProducts[0].unit || 'unit' 
              };
              result.position = parsedProducts[0].position || '';
              if (parsedProducts[0].price !== undefined) {
                result.price = parsedProducts[0].price;
              }
            }
          }
        } else {
          // Process as single product command - extract clean product name
          const cleanProductName = rawText
            .replace(/^(add|create|insert|put|register|include|log|record|enter|save|store|place|set up|new|make|bring|stock|upload)\s+/i, '')
            .replace(/^\d+(\.\d+)?\s+(kg|g|ml|l|litre|litres|liter|liters|pack|packs|piece|pieces|pcs|units?|boxes|box|dozen|carton|bag|bags|bottle|bottles)\s+/i, '')
            .replace(/\s+(at|in|on)\s+(shelf|rack|position|section|aisle|row|cabinet|drawer|bin|box)\s+\d+/i, '')
            .replace(/\s+(for|at|price|cost)\s+(\d+|₹\d+|rs\d+)/i, '')
            .trim();
          
          setExtractedProduct({
            name: cleanProductName,
            quantity: result.quantity?.value,
            unit: result.quantity?.unit
          });
          
          // Update the productName in the result
          if (result) {
            result.productName = cleanProductName;
          }
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

  const handleAddMultiProducts = async () => {
    setIsAddingToInventory(true);
    
    try {
      // Add all products with a delay
      let addedCount = 0;
      
      for (const [index, product] of extractedProducts.entries()) {
        try {
          setTimeout(async () => {
            const productData = {
              name: product.name,
              quantity: product.quantity || 1,
              unit: product.unit || 'unit',
              price: product.price || 0,
              position: product.position || 'Default', 
              image_url: ''
            };
            
            // Add to in-memory state
            addProduct(productData);
            
            // Also save directly to Supabase
            try {
              await supabase
                .from('inventory')
                .insert({
                  product_name: product.name,
                  quantity: product.quantity || 1,
                  price: product.price || 0,
                  image_url: '',
                  hindi_name: ''
                });
            } catch (supabaseError) {
              console.error("Supabase save error:", supabaseError);
            }
            
            addedCount++;
            if (addedCount === extractedProducts.length) {
              toast.success(`Added ${addedCount} products to inventory`);
              setIsAddingToInventory(false);
              setShowPopup(false);
              reset();
            }
          }, index * 800);
        } catch (productError) {
          console.error("Error adding product:", productError);
        }
      }
    } catch (error) {
      toast.error("Failed to add products.");
      console.error("Error adding products:", error);
      setIsAddingToInventory(false);
      setShowPopup(false);
      reset();
    }
  };

  const handleConfirmProduct = async () => {
    if (!commandResult) return;
    
    setIsAddingToInventory(true);
    
    try {
      if (isMultiCommand) {
        handleAddMultiProducts();
      } else {
        // Prepare product data
        const productData = {
          name: commandResult.productName || 'Unknown Product',
          quantity: commandResult.quantity?.value || 1,
          unit: commandResult.quantity?.unit || 'unit',
          price: commandResult.price || 0,
          position: commandResult.position || 'Default',
          image_url: commandResult.imageUrl || ''
        };
        
        // Add to in-memory state
        addProduct(productData);
        
        // Also save directly to Supabase
        try {
          await supabase
            .from('inventory')
            .insert({
              product_name: productData.name,
              quantity: productData.quantity,
              price: productData.price || 0,
              image_url: productData.image_url || '',
              hindi_name: ''
            });
            
          toast.success(`Added ${productData.name} to inventory and saved to database`);
        } catch (supabaseError) {
          console.error("Supabase save error:", supabaseError);
          toast.error("Failed to save to database, but added locally");
        }
        
        setIsAddingToInventory(false);
        setShowPopup(false);
        reset();
      }
    } catch (error) {
      toast.error("Failed to add product.");
      console.error("Error adding product:", error);
      setIsAddingToInventory(false);
      setShowPopup(false);
      reset();
    }
  };

  const handleCancelProduct = () => {
    setShowPopup(false);
    reset();
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Enhanced command detection with more patterns
    const isSearchCommand = /search|find|look for|locate|where is|show|check/i.test(lowerCommand);
    const isBillCommand = /bill|invoice|receipt|checkout|sale/i.test(lowerCommand);
    const isProductsCommand = /products|inventory|stock|items/i.test(lowerCommand);
    
    if (isSearchCommand) {
      // Extract search term with improved pattern matching
      const searchPattern = /(?:search|find|look for|locate|where is|show|check)\s+(?:for\s+)?(.+?)(?:\s+in|\s+on|\s+at|$)/i;
      const searchMatch = lowerCommand.match(searchPattern);
      const searchTerms = searchMatch ? searchMatch[1].trim() : lowerCommand.replace(/search|find|for/gi, '').trim();
      
      if (searchTerms) {
        navigate('/products', { state: { searchQuery: searchTerms } });
      } else {
        toast.error('Please specify what to search for');
      }
      return;
    }
    
    if (isBillCommand) {
      navigate('/billing');
      return;
    }
    
    if (isProductsCommand) {
      navigate('/products');
      return;
    }
  };

  if (compact) {
    // Compact version for header or sidebar
    return (
      <div className={`${className}`}>
        <Button
          variant="outline" 
          size="sm"
          onClick={handleListen}
          disabled={isListening || processing}
          className="relative"
        >
          {isListening ? (
            <MicOff className="h-4 w-4 mr-2" />
          ) : processing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mic className="h-4 w-4 mr-2" />
          )}
          Voice
        </Button>
        
        {/* Voice Command Popup */}
        {commandResult && showPopup && (
          <VoiceCommandPopup
            result={commandResult}
            onConfirm={handleConfirmProduct}
            onCancel={handleCancelProduct}
            loading={isAddingToInventory}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            {isListening ? (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {}} 
                className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-violet-500/50 text-red-500 animate-pulse"
              >
                <MicOff className="h-8 w-8" />
              </Button>
            ) : processing ? (
              <Button 
                size="lg" 
                variant="outline"
                disabled
                className="h-20 w-20 rounded-full bg-white dark:bg-black border-2 border-violet-500/50"
              >
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handleListen}
                className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 border-0"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}
          </motion.div>
          
          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">
              {isListening ? "Listening..." : processing ? "Processing..." : "Tap to speak"}
            </p>
            {processedText && !isListening && !showPopup && (
              <Badge className="mt-2">{processedText}</Badge>
            )}
          </div>
        </div>
      </Card>
      
      {/* Voice Command Popup */}
      {commandResult && showPopup && (
        <VoiceCommandPopup
          result={commandResult}
          onConfirm={handleConfirmProduct}
          onCancel={handleCancelProduct}
          loading={isAddingToInventory}
        />
      )}
    </div>
  );
}
