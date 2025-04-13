import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ProductImagePicker from './ProductImagePicker';
import { useVoiceRecognition } from '@/lib/voice';

export interface VoiceInputProps {
  onCommand: (text: string, data?: any) => void;
  className?: string;
  supportedLanguages?: string[];
}

export default function VoiceInput({ 
  onCommand,
  className,
  supportedLanguages = ['en-US', 'hi-IN']
}: VoiceInputProps) {
  const [session, setSession] = useState({
    active: false,
    product: null as null | {
      name: string;
      image?: string;
      rack?: number;
      price?: number;
      quantity?: { value: number; unit: string };
    }
  });

  const { 
    text: transcript,
    isListening,
    listen,
    commandResult,
    reset
  } = useVoiceRecognition();

  // Handle command results
  useEffect(() => {
    if (commandResult) {
      processCommand(commandResult);
    }
  }, [commandResult]);

  const processCommand = (result: any) => {
    const newContext = { ...session };

    // Extract product info
    if (result.productName) {
      newContext.product = {
        name: result.productName,
        image: result.imageUrl,
        rack: result.rackNumber || undefined
      };
    }

    // Extract quantity (e.g., "2 kg")
    const quantityMatch = transcript.match(/(\d+)\s*(kg|g|ml|l|pieces?|pcs)/i);
    if (quantityMatch && newContext.product) {
      newContext.product.quantity = {
        value: parseInt(quantityMatch[1]),
        unit: quantityMatch[2].toLowerCase()
      };
    }

    // Extract price (e.g., "₹120")
    const priceMatch = transcript.match(/₹?(\d+)/);
    if (priceMatch && newContext.product) {
      newContext.product.price = parseInt(priceMatch[1]);
    }

    setSession(newContext);
    onCommand(transcript, newContext);
  };

  const handleListen = async () => {
    if (isListening) return;
    
    try {
      reset();
      await listen(supportedLanguages[0]);
    } catch (error) {
      toast.error(`Voice error: ${error.message}`);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Button
        onClick={handleListen}
        disabled={isListening}
        variant={isListening ? "destructive" : "default"}
        size="lg"
        className="w-full"
      >
        {isListening ? "Listening..." : "Start Voice Command"}
      </Button>

      {transcript && (
        <Card className="border border-primary/10 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">Current Command</h3>
            <p className="text-sm bg-muted/40 p-2 rounded-md">{transcript}</p>
            
            {session.product && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Detected:</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Product: {session.product.name}
                  </Badge>
                  {session.product.quantity && (
                    <Badge variant="secondary">
                      Qty: {session.product.quantity.value} {session.product.quantity.unit}
                    </Badge>
                  )}
                  {session.product.price && (
                    <Badge variant="secondary">
                      Price: ₹{session.product.price}
                    </Badge>
                  )}
                  {session.product.rack && (
                    <Badge variant="secondary">
                      Rack: {session.product.rack}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {session.product?.image && (
        <ProductImagePicker
          productName={session.product.name}
          initialImage={session.product.image}
          onConfirm={() => toast.success("Product saved!")}
          onCancel={() => setSession({ ...session, product: null })}
        />
      )}
    </div>
  );
}
