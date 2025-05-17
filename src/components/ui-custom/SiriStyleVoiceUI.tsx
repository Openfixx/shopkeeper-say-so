
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Mic, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';

interface SiriStyleVoiceUIProps {
  onCommand?: (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => void;
  className?: string;
}

const SiriStyleVoiceUI: React.FC<SiriStyleVoiceUIProps> = ({ className, onCommand }) => {
  const {
    isListening,
    transcript,
    error,
    isProcessing,
    startListening,
    stopListening
  } = useVoiceRecognition();
  
  const [showAssistant, setShowAssistant] = React.useState(false);
  
  // Show assistant when listening starts
  React.useEffect(() => {
    setShowAssistant(isListening);
  }, [isListening]);
  
  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
          >
            <Card className="relative p-6 w-full max-w-md mx-4 bg-secondary text-secondary-foreground shadow-md">
              {error && (
                <Badge variant="destructive" className="mb-4">{error}</Badge>
              )}
              <div className="flex items-center justify-center mb-4">
                <Wand2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                <h3 className="text-lg font-semibold">Listening...</h3>
              </div>
              <p className="text-center text-muted-foreground">{transcript || 'Say something...'}</p>
              <Button
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={stopListening}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        variant="outline"
        className="w-full h-12 relative"
        onClick={() => {
          startListening();
          setShowAssistant(true);
        }}
        disabled={isListening || isProcessing}
      >
        <Mic className="mr-2 h-4 w-4" />
        {isProcessing ? 'Processing...' : 'Start Voice Command'}
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        )}
      </Button>
    </div>
  );
};

export default SiriStyleVoiceUI;
