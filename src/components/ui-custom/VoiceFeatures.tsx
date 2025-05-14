
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import VoiceInput from '@/components/VoiceInput';
import VoiceProductRecognition from '@/components/ui-custom/VoiceProductRecognition';
import { Mic, Languages, Zap, Wand2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { ProductEntity } from '@/utils/nlp/productVoiceParser';
import { toast } from 'sonner';

const VoiceFeatures: React.FC = () => {
  const { addProduct } = useInventory();
  const [activeTab, setActiveTab] = useState('product-recognition');
  
  const handleProductsRecognized = (products: ProductEntity[]) => {
    console.log("Products recognized:", products);
  };
  
  const handleAddToInventory = (products: ProductEntity[]) => {
    products.forEach(product => {
      addProduct({
        name: product.name,
        quantity: product.quantity || 1,
        unit: product.unit || 'pcs',
        price: 0, // Default price
        position: product.variant?.type || 'Default',
        image_url: '',
      });
    });
    
    toast.success(`Added ${products.length} products to inventory`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="product-recognition" className="flex items-center gap-1">
            <Wand2 className="h-4 w-4" /> Product Recognition
          </TabsTrigger>
          <TabsTrigger value="basic-voice" className="flex items-center gap-1">
            <Mic className="h-4 w-4" /> Basic Voice
          </TabsTrigger>
          <TabsTrigger value="language-features" className="flex items-center gap-1">
            <Languages className="h-4 w-4" /> Language Features
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="product-recognition" className="space-y-4">
          <VoiceProductRecognition 
            onProductsRecognized={handleProductsRecognized} 
            onAddToInventory={handleAddToInventory}
          />
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Advanced Product Recognition</h3>
              <p className="text-sm text-muted-foreground">
                This feature uses natural language processing to extract product details from voice commands, 
                including quantities, units, and variants. Try saying "Add 2 kg rice, 3 bottles of olive oil, 
                and 1 dozen large eggs".
              </p>
              <div className="mt-4">
                <h4 className="text-sm font-medium">Supported features:</h4>
                <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Multi-product recognition ("Add rice, sugar, and milk")</li>
                  <li>Quantities and units ("2 kg rice", "3 bottles oil")</li>
                  <li>Product variants ("large eggs", "organic milk")</li>
                  <li>Fuzzy matching for spelling mistakes</li>
                  <li>Clarification for ambiguous products</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="basic-voice">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Basic Voice Commands</h3>
              <VoiceInput className="max-w-md mx-auto" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="language-features">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Language Processing Features</h3>
              <p className="text-sm text-muted-foreground">
                This section demonstrates NLP capabilities including:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Named Entity Recognition (NER) for product information</li>
                <li>Intent classification for voice commands</li>
                <li>Levenshtein distance for fuzzy matching</li>
                <li>Entity extraction for structured data</li>
              </ul>
              
              <div className="border-t mt-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Note: These features work locally in the browser without requiring a backend server.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceFeatures;
