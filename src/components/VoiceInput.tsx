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
  const { 
    text: transcript,
    isListening,
    listen,
    commandResult,
    reset
  } = useVoiceRecognition();

  const [productImage, setProductImage] = useState('');

  // Process command results
  useEffect(() => {
    if (commandResult) {
      onCommand(transcript, commandResult);
      
      if (commandResult.imageUrl) {
        setProductImage(commandResult.imageUrl);
      }
    }
  }, [commandResult, transcript]);

  const handleListen = async () => {
    reset();
    try {
      await listen(supportedLanguages[0]);
    } catch (error) {
      toast.error('Voice recognition failed. Please try again.');
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
            
            {commandResult && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Detected:</div>
                <div className="flex flex-wrap gap-2">
                  {commandResult.productName && (
                    <Badge variant="secondary">
                      Product: {commandResult.productName}
                    </Badge>
                  )}
                  {commandResult.quantity && (
                    <Badge variant="secondary">
                      Qty: {commandResult.quantity.value} {commandResult.quantity.unit}
                    </Badge>
                  )}
                  {commandResult.price && (
                    <Badge variant="secondary">
                      Price: ₹{commandResult.price}
                    </Badge>
                  )}
                  {commandResult.rackNumber && (
                    <Badge variant="secondary">
                      Rack: {commandResult.rackNumber}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {productImage && (
        <ProductImagePicker
          productName={commandResult?.productName || ''}
          initialImage={productImage}
          onConfirm={() => {
            toast.success("Product saved successfully");
            setProductImage('');
          }}
          onCancel={() => setProductImage('')}
        />
      )}
    </div>
  );
}
