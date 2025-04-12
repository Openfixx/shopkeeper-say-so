
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ProductImagePicker from './ProductImagePicker';
import { getCachedTranslation } from '@/lib/translationCache';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVoiceCommand from './ui-custom/EnhancedVoiceCommand';
import { fetchProductImage } from '@/utils/fetchImage';

export interface VoiceInputProps {
  onCommand: (text: string) => void;
  className?: string;
  placeholder?: string;
  supportedLanguages?: string[];
}

export default function VoiceInput({ 
  onCommand, 
  className,
  placeholder = "Try saying 'Add 5 kg sugar price ₹50'",
  supportedLanguages = ['en-US', 'hi-IN']
}: VoiceInputProps) {
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState('');
  const [initialImage, setInitialImage] = useState('');
  const [processedData, setProcessedData] = useState<any>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [isProcessingContinuation, setIsProcessingContinuation] = useState(false);

  // Process voice command with the enhanced NLP capabilities
  const handleVoiceResult = async (text: string, data: any) => {
    setLastTranscript(text);
    setProcessingComplete(false);
    
    if (data?.processed) {
      setProcessedData(data.processed);
      
      // Check if we have a product command
      if (data.processed.product && (
          data.processed.command?.includes('add') ||
          data.processed.command?.includes('create') ||
          text.toLowerCase().includes('add') ||
          text.toLowerCase().includes('create')
      )) {
        // We have a product to add
        setCurrentProduct(data.processed.product);
        
        // Set initial image if provided by the API
        if (data.imageUrl) {
          setInitialImage(data.imageUrl);
        } else {
          // Try to fetch an image for the product
          const imageUrl = await fetchProductImage(data.processed.product);
          if (imageUrl) {
            setInitialImage(imageUrl);
          }
        }
        
        // Show image picker
        setImagePickerVisible(true);
      }
    }
    
    // Pass the command to parent component
    onCommand(text);
    setProcessingComplete(true);
  };

  // Handle continuation of processing after image confirmation
  const handleContinueProcessing = () => {
    setIsProcessingContinuation(true);
    if (processedData && lastTranscript) {
      // Re-process with the same data to continue the workflow
      handleVoiceResult(lastTranscript, { processed: processedData });
      toast.info("Continuing processing...");
    }
  };

  // Handle image confirmation
  const handleImageConfirmed = () => {
    setImagePickerVisible(false);
    toast.success(`Image confirmed for ${currentProduct}`);
    
    // Auto-continue processing after image is confirmed
    if (processingComplete) {
      toast.info("Continue with next command or action");
      // Auto-trigger next step in the workflow after a short delay
      setTimeout(handleContinueProcessing, 500);
    }
  };

  // This effect adds a "continue" button when processing is complete
  useEffect(() => {
    if (processingComplete && lastTranscript && !isProcessingContinuation) {
      toast.success("Command processed! Continue with next command", {
        action: {
          label: "Continue",
          onClick: handleContinueProcessing
        }
      });
    }
    
    // Reset the continuation flag after processing
    if (processingComplete) {
      setIsProcessingContinuation(false);
    }
  }, [processingComplete, lastTranscript]);

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-4">
        <EnhancedVoiceCommand
          onResult={handleVoiceResult}
          size="lg"
          autoProcess={true}
          supportedLanguages={supportedLanguages}
          floating={false}
          alwaysShowControls={true}
          listenerTimeout={15000} // Extended listener timeout
        />
        
        {lastTranscript && (
          <Card className="mt-4 border border-primary/10 shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Last Command</h3>
                {processingComplete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleContinueProcessing}
                  >
                    Continue Process
                  </Button>
                )}
              </div>
              <p className="text-sm bg-muted/40 p-2 rounded-md">{lastTranscript}</p>
              
              {processedData && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Detected entities:</div>
                  <div className="flex flex-wrap gap-2">
                    {processedData.product && (
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800">
                        Product: {processedData.product}
                      </Badge>
                    )}
                    {processedData.quantity && (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800">
                        Qty: {processedData.quantity.value} {processedData.quantity.unit}
                      </Badge>
                    )}
                    {processedData.price && (
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800">
                        Price: ₹{processedData.price}
                      </Badge>
                    )}
                    {processedData.position && (
                      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800">
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

      {/* Product Image Picker Modal */}
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
