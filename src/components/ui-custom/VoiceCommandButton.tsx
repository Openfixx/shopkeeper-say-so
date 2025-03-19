
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VoiceCommandButtonProps {
  onVoiceCommand: (command: string) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  label?: string;
  listenMessage?: string;
  pulseColor?: string;
  showDialog?: boolean;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  className,
  size = 'icon',
  variant = 'outline',
  label,
  listenMessage = 'Listening for command...',
  pulseColor,
  showDialog = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
          
          if (finalTranscript) {
            console.log("Voice command recognized:", finalTranscript);
            setTranscript(finalTranscript);
            setTranscriptHistory(prev => [...prev, finalTranscript]);
            onVoiceCommand(finalTranscript);
            setIsLoading(false);
            setIsListening(false);
            toast.success(`Command recognized: "${finalTranscript}"`);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsLoading(false);
          setIsListening(false);
          toast.error('Failed to recognize command');
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            // Attempt to restart recognition if it was still supposed to be active
            // This helps with browsers that automatically stop after silence
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Failed to restart recognition', error);
              setIsLoading(false);
              setIsListening(false);
            }
          } else {
            setIsLoading(false);
            setIsListening(false);
          }
        };
        
        setRecognition(recognitionInstance);
      }
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onVoiceCommand, isListening]);
  
  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
      setDialogOpen(false);
    } else {
      setIsLoading(true);
      try {
        recognition.start();
        setIsListening(true);
        if (showDialog) {
          setDialogOpen(true);
        }
        toast.info(listenMessage);
      } catch (error) {
        console.error('Speech recognition error', error);
        setIsLoading(false);
        toast.error('Failed to start voice recognition');
      }
    }
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    if (isListening) {
      recognition?.abort();
      setIsListening(false);
    }
  };
  
  return (
    <>
      <Button
        variant={isListening ? "default" : variant}
        size={size}
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
        
        {label && <span className="ml-2">{label}</span>}
        
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor || 'bg-primary-foreground'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${pulseColor || 'bg-primary-foreground'}`}></span>
          </span>
        )}
      </Button>
      
      {showDialog && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Mic className="h-5 w-5 mr-2 text-primary animate-pulse" />
                Voice Command
              </DialogTitle>
              <DialogDescription>
                Speak your command clearly. Try commands like "Add 5kg sugar on rack 3"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm mb-1">Current transcript:</p>
                <p className="text-sm">{transcript || "Listening..."}</p>
              </div>
              
              {transcriptHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Command history:</p>
                  <div className="max-h-36 overflow-y-auto space-y-2 text-sm">
                    {transcriptHistory.map((cmd, i) => (
                      <div key={i} className="p-2 rounded bg-muted/50">
                        {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setTranscriptHistory([])}>
                  Clear History
                </Button>
                <Button size="sm" onClick={closeDialog}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VoiceCommandButton;
