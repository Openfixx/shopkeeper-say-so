
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ProductImagePicker from './ProductImagePicker';
import { useVoiceRecognition } from '@/lib/voice';
import { Mic, Loader2 } from 'lucide-react';

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

  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!commandResult) return;

    onCommand(transcript, {
      processed: {
        product: commandResult.productName,
        quantity: commandResult.quantity,
        price: commandResult.price,
        position: commandResult.rackNumber ? `Rack ${commandResult.rackNumber}` : undefined,
        imageUrl: commandResult.imageUrl
      }
    });

    // Only open image picker if we have a valid image URL
    if (commandResult.imageUrl && !commandResult.imageUrl.includes('placehold.co')) {
      setIsImagePickerOpen(true);
    } else if (commandResult.productName && retryCount < 2) {
      // If we didn't get a valid image and have a product name, try one more time
      toast.info("Searching for a better product image...");
      setRetryCount(prev => prev + 1);
      // Retry image search with a slight delay
      setTimeout(() => {
        import('@/utils/fetchImage').then(({ fetchProductImage }) => {
          fetchProductImage(commandResult.productName || "")
            .then(newImageUrl => {
              if (newImageUrl && !newImageUrl.includes('placehold.co')) {
                onCommand(transcript, {
                  processed: {
                    ...commandResult,
                    imageUrl: newImageUrl
                  }
                });
                setIsImagePickerOpen(true);
              } else {
                toast.error("Could not find a suitable product image");
              }
            });
        });
      }, 1000);
    }
  }, [commandResult, transcript]);

  const handleListen = async () => {
    reset();
    setRetryCount(0);
    try {
      await listen(supportedLanguages[0]);
    } catch (error) {
      toast.error('Voice recognition failed. Please try again.');
    }
  };

  const handleImageConfirm = () => {
    toast.success("Product saved successfully");
    setIsImagePickerOpen(false);
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
        {isListening ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Start Voice Command
          </>
        )}
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

      {isImagePickerOpen && commandResult?.imageUrl && (
        <ProductImagePicker
          productName={commandResult.productName || ''}
          initialImage={commandResult.imageUrl}
          onConfirm={handleImageConfirm}
          onCancel={() => setIsImagePickerOpen(false)}
        />
      )}
    </div>
  );
}
