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

  // ▼▼▼ SIMPLE VOICE HANDLING ▼▼▼
  const handleListen = async () => {
    try {
      await listen();
      toast.success("Voice command processed!");
    } catch {
      toast.error("Please speak again");
    }
  };

  useEffect(() => {
    if (commandResult?.imageUrl) {
      setImageUrl(commandResult.imageUrl);
    }
  }, [commandResult]);
  // ▲▲▲ END OF CHANGES ▲▲▲

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
                    className="mt-2 rounded border"
                    style={{ maxWidth: '200px' }}
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
