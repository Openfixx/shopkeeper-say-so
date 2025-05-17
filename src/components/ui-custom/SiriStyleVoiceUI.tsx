import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Mic, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';
import VoiceCommandPopup from './VoiceCommandPopup';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';
import { VoiceProduct } from '@/types/voice';

interface SiriStyleVoiceUIProps {
  onCommand: (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => void;
  className?: string;
}

const SiriStyleVoiceUI: React.FC<SiriStyleVoiceUIProps> = ({ onCommand, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setTranscript('');
        };
        
        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interimTranscript += event.results[i][0].transcript;
          }
          setTranscript(interimTranscript);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          setShowAssistant(false);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setShowAssistant(false);
          
          switch (event.error) {
            case 'not-allowed':
              setError('Microphone access was denied. Please allow microphone access in your browser settings.');
              break;
            case 'no-speech':
              setError('No speech was detected. Please try speaking again.');
              break;
            case 'network':
              setError('Network error. Please check your internet connection.');
              break;
            default:
              setError('An unknown error occurred during speech recognition.');
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition is not supported in your browser.');
      }
    };
    
    initializeSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setShowAssistant(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError('Failed to start speech recognition. Please try again.');
      setShowAssistant(false);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsProcessing(true);
      recognitionRef.current.abort();
      setIsListening(false);
      setShowAssistant(false);
      
      // Process the command after a short delay to allow the transcript to update
      setTimeout(() => {
        processCommand(transcript);
        setIsProcessing(false);
      }, 500);
    }
  };
  
  const processCommand = (command: string) => {
    if (!command.trim()) {
      toast({
        title: "No Input",
        description: "No voice input detected. Please try again.",
        variant: "warning"
      });
      return;
    }
    
    // Basic parsing logic - can be expanded
    const words = command.toLowerCase().split(' ');
    let processedProduct: { name: string, quantity?: number, unit?: string } = { name: '' };
    
    if (words.includes('add')) {
      const productName = words.slice(words.indexOf('add') + 1).join(' ');
      processedProduct.name = productName;
    } else if (words.includes('search') || words.includes('find')) {
      const productName = words.slice(words.indexOf('search') + 1).join(' ');
      processedProduct.name = productName;
    }
    
    onCommand(command, processedProduct);
    setTranscript('');
  };
  
  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };
  
  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center backdrop-blur-md z-50"
          >
            <Card className="relative p-6 w-full max-w-md bg-secondary text-secondary-foreground shadow-md">
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
        onClick={startListening}
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
