
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCommandButtonProps {
  onVoiceCommand: (command: string) => void;
  showDialog?: boolean;
  label?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onVoiceCommand,
  showDialog = false,
  label = '',
  variant = 'secondary',
  size = 'icon',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setRecordingTime(0);
    
    if (showDialog) {
      setIsOpen(true);
    }
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Simulate recording with a timeout to get transcript
    setTimeout(() => {
      const randomCommands = [
        'Add 10 kg rice to inventory',
        'Show me all low stock products',
        'Create a new bill for customer John',
        'Search for sugar in inventory',
        'Add a new supplier called Global Foods',
        'Show me sales report for this month'
      ];
      
      const randomCommand = randomCommands[Math.floor(Math.random() * randomCommands.length)];
      setTranscript(randomCommand);
    }, 3000);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (transcript) {
      onVoiceCommand(transcript);
    }
    
    // Close dialog after a short delay to allow user to see the transcript
    if (showDialog) {
      setTimeout(() => {
        setIsOpen(false);
        setTranscript('');
      }, 1000);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <>
      <Button
        variant={isRecording ? 'destructive' : variant}
        size={size}
        onClick={handleButtonClick}
        className={size === 'icon' ? 'rounded-full w-9 h-9 relative' : ''}
      >
        {isRecording ? (
          <>
            <MicOff className={size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
            {size !== 'icon' && (label || 'Stop')}
            <AnimatePresence>
              {isRecording && !showDialog && (
                <motion.span
                  className="absolute -right-1 -top-1 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] h-5 w-5 font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {recordingTime}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <Mic className={size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
            {size !== 'icon' && (label || 'Voice Command')}
          </>
        )}
      </Button>
      
      {showDialog && (
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open && isRecording) {
            stopRecording();
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Voice Command</DialogTitle>
              <DialogDescription>
                Speak your command clearly
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              {isRecording && (
                <div className="voice-waveform relative w-full max-w-xs h-16 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center space-x-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="waveform-line w-1.5 bg-violet-400/60 rounded-full"
                        style={{
                          height: '40%',
                          animationDelay: `${i * 0.05}s`
                        }}
                        animate={{
                          height: ['40%', `${Math.random() * 60 + 20}%`, '40%']
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center">
                {isRecording ? (
                  <div className="flex items-center justify-center mb-4 text-lg font-medium">
                    Recording <span className="ml-2 font-mono">{formatTime(recordingTime)}</span>
                  </div>
                ) : (
                  transcript && (
                    <div className="mb-4">
                      <p className="font-medium mb-1">Transcript:</p>
                      <p className="text-muted-foreground">{transcript}</p>
                    </div>
                  )
                )}
              </div>
              
              <div className="relative">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  className={`h-16 w-16 rounded-full ${isRecording ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
                
                {isRecording && (
                  <motion.div 
                    className="absolute -inset-2 rounded-full border-2 border-red-500/50"
                    animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2 
                    }}
                  />
                )}
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                {isRecording ? 'Tap to stop recording' : transcript ? 'Command recognized' : 'Tap to speak a command'}
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center">
              {transcript && !isRecording && (
                <Button 
                  type="button" 
                  variant="default" 
                  onClick={() => {
                    onVoiceCommand(transcript);
                    setIsOpen(false);
                    setTranscript('');
                  }}
                >
                  Process Command
                </Button>
              )}
              {isRecording ? (
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={stopRecording}
                >
                  Cancel
                </Button>
              ) : !transcript && (
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VoiceCommandButton;
