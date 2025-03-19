
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Package2, Receipt, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';

interface DashboardVoiceCommandsProps {
  onAddProduct: () => void;
  onCreateBill: () => void;
  onSearchProduct: (searchTerm: string) => void;
}

const DashboardVoiceCommands: React.FC<DashboardVoiceCommandsProps> = ({
  onAddProduct,
  onCreateBill,
  onSearchProduct,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
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
            setTranscript(finalTranscript);
            processVoiceCommand(finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Failed to recognize command');
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      }
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        setIsExpanded(true);
        toast.info(
          'Listening... Try commands like "Add product", "Create bill", or "Find sugar"'
        );
      } catch (error) {
        console.error('Speech recognition error', error);
        setIsListening(false);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    setIsProcessing(true);
    
    try {
      const recognizedCommand = detectCommandType(command);
      
      switch (recognizedCommand.type) {
        case VOICE_COMMAND_TYPES.ADD_PRODUCT:
          onAddProduct();
          break;
        case VOICE_COMMAND_TYPES.CREATE_BILL:
          onCreateBill();
          break;
        case VOICE_COMMAND_TYPES.SEARCH_PRODUCT:
          if (recognizedCommand.data?.searchTerm) {
            onSearchProduct(recognizedCommand.data.searchTerm);
          } else {
            toast.warning('Please specify what to search for');
          }
          break;
        default:
          toast.info(`Command not recognized: "${command}"`);
          break;
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Error processing voice command');
    } finally {
      setIsProcessing(false);
      // Reset after 3 seconds
      setTimeout(() => {
        setTranscript('');
        setIsExpanded(false);
      }, 3000);
    }
  };

  const cardVariants = {
    collapsed: { width: 'auto', height: 'auto', opacity: 0 },
    expanded: { width: 'auto', height: 'auto', opacity: 1 }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-4">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={cardVariants}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-64 shadow-lg">
              <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Voice Commands</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-xs space-y-2">
                {transcript ? (
                  <div className="py-2 px-3 bg-muted rounded-md">
                    <p className="font-medium">Transcript:</p>
                    <p>{transcript}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Package2 className="h-3 w-3 text-primary" />
                      <span>"Add product" - Add a new product</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-3 w-3 text-primary" />
                      <span>"Create bill" - Start a new bill</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Search className="h-3 w-3 text-primary" />
                      <span>"Find [product]" - Search for a product</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          ref={buttonRef}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-lg",
            isListening && "bg-red-500 hover:bg-red-600"
          )}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
          
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardVoiceCommands;
