
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Mic, MessageSquareText, Brain, AlertCircle, CheckCircle2 } from 'lucide-react';
import SiriStyleVoiceUI from './SiriStyleVoiceUI';
import { Badge } from '@/components/ui/badge';

const VoiceFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tutorial');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Commands</CardTitle>
              <CardDescription>Add products to your inventory using voice commands</CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              <Brain className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="tutorial" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="tutorial" className="text-xs sm:text-sm">
                <MessageSquareText className="h-4 w-4 mr-1 hidden sm:inline" />
                Tutorial
              </TabsTrigger>
              <TabsTrigger value="try" className="text-xs sm:text-sm">
                <Mic className="h-4 w-4 mr-1 hidden sm:inline" />
                Try It
              </TabsTrigger>
              <TabsTrigger value="examples" className="text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline" />
                Examples
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tutorial" className="space-y-4">
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-medium">How to use voice commands</h3>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Adding products</AccordionTrigger>
                    <AccordionContent>
                      Say "Add [quantity] [unit] [product name]" to add a product to your inventory.
                      <br /><br />
                      <strong>Examples:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        <li>"Add 2 kg rice"</li>
                        <li>"Add 5 packets of biscuits"</li>
                        <li>"Add 1 box of cereal"</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Multiple products</AccordionTrigger>
                    <AccordionContent>
                      You can add multiple products at once by separating them with "and" or commas.
                      <br /><br />
                      <strong>Examples:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        <li>"Add 2 kg rice and 3 packets of biscuits"</li>
                        <li>"Add 1 liter milk, 500 grams sugar, and 2 packets of coffee"</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Specifying location</AccordionTrigger>
                    <AccordionContent>
                      You can specify where the product should be stored by adding "in/at/on rack/shelf X".
                      <br /><br />
                      <strong>Examples:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        <li>"Add 2 kg rice in rack 3"</li>
                        <li>"Add 5 packets of biscuits on shelf B"</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Voice recognition tips</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        <li>Speak clearly and at a moderate pace</li>
                        <li>Use short, direct phrases</li>
                        <li>Make sure your environment is not too noisy</li>
                        <li>Allow microphone permissions when prompted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="try" className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-muted-foreground mb-6">
                  Click the button below and speak your command
                </p>
                <SiriStyleVoiceUI className="max-w-sm" />
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Single Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">"Add 2 kg rice in rack 3"</p>
                    <div className="mt-2 border-t pt-2">
                      <p><span className="font-medium">Product:</span> rice</p>
                      <p><span className="font-medium">Quantity:</span> 2 kg</p>
                      <p><span className="font-medium">Location:</span> rack 3</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab('try')}
                    >
                      Try this example
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Multiple Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">"Add 2 liters milk and 3 packets biscuits"</p>
                    <div className="mt-2 border-t pt-2">
                      <p><span className="font-medium">Products:</span> milk, biscuits</p>
                      <p><span className="font-medium">Quantities:</span> 2 liters, 3 packets</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab('try')}
                    >
                      Try this example
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">With Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">"Add 1 box cereal on shelf 2, 2 kg sugar in rack 3"</p>
                    <div className="mt-2 border-t pt-2">
                      <p><span className="font-medium">Products:</span> cereal, sugar</p>
                      <p><span className="font-medium">Locations:</span> shelf 2, rack 3</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setActiveTab('try')}
                    >
                      Try this example
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceFeatures;
