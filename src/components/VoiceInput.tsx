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
  placeholder?: string;
  supportedLanguages?: string[];
}

export default function VoiceInput({ 
  onCommand, 
  className,
  placeholder = "Try saying 'Add 5 kg sugar price ₹50 to rack 3'",
  supportedLanguages = ['en-US', 'hi-IN']
}: VoiceInputProps) {
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState('');
  const [initialImage, setInitialImage] = useState('');
  const [processedData, setProcessedData] = useState<any>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  const { 
    text: lastTranscript, 
    isListening, 
    listen, 
    commandResult 
  } = useVoiceRecognition();

  // Process voice command results
  useEffect(() => {
    if (commandResult) {
      handleVoiceResult(commandResult);
    }
  }, [commandResult]);

  const handleVoiceResult = async (result: any) => {
    const enhancedData = {
      product: result.productName,
      quantity: extractQuantity(lastTranscript),
      price: extractPrice(lastTranscript),
      position: result.rackNumber ? `Rack ${result.rackNumber}` : undefined,
      command: lastTranscript.toLowerCase().includes('add') ? 'add' : 
               lastTranscript.toLowerCase().includes('create') ? 'create' : undefined
    };

    setProcessedData(enhancedData);
    setProcessingComplete(false);
    
    if (enhancedData.product && enhancedData.command) {
      setCurrentProduct(enhancedData.product);
      setInitialImage(result.imageUrl || '');
      setImagePickerVisible(true);
    }
    
    onCommand(lastTranscript, { processed: enhancedData });
    setProcessingComplete(true);
  };

  const extractQuantity = (text: string) => {
    const match = text.match(/(\d+)\s*(kg|g|ml|l|pieces?|pcs)/i);
    return match ? { value: parseInt(match[1]), unit: match[2].toLowerCase() } : null;
  };

  const extractPrice = (text: string) => {
    const match = text.match(/₹?(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const handleImageConfirmed = () => {
    setImagePickerVisible(false);
    toast.success(`Image confirmed for ${currentProduct}`);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-4">
        <Button
          onClick={() => listen(supportedLanguages[0])}
          disabled={isListening}
          variant={isListening ? "destructive" : "default"}
          size="lg"
          className="w-full"
        >
          {isListening ? "Listening..." : "Start Voice Command"}
        </Button>
        
        {lastTranscript && (
          <Card className="mt-4 border border-primary/10 shadow-lg">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Last Command</h3>
              <p className="text-sm bg-muted/40 p-2 rounded-md">{lastTranscript}</p>
              
              {processedData && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Detected entities:</div>
                  <div className="flex flex-wrap gap-2">
                    {processedData.product && (
                      <Badge variant="secondary">
                        Product: {processedData.product}
                      </Badge>
                    )}
                    {processedData.quantity && (
                      <Badge variant="secondary">
                        Qty: {processedData.quantity.value} {processedData.quantity.unit}
                      </Badge>
                    )}
                    {processedData.price && (
                      <Badge variant="secondary">
                        Price: ₹{processedData.price}
                      </Badge>
                    )}
                    {processedData.position && (
                      <Badge variant="secondary">
                        Position: {processedData.position}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {imagePickerVisible && (
        <ProductImagePicker
          productName={currentProduct}
          initialImage={initialImage}
          onImageConfirmed={handleImageConfirmed}
          onCancel={() => setImagePickerVisible(false)}
        />
      )}
    </div>
  );
}
