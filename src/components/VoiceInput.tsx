
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Check, X, Play, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ProductImagePicker from './ProductImagePicker';
import { translateHindi } from '@/lib/translationCache';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVoiceCommand from './ui-custom/EnhancedVoiceCommand';

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

  // Process voice command with the enhanced NLP capabilities
  const handleVoiceResult = async (text: string, data: any) => {
    setLastTranscript(text);
    
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
          // Try to fetch an image from DuckDuckGo
          await fetchProductImage(data.processed.product);
        }
        
        // Show image picker
        setImagePickerVisible(true);
      }
    }
    
    // Pass the command to parent component
    onCommand(text);
  };

  // Fetch product image from DuckDuckGo via edge function
  const fetchProductImage = async (productName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
        body: { 
          type: 'fetch_image', 
          data: productName 
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.imageUrl) {
        setInitialImage(data.imageUrl);
        return data.imageUrl;
      } else {
        // Fallback to Unsplash
        setInitialImage(`https://source.unsplash.com/100x100/?${encodeURIComponent(productName)}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching product image:', error);
      // Fallback to Unsplash
      setInitialImage(`https://source.unsplash.com/100x100/?${encodeURIComponent(productName)}`);
      return null;
    }
  };

  // Handle image confirmation
  const handleImageConfirmed = () => {
    setImagePickerVisible(false);
    toast.success(`Image confirmed for ${currentProduct}`);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-4">
        <EnhancedVoiceCommand
          onResult={handleVoiceResult}
          size="lg"
          autoProcess={true}
          supportedLanguages={supportedLanguages}
          floating={false}
        />
        
        {lastTranscript && (
          <Card className="mt-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Last Command</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    // Use browser's speech synthesis to read back the transcript
                    const utterance = new SpeechSynthesisUtterance(lastTranscript);
                    utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                  }}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm">{lastTranscript}</p>
              
              {processedData && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Detected entities:</div>
                  <div className="flex flex-wrap gap-2">
                    {processedData.product && (
                      <Badge variant="outline">
                        Product: {processedData.product}
                      </Badge>
                    )}
                    {processedData.quantity && (
                      <Badge variant="outline">
                        Qty: {processedData.quantity.value} {processedData.quantity.unit}
                      </Badge>
                    )}
                    {processedData.price && (
                      <Badge variant="outline">
                        Price: ₹{processedData.price}
                      </Badge>
                    )}
                    {processedData.position && (
                      <Badge variant="outline">
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
        />
      )}
    </div>
  );
}
