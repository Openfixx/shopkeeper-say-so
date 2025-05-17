
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Mic, MicOff, MapPin, Loader2 } from 'lucide-react';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';

interface VoiceInputWithLocationProps {
  className?: string;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  compact?: boolean;
}

export default function VoiceInputWithLocation({ 
  className, 
  onCommand,
  compact = false
}: VoiceInputWithLocationProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [detectedLocation, setDetectedLocation] = useState<string | undefined>(undefined);
  const [processing, setProcessing] = useState(false);

  const handleListen = () => {
    try {
      setIsListening(true);
      toast.info("Listening... Try commands like 'Add 2 kg rice and 3 kg sugar'");
      
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
        setIsListening(false);
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
      console.log("Processing command:", command);
      
      // Parse products from the command
      const parsedProducts = parseMultipleProducts(command);
      console.log("Parsed products:", parsedProducts);
      
      if (parsedProducts && parsedProducts.length > 0) {
        // Convert to EnhancedProduct format
        const enhancedProducts: EnhancedProduct[] = parsedProducts.map(p => ({
          name: p.name || '',
          quantity: p.quantity || 1,
          unit: p.unit || 'piece',
          position: p.position || 'General Storage',
          price: p.price || undefined,
          confidence: 1.0
        }));
        
        setProducts(enhancedProducts);
        
        // Extract general location if available from the first product
        if (parsedProducts[0]?.position) {
          setDetectedLocation(parsedProducts[0].position);
        }
        
        // Pass the structured data back to the parent component
        if (onCommand && enhancedProducts.length > 0) {
          console.log("Calling onCommand with products:", enhancedProducts);
          onCommand(command, enhancedProducts);
        }
      } else {
        console.log("No products detected in command");
        toast.warning("Could not identify products in the command");
      }
    } catch (error) {
      console.error("Error processing text:", error);
      toast.error("Failed to process command");
    } finally {
      setProcessing(false);
    }
  };

  // If compact, render a simpler version
  if (compact) {
    return (
      <Button
        onClick={handleListen}
        disabled={isListening || processing}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="flex items-center gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Listening...
          </>
        ) : processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Voice
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className={cn("border shadow-md overflow-hidden", className)}>
      <CardHeader className="bg-muted/40 py-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Voice Command</span>
          <Button
            onClick={handleListen}
            disabled={isListening || processing}
            variant={isListening ? "destructive" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                Listening...
              </>
            ) : processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Speak
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
                
                {product.position && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>Location: {product.position}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!text && !isListening && !processing && (
          <div className="text-center py-6 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Click "Speak" to add products with voice</p>
            <p className="text-sm mt-2">Try saying:</p>
            <p className="text-xs mt-1 font-medium">"Add 5 kg rice, 3 kg sugar, and 2 liters milk"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
