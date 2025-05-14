
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';
import VoiceCommandButton from './VoiceCommandButton';
import VoiceCommandPopup from './VoiceCommandPopup';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
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
  
  const handleCommand = (command: string, products: EnhancedProduct[]) => {
    console.log("Voice command received:", command);
    console.log("Processed products:", products);
    
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
        }
        break;
      case CommandIntent.CREATE_BILL:
      case CommandIntent.GENERATE_BILL:
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
      case CommandIntent.DELETE_PRODUCT:
      case CommandIntent.REMOVE_PRODUCT:
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
                onCommand={handleCommand}
                productList={SAMPLE_PRODUCTS.map(p => ({ name: p.name }))}
              />
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Voice Command Support</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Enhanced features now support:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Product location extraction (e.g., "Add milk from the fridge")</li>
                    <li>Expiry date parsing (e.g., "Rice expiring next month")</li>
                    <li>Multiple product commands (e.g., "Add rice, sugar, and milk")</li>
                    <li>Bill command variations (e.g., "Generate bill with 10% discount")</li>
                    <li>Price extraction (e.g., "Rice for ₹100")</li>
                    <li>Product variants (e.g., "Red apple", "Organic milk")</li>
                  </ul>
                  
                  <div className="mt-4">
                    <p className="font-medium">Try these commands:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>"Add 5 kg rice from the top shelf expiring next month"</li>
                      <li>"Add 2 liters milk from the fridge valid until next Friday"</li>
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
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Added Products</h3>
                <div className="space-y-2">
                  {addedProducts.map((product, index) => (
                    <div key={index} className="p-2 border rounded flex justify-between items-center">
                      <span className="font-medium">{product.name}</span>
                      <div className="flex items-center gap-4">
                        {product.expiry && (
                          <span className="text-sm">
                            Expires: {typeof product.expiry === 'string' 
                              ? product.expiry 
                              : format(product.expiry, 'dd MMM yyyy')}
                          </span>
                        )}
                        {product.position && <span className="text-sm">Location: {product.position}</span>}
                        <span>
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
