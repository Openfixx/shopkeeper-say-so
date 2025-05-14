
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Mic, MicOff, MapPin, Calendar, Tag } from 'lucide-react';
import { CommandIntent, detectCommandIntent } from '@/utils/nlp/commandTypeDetector';
import { parseEnhancedVoiceCommand, EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { format } from 'date-fns';

interface VoiceInputWithLocationProps {
  className?: string;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
}

export default function VoiceInputWithLocation({ className, onCommand, productList = [] }: VoiceInputWithLocationProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [detectedLocation, setDetectedLocation] = useState<string | undefined>(undefined);
  const [processing, setProcessing] = useState(false);

  const handleListen = async () => {
    try {
      setIsListening(true);
      toast.info("Listening... Try commands like 'Add 2 kg rice from the top shelf expiring next month'");
      
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error("Speech recognition is not supported in this browser");
        setIsListening(false);
        return;
      }
      
      // Initialize speech recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        processText(transcript);
        toast.success("Voice command received!");
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast.error("Failed to recognize speech");
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
      
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error("Voice recognition failed. Please try again.");
      setIsListening(false);
    }
  };
  
  const processText = (command: string) => {
    setProcessing(true);
    
    try {
      // Detect command intent
      const intent = detectCommandIntent(command);
      
      if (intent === CommandIntent.ADD_PRODUCT) {
        // Parse the command with our enhanced parser
        const result = parseEnhancedVoiceCommand(command, productList);
        
        setProducts(result.products);
        setDetectedLocation(result.detectedLocation);
        
        // Pass the structured data back to the parent component
        if (onCommand && result.products.length > 0) {
          onCommand(command, result.products);
        }
      } else if (intent !== CommandIntent.UNKNOWN) {
        toast.info(`Detected command intent: ${intent}`);
        
        if (onCommand) {
          onCommand(command, []);
        }
      } else {
        toast.warning("Could not understand command");
      }
    } catch (error) {
      console.error("Error processing text:", error);
      toast.error("Failed to process command");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className={cn("border shadow-md overflow-hidden", className)}>
      <CardHeader className="bg-muted/40">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Enhanced Voice Input</span>
          <Button
            onClick={handleListen}
            disabled={isListening}
            variant={isListening ? "destructive" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Voice Command
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {text && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Voice Command:</h3>
            <p className="text-sm bg-muted p-2 rounded">{text}</p>
          </div>
        )}
        
        {detectedLocation && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-amber-500" />
            <span>Location: <Badge variant="outline">{detectedLocation}</Badge></span>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recognized Products:</h3>
            
            {products.map((product, index) => (
              <div key={index} className="border rounded-md p-3 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span>{product.quantity || 1}</span>
                    <Badge variant="secondary">{product.unit || 'pc'}</Badge>
                  </div>
                </div>
                
                {product.price !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-green-500" />
                    <span>Price: ₹{product.price}</span>
                  </div>
                )}
                
                {product.position && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>Location: {product.position}</span>
                  </div>
                )}
                
                {product.expiry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>Expiry: {format(new Date(product.expiry), 'dd MMM yyyy')}</span>
                  </div>
                )}
                
                {product.variant && (
                  <div className="flex flex-wrap gap-2 mt-1">
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
            ))}
          </div>
        )}
        
        {!text && !isListening && (
          <div className="text-center py-6 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Click "Start Voice Command" to add products with voice</p>
            <p className="text-sm mt-2">Try saying:</p>
            <p className="text-xs mt-1 font-medium">"Add 5 kg rice from the top shelf expiring next month"</p>
            <p className="text-xs mt-1 font-medium">"Add 2 liters milk from the fridge and 3 loaves of bread"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
