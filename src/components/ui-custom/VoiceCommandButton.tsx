
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceStore } from '@/store/voiceStore';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';

interface VoiceCommandButtonProps {
  onVoiceCommand?: (command: string) => void;
  showDialog?: boolean;
  label?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  showDialog = false,
  label = 'Voice',
  variant = 'default',
  size = 'default'
}) => {
  const [isListening, setIsListening] = useState(false);
  
  const handleVoiceCommand = async () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    
    try {
      setIsListening(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        toast.info("Listening... Speak your command");
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onVoiceCommand) {
          onVoiceCommand(transcript);
        }
        toast.success("Command received!");
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Failed to recognize speech");
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } catch (error) {
      console.error("Voice command error:", error);
      toast.error("Failed to start voice recognition");
      setIsListening(false);
    }
  };
  
  return (
    <Button
      onClick={handleVoiceCommand}
      disabled={isListening}
      variant={isListening ? "destructive" : variant}
      size={size}
      className="flex items-center gap-2"
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {label}
    </Button>
  );
};

export default VoiceCommandButton;
