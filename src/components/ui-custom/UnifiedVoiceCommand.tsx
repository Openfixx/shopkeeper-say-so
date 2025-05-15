import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/lib/voice';
import { Badge } from '@/components/ui/badge';
import { parseMultipleProducts, VoiceProduct } from '@/utils/voiceCommandUtils';
import VoiceCommandPopup from './VoiceCommandPopup';
import { CommandResult } from '@/lib/voice';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';
import { addMultipleProductsToInventory } from '@/lib/supabase';

interface UnifiedVoiceCommandProps {
  className?: string;
  compact?: boolean;
}

export default function UnifiedVoiceCommand({ className = '', compact = false }: UnifiedVoiceCommandProps) {
  const { text, isListening, listen, commandResult, reset } = useVoiceRecognition();
  const [processing, setProcessing] = useState(false);
  const [processedText, setProcessedText] = useState('');
  const [extractedProduct, setExtractedProduct] = useState<{name: string, quantity?: number, unit?: string} | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<VoiceProduct[]>([]);
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
        console.log('Raw voice input:', rawText);
        
        // Use both parsers to get the best results
        const productNames = products.map(p => ({ name: p.name }));
        
        // Try the enhanced multi-product parser first
        const enhancedParsedProducts = parseMultiProductCommand(rawText, productNames);
        console.log('Enhanced parsed products:', enhancedParsedProducts);
        
        // Convert to VoiceProduct format
        const convertedProducts: VoiceProduct[] = enhancedParsedProducts.map(p => ({
          name: p.name,
          quantity: p.quantity || 1,
          unit: p.unit || 'piece',
          position: p.position || 'Default',
          price: p.price
        }));
        
        // If enhanced parser didn't find anything useful, fall back to the original parser
        const finalProducts = convertedProducts.length > 0 
          ? convertedProducts 
          : parseMultipleProducts(rawText, productNames);
        
        console.log('Final parsed products:', finalProducts);
        setExtractedProducts(finalProducts);
        setIsMultiCommand(finalProducts.length > 1);
        
        // Extract general location to apply to all products if not already specified
        const locationMatch = rawText.match(/(on|at|in)\s+(rack|shelf|box|cabinet|fridge|freezer|section|aisle)\s+(\w+)/i);
        if (locationMatch && finalProducts.length > 0) {
          const [, , locationType, locationNumber] = locationMatch;
          const generalLocation = `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${locationNumber}`;
          
          // Apply to all products that don't have a specific location
          finalProducts.forEach(product => {
            if (!product.position || product.position === 'Default' || product.position === 'General Storage') {
              product.position = generalLocation;
            }
          });
        }
        
        // For UI display and single-product workflow, use the first product
        if (finalProducts.length > 0) {
          const firstProduct = finalProducts[0];
          setExtractedProduct({
            name: firstProduct.name,
            quantity: firstProduct.quantity,
            unit: firstProduct.unit
          });
          
          // Update the commandResult with the first product info
          if (result) {
            result.productName = firstProduct.name;
            result.quantity = { 
              value: firstProduct.quantity || 1, 
              unit: firstProduct.unit || 'unit' 
            };
            result.position = firstProduct.position || '';
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
      console.log('Adding multiple products:', extractedProducts);
      
      // Use the new batch function from supabase.ts
      const { results, errors } = await addMultipleProductsToInventory(extractedProducts);
      
      if (errors.length === 0) {
        // All products were added successfully
        toast.success(`Added ${extractedProducts.length} products to inventory`);
        
        // Add all products to local state too
        extractedProducts.forEach(product => {
          addProduct({
            name: product.name,
            quantity: product.quantity || 1,
            unit: product.unit || 'unit',
            price: product.price || 0,
            position: product.position || 'Default',
            image_url: product.image_url || ''
          });
        });
      } else if (results.length > 0) {
        // Some products were added
        toast.warning(`Added ${results.length} products, but failed to add ${errors.length} products`);
        
        // Add successful products to local state
        extractedProducts
          .filter(p => !errors.find(e => e.product === p.name))
          .forEach(product => {
            addProduct({
              name: product.name,
              quantity: product.quantity || 1,
              unit: product.unit || 'unit',
              price: product.price || 0,
              position: product.position || 'Default',
              image_url: product.image_url || ''
            });
          });
      } else {
        // No products were added
        toast.error(`Failed to add products: ${errors.map(e => e.error).join(', ')}`);
      }
      
      setIsAddingToInventory(false);
      setShowPopup(false);
      reset();
    } catch (error) {
      toast.error("Failed to add products.");
      console.error("Error adding products:", error);
      setIsAddingToInventory(false);
      setShowPopup(false);
      reset();
    }
  };

  const handleConfirmProduct = async (location?: string) => {
    if (!commandResult) return;
    
    setIsAddingToInventory(true);
    
    try {
      if (isMultiCommand) {
        handleAddMultiProducts();
      } else {
        // For single product case
        const productData = {
          name: commandResult.productName || 'Unknown Product',
          quantity: commandResult.quantity?.value || 1,
          unit: commandResult.quantity?.unit || 'unit',
          price: commandResult.price || 0,
          position: location || commandResult.position || 'Default',
          image_url: commandResult.imageUrl || ''
        };
        
        console.log('Adding single product:', productData);
        
        try {
          // Use the saveVoiceProduct function
          const result = await saveVoiceProduct(productData);
          
          // Add to in-memory state
          addProduct(productData);
          
          toast.success(`Added ${productData.name} to inventory`);
        } catch (error: any) {
          console.error("Database error:", error);
          toast.warning(`Product added locally but database save failed: ${error.message}`);
          
          // Still add to local state
          addProduct(productData);
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

  // Compact version for header or sidebar
  if (compact) {
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
            multiProductMode={isMultiCommand}
            multiProducts={extractedProducts}
          />
        )}
      </div>
    );
  }

  // Full version for main screens
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
          multiProductMode={isMultiCommand}
          multiProducts={extractedProducts}
        />
      )}
    </div>
  );
}
