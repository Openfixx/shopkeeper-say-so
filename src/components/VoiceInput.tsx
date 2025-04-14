
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVoiceRecognition } from '@/lib/voice';

export default function VoiceInput({ className }: { className?: string }) {
  const { text, isListening, listen, commandResult } = useVoiceRecognition();
  const [imageUrl, setImageUrl] = useState('');

  const handleListen = async () => {
    try {
      toast.info("Listening...");
      await listen();
      toast.success("Voice command processed!");
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error("Voice recognition failed. Please try again.");
    }
  };

  useEffect(() => {
    if (commandResult?.imageUrl) {
      setImageUrl(commandResult.imageUrl);
    }
  }, [commandResult]);

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

      {text && (
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">You Said:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{text}</p>
            
            {commandResult && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge>Product: {commandResult.productName}</Badge>
                </div>
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt={commandResult.productName}
                    className="mt-2 rounded border w-full max-w-[200px] h-auto"
                    style={{ maxWidth: '200px' }}
                    onError={() => {
                      toast.error("Image failed to load");
                      setImageUrl(`https://placehold.co/300x300?text=${encodeURIComponent(commandResult.productName)}`);
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
