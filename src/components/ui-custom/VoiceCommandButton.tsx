
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceCommandButtonProps {
  onVoiceCommand: (command: string) => void;
  className?: string;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const command = event.results[0][0].transcript;
        onVoiceCommand(command);
        setIsLoading(false);
        setIsListening(false);
        toast.success(`Command recognized: "${command}"`);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsLoading(false);
        setIsListening(false);
        toast.error('Failed to recognize command');
      };
      
      recognitionInstance.onend = () => {
        setIsLoading(false);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onVoiceCommand]);
  
  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
    } else {
      setIsLoading(true);
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error', error);
        setIsLoading(false);
        toast.error('Failed to start voice recognition');
      }
    }
  };
  
  return (
    <Button
      variant={isListening ? "default" : "outline"}
      size="icon"
      className={cn(
        'relative', 
        isListening && 'bg-primary',
        className
      )}
      onClick={toggleListening}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isListening ? (
        <Mic className="h-5 w-5" />
      ) : (
        <MicOff className="h-5 w-5" />
      )}
      
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground"></span>
        </span>
      )}
    </Button>
  );
};

export default VoiceCommandButton;
