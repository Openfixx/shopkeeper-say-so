
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, Loader2, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceProduct } from '@/types/voice';
import { voiceCommandService, VoiceCommandListeners } from '@/services/VoiceCommandService';

export interface ImprovedVoiceCommandProps {
  onCommand?: (command: string, products: VoiceProduct[]) => void;
  onClose?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'floating' | 'minimal';
  showTranscript?: boolean;
  autoProcess?: boolean;
}

export const ImprovedVoiceCommand: React.FC<ImprovedVoiceCommandProps> = ({ 
  onCommand,
  onClose,
  className,
  variant = 'default',
  showTranscript = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<VoiceProduct[]>([]);
  
  // Configure listeners for the voice service
  useEffect(() => {
    const listeners: VoiceCommandListeners = {
      onStart: () => {
        setIsListening(true);
        setTranscript('');
      },
      onResult: (text, detectedProducts) => {
        setTranscript(text);
        setProducts(detectedProducts);
        
        if (onCommand) {
          onCommand(text, detectedProducts);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (error) => {
        console.error("Voice command error:", error);
        setIsListening(false);
      },
      onProcessing: (processing) => {
        setIsProcessing(processing);
      }
    };
    
    voiceCommandService.setListeners(listeners);
    
    return () => {
      // Clean up by setting empty listeners
      voiceCommandService.setListeners({});
    };
  }, [onCommand]);
  
  const startListening = useCallback(() => {
    setProducts([]);
    voiceCommandService.start();
  }, []);
  
  const stopListening = useCallback(() => {
    voiceCommandService.stop();
  }, []);
  
  const handleCancel = useCallback(() => {
    voiceCommandService.abort();
    setIsOpen(false);
    setTranscript('');
    setProducts([]);
    
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // Render different variants based on the variant prop
  if (variant === 'minimal') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className={cn("p-2", className)}
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }
  
  if (variant === 'inline') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={cn("flex items-center gap-2", className)}
      >
        <Mic className="h-4 w-4" />
        Voice Command
      </Button>
    );
  }
  
  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="icon"
          className={cn("fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg", className)}
        >
          <Mic className="h-5 w-5" />
        </Button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <Card className="w-full max-w-md mx-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    Voice Command
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant={isListening ? "destructive" : "default"}
                      size="lg"
                      className="w-full"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Listening
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Listening
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {transcript && showTranscript && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> You said:
                      </p>
                      <p className={cn("text-sm", isListening && "animate-pulse")}>
                        {transcript}
                      </p>
                    </div>
                  )}
                  
                  {products.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Detected Products:</p>
                      {products.map((product, index) => (
                        <div 
                          key={index}
                          className="p-2 border rounded flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.position && (
                              <p className="text-xs text-muted-foreground">
                                Location: {product.position}
                              </p>
                            )}
                          </div>
                          <Badge>
                            {product.quantity} {product.unit}
                          </Badge>
                        </div>
                      ))}
                      
                      <div className="pt-4 flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
  
  // Default variant 
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Voice Command</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant={isListening ? "destructive" : "default"}
            className="w-full"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Listening
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>
        </div>
        
        {transcript && showTranscript && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">You said:</p>
            <p className={cn("text-sm", isListening && "animate-pulse")}>
              {transcript}
            </p>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Detected Products:</p>
            {products.map((product, index) => (
              <div 
                key={index}
                className="p-2 border rounded flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  {product.position && (
                    <p className="text-xs text-muted-foreground">
                      Location: {product.position}
                    </p>
                  )}
                </div>
                <Badge>
                  {product.quantity} {product.unit}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovedVoiceCommand;
