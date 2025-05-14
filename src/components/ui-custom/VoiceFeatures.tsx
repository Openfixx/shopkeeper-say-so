
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import VoiceInputWithLocation from '@/components/VoiceInputWithLocation';
import { toast } from 'sonner';
import { CommandIntent, detectCommandIntent } from '@/utils/nlp/commandTypeDetector';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';

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
          toast.success(`Added ${products.length} product(s) to inventory`);
        }
        break;
      case CommandIntent.GENERATE_BILL:
        toast.info("Generating bill...");
        break;
      case CommandIntent.SEARCH_PRODUCT:
        toast.info("Searching products...");
        break;
      case CommandIntent.UPDATE_PRODUCT:
        toast.info("Updating product...");
        break;
      case CommandIntent.REMOVE_PRODUCT:
        toast.info("Removing product...");
        break;
      default:
        toast.info("Command recognized: " + intent);
    }
  };
  
  const handleLegacyCommand = (command: string) => {
    console.log("Legacy command received:", command);
    
    // Using the old parser for comparison
    if (command.includes(',') || /\band\b/i.test(command)) {
      const productNames = SAMPLE_PRODUCTS.map(p => ({ name: p.name }));
      const parsedProducts = parseMultiProductCommand(command, productNames);
      
      console.log("Legacy parser results:", parsedProducts);
      toast.info(`Legacy parser detected ${parsedProducts.length} products`);
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
              <VoiceInputWithLocation
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
                        {product.expiry && <span className="text-sm">Expires: {product.expiry}</span>}
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
              <VoiceInput onCommand={handleLegacyCommand} />
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
