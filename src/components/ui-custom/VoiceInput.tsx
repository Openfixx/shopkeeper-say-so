
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic, 
  MicOff, 
  Play,
  Pause,
  Trash2,
  Save,
  VolumeX,
  Volume2,
  Clock,
  Loader2,
  FileAudio
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
  onCommand?: (command: string) => void;
  className?: string;
  placeholder?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onCommand,
  className = '',
  placeholder = 'Voice commands...'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Simulate recording
    toast.success('Recording started');
  };
  
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const demoTranscripts = [
        'Add 5 kg of sugar to inventory',
        'Check stock levels for rice',
        'Create bill for customer John with 2 boxes of tea',
        'Update price of milk to $3.50',
        'Low stock alert for flour'
      ];
      
      const randomTranscript = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
      setTranscript(randomTranscript);
      setRecordedAudio('demo-audio-blob');
      
      if (onTranscript) {
        onTranscript(randomTranscript);
      }
      
      setIsProcessing(false);
      toast.success('Recording processed');
    }, 1500);
  };
  
  const handlePlayback = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Simulate playback
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };
  
  const clearRecording = () => {
    setRecordedAudio(null);
    setTranscript('');
  };
  
  const saveCommand = () => {
    if (transcript && onCommand) {
      onCommand(transcript);
      toast.success('Command processed');
      clearRecording();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div>
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div 
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={stopRecording}
                  >
                    <MicOff className="h-5 w-5" />
                  </Button>
                  <motion.div 
                    className="absolute -inset-2 rounded-full border-2 border-destructive/50"
                    animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2 
                    }}
                  />
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    disabled
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="default"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    onClick={startRecording}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1">
            {isRecording ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Recording...
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(recordingTime)}
                  </div>
                </div>
                
                <div className="voice-waveform relative h-8 flex items-center justify-center rounded-md overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center space-x-[3px]">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="waveform-line bg-red-400/60 rounded-full"
                        style={{
                          width: '2px',
                          height: '40%',
                          animationDelay: `${i * 0.03}s`
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
              </div>
            ) : isProcessing ? (
              <div className="text-sm">
                Processing audio...
              </div>
            ) : transcript ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                      Transcript
                    </Badge>
                    <button 
                      onClick={handlePlayback}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </button>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={clearRecording}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={saveCommand}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{transcript}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInput;
