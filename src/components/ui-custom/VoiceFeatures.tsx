
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';
import VoiceCommandButton from './VoiceCommandButton';
import VoiceCommandPopup from './VoiceCommandPopup';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { CommandIntent, detectCommandIntent } from '@/utils/nlp/commandTypeDetector';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';
import { format } from 'date-fns';

// Sample product list for demonstration
const SAMPLE_PRODUCTS = [
  { name: "Rice", id: 1 },
  { name: "Milk", id: 2 },
  { name: "Bread", id: 3 },
  { name: "Sugar", id: 4 },
  { name: "Salt", id: 5 },
  { name: "Flour", id: 6 },
  { name: "Oil", id: 7 },
  { name: "Eggs", id: 8 },
  { name: "Butter", id: 9 },
  { name: "Cheese", id: 10 },
  { name: "Coca-Cola", id: 11 },
  { name: "Pepsi", id: 12 },
  { name: "Apple", id: 13 },
  { name: "Banana", id: 14 },
  { name: "Orange", id: 15 },
  { name: "Potato", id: 16 },
  { name: "Tomato", id: 17 },
  { name: "Onion", id: 18 },
  { name: "Garlic", id: 19 },
  { name: "Chicken", id: 20 },
];

// Define proper props interfaces for components
interface VoiceCommandButtonProps {
  onCommand?: (command: string) => void;
}

interface VoiceCommandPopupProps {
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
}

export default function VoiceFeatures() {
  const [addedProducts, setAddedProducts] = useState<EnhancedProduct[]>([]);
  const [processingCommand, setProcessingCommand] = useState(false);
  
  const handleCommand = (command: string, products: EnhancedProduct[]) => {
    console.log("Voice command received:", command);
    console.log("Processed products:", products);
    
    setProcessingCommand(true);
    
    const intent = detectCommandIntent(command);
    
    switch (intent) {
      case CommandIntent.ADD_PRODUCT:
        if (products.length > 0) {
          setAddedProducts(prev => [...prev, ...products]);
          toast({
            title: "Success",
            description: `Added ${products.length} product(s) to inventory`,
            variant: "default",
          });
        } else if (command.includes(',') || /\band\b/i.test(command)) {
          // Handle multi-product commands using the enhanced parser
          const productNames = SAMPLE_PRODUCTS.map(p => ({ name: p.name }));
          const parsedProducts = parseMultiProductCommand(command, productNames);
          
          if (parsedProducts.length > 0) {
            // Convert to EnhancedProduct format
            const enhancedProducts: EnhancedProduct[] = parsedProducts.map(p => ({
              name: p.name,
              quantity: p.quantity || 1,
              unit: p.unit || 'piece',
              position: p.position || 'General Storage',
              price: p.price || 0,
              confidence: 1.0
            }));
            
            setAddedProducts(prev => [...prev, ...enhancedProducts]);
            toast({
              title: "Success",
              description: `Added ${enhancedProducts.length} products using multi-product parser`,
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Warning",
            description: "No products detected in command",
            variant: "destructive",
          });
        }
        break;
      case CommandIntent.GENERATE_BILL:
      case CommandIntent.CREATE_BILL:
        toast({
          title: "Info",
          description: "Generating bill...",
          variant: "default",
        });
        break;
      case CommandIntent.SEARCH_PRODUCT:
        toast({
          title: "Info",
          description: "Searching products...",
          variant: "default",
        });
        break;
      case CommandIntent.UPDATE_PRODUCT:
        toast({
          title: "Info",
          description: "Updating product...",
          variant: "default",
        });
        break;
      case CommandIntent.REMOVE_PRODUCT:
      case CommandIntent.DELETE_PRODUCT:
        toast({
          title: "Info",
          description: "Removing product...",
          variant: "default",
        });
        break;
      default:
        toast({
          title: "Info", 
          description: "Command recognized: " + intent,
          variant: "default",
        });
    }
    
    setProcessingCommand(false);
  };
  
  const handleLegacyCommand = (command: string) => {
    console.log("Legacy command received:", command);
    
    // Using the old parser for comparison
    if (command.includes(',') || /\band\b/i.test(command)) {
      const productNames = SAMPLE_PRODUCTS.map(p => ({ name: p.name }));
      const parsedProducts = parseMultiProductCommand(command, productNames);
      
      console.log("Legacy parser results:", parsedProducts);
      toast({
        title: "Info",
        description: `Legacy parser detected ${parsedProducts.length} products`,
        variant: "default",
      });
    }
  };

  const handleProductClear = () => {
    setAddedProducts([]);
    toast({
      title: "Info",
      description: "Cleared product list",
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="enhanced" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="enhanced">Enhanced Voice Input</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Voice Input</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enhanced" className="pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <VoiceCommandPopup
                result={null}
                onConfirm={() => {}}
                onCancel={() => {}}
                productList={SAMPLE_PRODUCTS.map(p => ({ name: p.name }))}
                onCommand={handleCommand}
              />
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Voice Command Support</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Enhanced features now support:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Multiple product commands (e.g., "Add rice, sugar, and milk")</li>
                    <li>Product location extraction (e.g., "Add milk from the fridge")</li>
                    <li>Expiry date parsing (e.g., "Rice expiring next month")</li>
                    <li>Bill command variations (e.g., "Generate bill with 10% discount")</li>
                    <li>Price extraction (e.g., "Rice for ₹100")</li>
                    <li>Product variants (e.g., "Red apple", "Organic milk")</li>
                  </ul>
                  
                  <div className="mt-4">
                    <p className="font-medium">Try these commands:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>"Add 5 kg rice, 2 kg sugar, and 3 liters milk"</li>
                      <li>"Add 2 packets biscuits and 1 kg sugar from rack 3"</li>
                      <li>"Add 3 red apples and 2 kg sugar for ₹80"</li>
                      <li>"Generate bill with 10% discount"</li>
                      <li>"Place 5 organic bananas in section 3"</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {addedProducts.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Added Products</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleProductClear}
                >
                  Clear All
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {addedProducts.map((product, index) => (
                    <div key={index} className="p-3 border rounded flex justify-between items-center bg-card">
                      <span className="font-medium">{product.name}</span>
                      <div className="flex items-center gap-4">
                        {product.expiry && (
                          <span className="text-sm">
                            Expires: {typeof product.expiry === 'string' 
                              ? product.expiry 
                              : format(new Date(product.expiry), 'dd MMM yyyy')}
                          </span>
                        )}
                        {product.position && <span className="text-sm">Location: {product.position}</span>}
                        <span className="px-2 py-1 bg-accent rounded-md text-sm">
                          {product.quantity} {product.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="legacy" className="pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <VoiceCommandButton
                onCommand={handleLegacyCommand}
              />
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Legacy Voice Command Support</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Basic features support:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Simple product detection</li>
                    <li>Basic quantity extraction</li>
                    <li>Multiple product commands with limited accuracy</li>
                  </ul>
                  
                  <div className="mt-4">
                    <p className="font-medium">Try these commands:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>"Add 5 kg rice"</li>
                      <li>"Add 2 liters milk"</li>
                      <li>"Add 3 apples and 2 kg sugar"</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
