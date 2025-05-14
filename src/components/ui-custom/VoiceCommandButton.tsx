
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface VoiceCommandButtonProps {
  onCommand?: (command: string) => void;
  onVoiceCommand?: (command: string) => void;  // Adding this prop for backward compatibility
  className?: string;
  compact?: boolean;
  showDialog?: boolean;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
}

export default function VoiceCommandButton({ 
  onCommand, 
  onVoiceCommand,
  className = '', 
  compact = false,
  showDialog = false,
  label = "Voice Command",
  variant = "secondary",
  size = compact ? "sm" : "default"
}: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState('');

  return (
    <div className={`${className}`}>
      <Button
        variant={variant}
        onClick={startListening}
        disabled={isListening || processing}
        size={size}
        className="relative flex items-center gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Listening...
          </>
        ) : processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      
      {text && !isListening && !processing && (
        <div className="mt-2 text-sm">
          <p className="font-medium">Recognized: </p>
          <p className="bg-muted p-2 rounded">{text}</p>
        </div>
      )}
    </div>
  );

  function startListening() {
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
          if (onCommand) {
            onCommand(transcript);
          } else if (onVoiceCommand) {
            onVoiceCommand(transcript);
          }
          setProcessing(false);
        }, 500);
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
}
