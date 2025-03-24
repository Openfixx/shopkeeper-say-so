
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';

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
  const [interpretedCommand, setInterpretedCommand] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  
  // Supported languages
  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ar-SA', name: 'Arabic' },
  ];
  
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = selectedLanguage;
        
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
            
            // Process any command directly without requiring specific command prefixes
            const commandInfo = detectCommandType(finalTranscript);
            
            // Set interpreted command for display
            let interpretedMsg = '';
            switch(commandInfo.type) {
              case VOICE_COMMAND_TYPES.ADD_PRODUCT:
                interpretedMsg = 'Adding product';
                if (commandInfo.data?.name) {
                  interpretedMsg += `: ${commandInfo.data.name}`;
                }
                if (commandInfo.data?.quantity) {
                  interpretedMsg += ` (${commandInfo.data.quantity}${commandInfo.data.unit || ''})`;
                }
                break;
              case VOICE_COMMAND_TYPES.CREATE_BILL:
                interpretedMsg = 'Creating bill';
                if (commandInfo.data?.items?.length) {
                  interpretedMsg += ` with ${commandInfo.data.items.length} item(s)`;
                }
                break;
              case VOICE_COMMAND_TYPES.SEARCH_PRODUCT:
                interpretedMsg = 'Searching for';
                if (commandInfo.data?.searchTerm) {
                  interpretedMsg += `: ${commandInfo.data.searchTerm}`;
                }
                break;
              case VOICE_COMMAND_TYPES.FIND_SHOPS:
                interpretedMsg = 'Finding nearby shops';
                if (commandInfo.data?.product) {
                  interpretedMsg += ` for ${commandInfo.data.product}`;
                }
                break;
              case VOICE_COMMAND_TYPES.SCAN_BARCODE:
                interpretedMsg = 'Opening barcode scanner';
                break;
              case VOICE_COMMAND_TYPES.STOCK_ALERT:
                interpretedMsg = 'Setting stock alert';
                if (commandInfo.data?.product) {
                  interpretedMsg += ` for ${commandInfo.data.product}`;
                }
                break;
              case VOICE_COMMAND_TYPES.CHANGE_SHOP_TYPE:
                interpretedMsg = 'Changing shop type';
                if (commandInfo.data?.type) {
                  interpretedMsg += ` to ${commandInfo.data.type}`;
                }
                break;
              default:
                interpretedMsg = 'Processing command';
            }
            setInterpretedCommand(interpretedMsg);
            
            // Pass the command to the handler
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
  }, [onVoiceCommand, isListening, selectedLanguage]);
  
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
        recognition.lang = selectedLanguage;
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
  
  const changeLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    toast.info(`Language changed to ${supportedLanguages.find(lang => lang.code === langCode)?.name || langCode}`);
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
                Speak your command clearly. Simply say what you need, and I'll understand.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {supportedLanguages.map(lang => (
                  <Button
                    key={lang.code}
                    size="sm"
                    variant={selectedLanguage === lang.code ? "default" : "outline"}
                    onClick={() => changeLanguage(lang.code)}
                    className="text-xs py-1 h-8"
                  >
                    {lang.name}
                  </Button>
                ))}
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm mb-1">Current transcript:</p>
                <p className="text-sm">{transcript || "Listening..."}</p>
              </div>
              
              {interpretedCommand && (
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-sm mb-1">Interpretation:</p>
                  <p className="text-sm">{interpretedCommand}</p>
                </div>
              )}
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm mb-2">Try saying:</p>
                <ul className="text-sm space-y-1.5">
                  <li>"Add 10kg rice to rack 3 expiry July 2025"</li>
                  <li>"5kg sugar bill" (creates a bill with sugar)</li>
                  <li>"Find shops with rice within 5km"</li>
                  <li>"Scan barcode" (opens scanner)</li>
                  <li>"Alert when sugar is below 5kg"</li>
                  <li>"Change shop type to Electronics"</li>
                  <li>"Where is the salt?"</li>
                  <li>"चीनी 5 किलो" (Hindi for "5kg sugar")</li>
                </ul>
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
                <Button variant="outline" size="sm" onClick={() => {
                  setTranscriptHistory([]);
                  setInterpretedCommand(null);
                }}>
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
