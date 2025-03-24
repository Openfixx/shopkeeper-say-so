
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Package2, Receipt, Search, X, Loader2, MapPin, Bell, Barcode, Store } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DashboardVoiceCommandsProps {
  onAddProduct: () => void;
  onCreateBill: () => void;
  onSearchProduct: (searchTerm: string) => void;
  onFindShops?: (searchTerm: string) => void;
  onScanBarcode?: () => void;
  onStockAlert?: (product: string) => void;
  onChangeShopType?: (type: string) => void;
}

const DashboardVoiceCommands: React.FC<DashboardVoiceCommandsProps> = ({
  onAddProduct,
  onCreateBill,
  onSearchProduct,
  onFindShops,
  onScanBarcode,
  onStockAlert,
  onChangeShopType,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  
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
            setCommandHistory(prev => [...prev, finalTranscript]);
            processVoiceCommand(finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setIsProcessing(false);
          toast.error('Failed to recognize command');
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            // Try to restart recognition if it was stopped by browser
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Failed to restart recognition', error);
              setIsListening(false);
              setIsProcessing(false);
            }
          } else {
            setIsListening(false);
            setIsProcessing(false);
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
  }, [isListening]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
      setShowCommandDialog(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        setIsExpanded(true);
        setShowCommandDialog(true);
        toast.info(
          'Listening... Try commands like "Add product", "Create bill", or "Find sugar"'
        );
      } catch (error) {
        console.error('Speech recognition error', error);
        setIsListening(false);
        setIsProcessing(false);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    setIsProcessing(true);
    
    try {
      console.log("Processing command:", command);
      const recognizedCommand = detectCommandType(command);
      console.log("Recognized command type:", recognizedCommand.type);
      
      switch (recognizedCommand.type) {
        case VOICE_COMMAND_TYPES.ADD_PRODUCT:
          onAddProduct();
          toast.success('Opening add product page');
          break;
        case VOICE_COMMAND_TYPES.CREATE_BILL:
          onCreateBill();
          toast.success('Creating new bill');
          break;
        case VOICE_COMMAND_TYPES.SEARCH_PRODUCT:
          if (recognizedCommand.data?.searchTerm) {
            onSearchProduct(recognizedCommand.data.searchTerm);
            toast.success(`Searching for "${recognizedCommand.data.searchTerm}"`);
          } else {
            toast.warning('Please specify what to search for');
          }
          break;
        case VOICE_COMMAND_TYPES.FIND_SHOPS:
          if (onFindShops) {
            const searchTerm = recognizedCommand.data?.product || '';
            onFindShops(searchTerm);
            navigate('/shop-finder');
            toast.success('Finding nearby shops');
          } else {
            navigate('/shop-finder');
            toast.success('Opening shop finder');
          }
          break;
        case VOICE_COMMAND_TYPES.SCAN_BARCODE:
          if (onScanBarcode) {
            onScanBarcode();
            toast.success('Opening barcode scanner');
          } else {
            navigate('/products');
            toast.success('Going to products page to scan barcode');
          }
          break;
        case VOICE_COMMAND_TYPES.STOCK_ALERT:
          if (onStockAlert && recognizedCommand.data?.product) {
            onStockAlert(recognizedCommand.data.product);
            toast.success(`Setting stock alert for ${recognizedCommand.data.product}`);
          } else {
            navigate('/inventory');
            toast.success('Going to inventory to set stock alerts');
          }
          break;
        case VOICE_COMMAND_TYPES.CHANGE_SHOP_TYPE:
          if (onChangeShopType && recognizedCommand.data?.type) {
            onChangeShopType(recognizedCommand.data.type);
            toast.success(`Changing shop type to ${recognizedCommand.data.type}`);
          } else {
            navigate('/settings');
            toast.success('Going to settings to change shop type');
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
      // Reset after 3 seconds if not in dialog mode
      if (!showCommandDialog) {
        setTimeout(() => {
          setTranscript('');
          setIsExpanded(false);
        }, 3000);
      }
    }
  };

  const cardVariants = {
    collapsed: { width: 'auto', height: 'auto', opacity: 0 },
    expanded: { width: 'auto', height: 'auto', opacity: 1 }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-4">
      {/* Voice Command Dialog */}
      <Dialog open={showCommandDialog} onOpenChange={setShowCommandDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-primary animate-pulse" />
              Voice Commands
            </DialogTitle>
            <DialogDescription>
              Speak one of the commands below or try your own command
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium text-sm mb-1">Current transcript:</p>
              <p className="text-sm">{transcript || "Listening..."}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Package2 className="h-4 w-4 text-primary" />
                <span className="text-sm">"Add product" - Add a new product</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="text-sm">"Create bill" / "Bill banao" - Start a new bill</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm">"Find [product]" - Search for a product</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">"Find shops with [product]" - Locate nearby shops</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Barcode className="h-4 w-4 text-primary" />
                <span className="text-sm">"Scan barcode" - Open barcode scanner</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm">"Alert when [product] is below [quantity]" - Set stock alert</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-background border">
                <Store className="h-4 w-4 text-primary" />
                <span className="text-sm">"Change shop type to [type]" - Update shop category</span>
              </div>
            </div>
            
            {commandHistory.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Command history:</p>
                <div className="max-h-36 overflow-y-auto space-y-2 text-sm">
                  {commandHistory.map((cmd, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50">
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setCommandHistory([])}>
                Clear History
              </Button>
              <Button size="sm" onClick={() => {
                setShowCommandDialog(false);
                if (isListening) {
                  recognition?.abort();
                  setIsListening(false);
                }
              }}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AnimatePresence>
        {isExpanded && !showCommandDialog && (
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
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>"Find shops" - Locate nearby shops</span>
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
