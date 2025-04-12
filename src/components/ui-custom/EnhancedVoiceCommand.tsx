
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Volume, TextSelect, Loader2, RefreshCw, Check, 
  X, Info, VolumeX, BarChart2, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { translateHindi } from '@/lib/translationCache';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedVoiceCommandProps {
  onResult?: (text: string, processedData: any) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTranscript?: boolean;
  autoProcess?: boolean;
  supportedLanguages?: string[];
  processCommand?: boolean;
  listenerTimeout?: number; // auto-stop after this many milliseconds
  floating?: boolean;
}

const EnhancedVoiceCommand: React.FC<EnhancedVoiceCommandProps> = ({
  onResult,
  className,
  size = 'md',
  showTranscript = true,
  autoProcess = true,
  supportedLanguages = ['en-US', 'hi-IN'],
  processCommand = true,
  listenerTimeout = 10000,
  floating = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processedData, setProcessedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState(supportedLanguages[0]);
  const [confidence, setConfidence] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { addProduct } = useInventory();
  const navigate = useNavigate();

  // Button size based on the size prop
  const buttonSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognition.current = new SpeechRecognitionAPI();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = language;
        
        recognition.current.onstart = () => {
          setIsListening(true);
          setError(null);
          
          // Set a timeout to automatically stop listening
          if (listenerTimeout > 0) {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => {
              stopListening();
            }, listenerTimeout);
          }
        };
        
        recognition.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              // Update confidence with the latest result
              setConfidence(event.results[i][0].confidence * 100);
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            
            // Reset timeout as we got results
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
              timeoutRef.current = window.setTimeout(() => {
                stopListening();
              }, listenerTimeout);
            }
            
            // Auto process if enabled
            if (autoProcess) {
              processTranscript(finalTranscript);
            }
          } else if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };
        
        recognition.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(`Recognition error: ${event.error}`);
          setIsListening(false);
          
          if (event.error === 'no-speech') {
            toast.warning("No speech detected. Please try again.");
          } else if (event.error === 'network') {
            toast.error("Network error. Please check your connection.");
          } else {
            toast.error(`Speech recognition error: ${event.error}`);
          }
        };
        
        recognition.current.onend = () => {
          setIsListening(false);
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };
      }
    }
    
    return () => {
      stopListening();
    };
  }, [language, autoProcess, listenerTimeout]);

  const startListening = () => {
    if (!recognition.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    try {
      setTranscript('');
      setProcessedData(null);
      setError(null);
      setIsExpanded(true);
      recognition.current.lang = language;
      recognition.current.start();
      toast.info(`Listening in ${language === 'hi-IN' ? 'Hindi' : 'English'}... Say something`);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleLanguage = () => {
    // Cycle through supported languages
    const currentIndex = supportedLanguages.indexOf(language);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    setLanguage(supportedLanguages[nextIndex]);
    
    if (isListening) {
      stopListening();
      
      // Give a small delay before restarting with new language
      setTimeout(() => {
        if (recognition.current) {
          recognition.current.lang = supportedLanguages[nextIndex];
          startListening();
        }
      }, 300);
    }
  };

  const processTranscript = async (text: string) => {
    if (!text || !processCommand) return;
    
    setIsProcessing(true);
    try {
      // Try to detect Hindi text and translate if needed
      const isHindi = /[\u0900-\u097F]/.test(text);
      const processedText = isHindi ? await translateHindi(text) : text;

      // Process with NLP edge function
      const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
        body: { type: 'text', data: processedText, language }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        setProcessedData(data);
        
        // Auto-handle the command based on processed data
        if (data.processed) {
          const { product, quantity, position, price, expiryDate, command } = data.processed;
          
          // If we have a product name and a command to add
          if (product && command && (command.includes('add') || command.includes('जोड़'))) {
            const productData = {
              name: product,
              quantity: quantity?.value || 1,
              unit: quantity?.unit || 'pcs',
              position: position || '',
              price: price || 0,
              expiry: expiryDate || '',
              image: data.imageUrl || '',
            };
            
            addProduct(productData);
            toast.success(`Added ${product} to inventory`);
            navigate('/products');
          }
        }
        
        // Pass the result to the parent component if callback provided
        if (onResult) {
          onResult(text, data);
        }
      } else {
        // Handle error
        toast.error('Failed to process speech command');
      }
    } catch (error: any) {
      console.error('Error processing transcript:', error);
      setError(error.message || 'Error processing speech');
      toast.error('Error processing speech: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const mainButtonSize = buttonSizeClasses[size];
  
  const buttonVariants = {
    idle: { scale: 1 },
    listening: { 
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2 }
    }
  };

  // Determine confidence level classes
  const getConfidenceClass = () => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("relative", className, floating && "fixed bottom-8 right-8 z-50")}>
      {showTranscript && (isListening || transcript || isProcessing) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={cn("absolute bottom-full mb-2 w-64 right-0")}
          >
            <Card className="shadow-lg">
              <CardContent className="p-3 space-y-2">
                {isListening && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-muted-foreground">Listening in {language === 'hi-IN' ? 'Hindi' : 'English'}</span>
                  </div>
                )}
                
                <div className="min-h-[40px] text-sm">
                  {transcript || (isListening ? 'Listening...' : '')}
                </div>
                
                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </div>
                )}
                
                {confidence > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <BarChart2 className="h-3 w-3 text-muted-foreground" />
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${getConfidenceClass()}`} 
                        style={{ width: `${confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground">{confidence.toFixed(0)}%</span>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <Info className="h-3 w-3" />
                    {error}
                  </div>
                )}
                
                {processedData?.processed && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs font-medium mb-1">Detected:</div>
                    <div className="flex flex-wrap gap-1">
                      {processedData.processed.product && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                          Product: {processedData.processed.product}
                        </Badge>
                      )}
                      {processedData.processed.quantity && (
                        <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                          Qty: {processedData.processed.quantity.value} {processedData.processed.quantity.unit}
                        </Badge>
                      )}
                      {processedData.processed.price && (
                        <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950">
                          ₹{processedData.processed.price}
                        </Badge>
                      )}
                      {processedData.processed.position && (
                        <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950">
                          {processedData.processed.position}
                        </Badge>
                      )}
                      {processedData.processed.command && (
                        <Badge variant="outline" className="text-xs bg-rose-50 dark:bg-rose-950">
                          {processedData.processed.command}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-1 pt-1">
                  {transcript && !isListening && (
                    <Button 
                      type="button" 
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        if (!isProcessing) {
                          processTranscript(transcript);
                        }
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    type="button" 
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setTranscript('');
                      setProcessedData(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
      
      <div className="flex items-center gap-2">
        <motion.div
          variants={buttonVariants}
          animate={isListening ? "listening" : "idle"}
        >
          <Button 
            type="button" 
            size="icon"
            className={cn(
              "rounded-full shadow-md",
              mainButtonSize,
              isListening 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-primary"
            )}
            onClick={toggleListening}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className={cn("animate-spin", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />
            ) : isListening ? (
              <Mic className={cn(size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <MicOff className={cn(size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />
            )}
          </Button>
        </motion.div>
        
        {isExpanded && (
          <AnimatePresence>
            <motion.div 
              className="flex items-center gap-1"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={toggleLanguage}
                title={`Change language (current: ${language === 'hi-IN' ? 'Hindi' : 'English'})`}
              >
                <TextSelect className="h-4 w-4" />
              </Button>
              
              <Button 
                type="button"
                size="icon"
                variant={transcript ? "outline" : "ghost"}
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  if (transcript) {
                    // Use browser's speech synthesis to read back the transcript
                    const utterance = new SpeechSynthesisUtterance(transcript);
                    utterance.lang = language;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                disabled={!transcript}
                title="Read transcript aloud"
              >
                {transcript ? <Volume className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default EnhancedVoiceCommand;
