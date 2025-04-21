
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  className?: string;
  onCommand?: (command: string) => void;
}

export default function VoiceInput({ className, onCommand }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [productName, setProductName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleListen = async () => {
    try {
      setIsListening(true);
      toast.info("Listening...");
      
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
        
        if (onCommand) {
          onCommand(transcript);
        }
        
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
  
  // Basic text processing to extract product information
  const processText = (command: string) => {
    // Simple regex to extract product name
    const productMatch = command.match(/(?:add|create)\s+(\d+(?:\.\d+)?)\s*(?:kg|g|ml|l|pieces?|pcs|units?)?\s*(?:of)?\s*(.+?)(?=\s+(?:to|at|in|for|price|\$|₹|\d+)|\s*$)/i);
    
    if (productMatch && productMatch[2]) {
      const extractedName = productMatch[2].trim();
      setProductName(extractedName);
      
      // Simulate getting an image for the product
      setImageUrl(`https://source.unsplash.com/100x100/?${encodeURIComponent(extractedName)}`);
    } else {
      // Fallback to a simple word after "add" or the first few words
      const fallbackMatch = command.match(/(?:add|create)\s+(.{3,30}?)(?=\s+|\s*$)/i);
      if (fallbackMatch && fallbackMatch[1]) {
        setProductName(fallbackMatch[1].trim());
        setImageUrl(`https://source.unsplash.com/100x100/?${encodeURIComponent(fallbackMatch[1].trim())}`);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Button
        onClick={handleListen}
        disabled={isListening}
        variant={isListening ? "destructive" : "default"}
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

      {text && (
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">You Said:</h3>
            <p className="text-sm bg-muted p-2 rounded">{text}</p>
            
            {productName && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge>Product: {productName}</Badge>
                </div>
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt={productName}
                    className="mt-2 rounded border w-full max-w-[100px] h-auto"
                    style={{ maxWidth: '100px' }}
                    onError={() => {
                      toast.error("Image failed to load");
                      setImageUrl(`https://placehold.co/100x100?text=${encodeURIComponent(productName)}`);
                    }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
