import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, Calendar, MapPin, Tag } from 'lucide-react';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { CommandResult } from '@/lib/voice';
import { toast } from 'sonner';
import { parseEnhancedVoiceCommand } from '@/utils/nlp/enhancedProductParser';

export interface VoiceCommandPopupProps {
  result?: CommandResult;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
}

export default function VoiceCommandPopup({
  result,
  onConfirm,
  onCancel,
  loading = false,
  onCommand,
  productList = []
}: VoiceCommandPopupProps) {
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState('');

  function handleListen() {
    setIsListening(true);
    setText('');
    
    try {
      // Check browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error("Speech recognition is not supported in your browser");
        setIsListening(false);
        return;
      }
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        setProcessing(true);
        
        setTimeout(() => {
          if (onCommand && productList) {
            // Process command with enhanced NLP
            const parseResult = parseEnhancedVoiceCommand(transcript, productList);
            onCommand(transcript, parseResult.products);
          }
          setProcessing(false);
          setIsListening(false);
        }, 1000);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast.error("Speech recognition error. Please try again.");
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
  }

  // Display component for recognition result or listening UI
  if (result) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center">
            {result.productName && (
              <div className="mb-4">
                <h3 className="text-lg font-medium">
                  {result.productName}
                </h3>
                {result.quantity && (
                  <p className="text-sm text-muted-foreground">
                    Quantity: {result.quantity.value} {result.quantity.unit}
                  </p>
                )}
                {result.position && (
                  <p className="text-sm text-muted-foreground">
                    Location: {result.position}
                  </p>
                )}
                {result.expiry && (
                  <p className="text-sm text-muted-foreground">
                    Expiry: {result.expiry}
                  </p>
                )}
                {result.price !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Price: ₹{result.price}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center">
          <Button
            onClick={handleListen}
            disabled={isListening || processing}
            variant="outline"
            size="lg"
            className="h-16 w-16 rounded-full relative"
          >
            {isListening ? (
              <MicOff className="h-6 w-6 text-red-500" />
            ) : processing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6 text-primary" />
            )}
          </Button>
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isListening ? "Listening..." : processing ? "Processing..." : "Tap to speak"}
          </p>
          
          {text && !isListening && !processing && (
            <div className="mt-4 w-full">
              <p className="text-xs font-medium">Recognized:</p>
              <p className="mt-1 text-sm bg-muted p-2 rounded">{text}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
