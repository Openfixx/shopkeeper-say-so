
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';
import { useVoiceStore } from '@/store/voiceStore';
import { VoiceProduct } from '@/types/voice';

export function useVoiceRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const {
    isListening,
    transcript,
    error,
    isProcessing,
    setIsListening,
    setTranscript,
    setError,
    setIsProcessing,
    addProducts
  } = useVoiceStore();
  
  // Initialize speech recognition
  useEffect(() => {
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
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
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
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setIsListening, setError, setTranscript]);
  
  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsProcessing(true);
      recognitionRef.current.abort();
      setIsListening(false);
      
      // Process the command after a short delay to allow the transcript to update
      setTimeout(() => {
        processCommand(transcript);
        setIsProcessing(false);
      }, 500);
    }
  };
  
  const processCommand = (command: string) => {
    if (!command.trim()) {
      toast.warning("No voice input detected. Please try again.");
      return;
    }
    
    try {
      // Process multi-product commands
      const products = parseMultipleProducts(command);
      
      if (products.length > 0) {
        // Add products to store
        addProducts(products);
      } else {
        toast.warning("Could not detect any products in your command. Try saying 'add 2kg sugar'");
      }
      
      setTranscript('');
    } catch (error) {
      console.error('Error processing command:', error);
      toast.error('Failed to process voice command. Please try again.');
    }
  };
  
  return {
    isListening,
    transcript,
    error,
    isProcessing,
    startListening,
    stopListening
  };
}
