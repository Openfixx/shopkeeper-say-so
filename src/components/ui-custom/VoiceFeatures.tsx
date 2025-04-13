
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Play,
  Pause,
  Volume2, 
  VolumeX, 
  Loader2,
  FileAudio,
  MessageSquare,
  DownloadCloud,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

const VoiceFeatures = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordings, setRecordings] = useState<string[]>([
    'Grocery list for weekend',
    'Custom recording about inventory',
    'Voice note about new suppliers'
  ]);
  const [activeRecording, setActiveRecording] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState('');

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.success('Recording started');
    
    // Simulate voice recording
    setTimeout(() => {
      setTranscript('Add 5 kg sugar to inventory at rack 3');
    }, 1500);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    if (transcript) {
      toast.success('Recording saved');
      setRecordings([...recordings, 'New inventory voice command']);
    } else {
      toast.error('Nothing was recorded');
    }
  };

  const handlePlayback = (recording: string) => {
    if (activeRecording === recording && isPlaying) {
      setIsPlaying(false);
      setActiveRecording(null);
    } else {
      setActiveRecording(recording);
      setIsPlaying(true);
      
      // Simulate text recognition after 1 second
      setProcessingAction('transcribing');
      setTimeout(() => {
        setProcessingAction(null);
        setRecognizedText('Add 5 kg sugar to inventory at rack 3');
      }, 1000);
    }
  };

  const handleTTS = (text: string) => {
    setProcessingAction('speaking');
    // Simulate text-to-speech
    setTimeout(() => {
      toast.success('Text spoken successfully');
      setProcessingAction(null);
    }, 2000);
  };

  const handleProcessText = () => {
    if (!recognizedText) return;
    
    setProcessingAction('processing');
    // Simulate NLP processing
    setTimeout(() => {
      toast.success('Command processed: Adding sugar to inventory');
      setProcessingAction(null);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Voice Recording Section */}
      <Card className="voice-card">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Mic className="h-5 w-5 mr-2 text-violet-500" />
            Voice Recording
          </h3>
          
          <div className="flex justify-center">
            <div className="relative">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={`h-20 w-20 rounded-full ${isRecording ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              
              {isRecording && (
                <motion.div 
                  className="absolute -inset-3 rounded-full border-4 border-red-500/50"
                  animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2 
                  }}
                />
              )}
            </div>
          </div>
          
          {isRecording && (
            <div className="mt-6">
              <div className="voice-waveform relative h-16 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center space-x-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="waveform-line w-1 bg-violet-400/60 rounded-full"
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
                <Badge variant="outline" className="z-10 bg-background/80">
                  Recording...
                </Badge>
              </div>
              
              {transcript && (
                <div className="mt-4 p-3 bg-background/70 backdrop-blur-sm rounded-xl">
                  <p className="text-sm font-medium">Transcript:</p>
                  <p className="text-sm text-muted-foreground">{transcript}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-medium">Saved Recordings</h4>
            {recordings.map((recording, index) => (
              <div key={index} className="flex items-center justify-between bg-background/70 p-3 rounded-lg">
                <div className="flex items-center">
                  <FileAudio className="h-4 w-4 text-violet-500 mr-2" />
                  <span className="text-sm">{recording}</span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => handlePlayback(recording)}
                  >
                    {activeRecording === recording && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Speech Recognition & NLP Section */}
      <Card className="voice-card">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-fuchsia-500" />
            Speech Recognition & NLP
          </h3>
          
          <div className="bg-background/70 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Badge className="bg-fuchsia-500">AI</Badge>
                <span className="text-xs text-muted-foreground ml-2">Processing</span>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={() => setRecognizedText('')}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {processingAction === 'transcribing' ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500" />
                <span className="ml-2 text-sm">Transcribing audio...</span>
              </div>
            ) : recognizedText ? (
              <div className="space-y-4">
                <div className="p-3 bg-fuchsia-500/10 rounded-lg">
                  <p className="text-sm">{recognizedText}</p>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTTS(recognizedText)}
                    disabled={processingAction === 'speaking'}
                  >
                    {processingAction === 'speaking' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Speaking...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 mr-1" />
                        Speak
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    size="sm"
                    className="text-xs"
                    onClick={handleProcessText}
                    disabled={processingAction === 'processing'}
                  >
                    {processingAction === 'processing' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-3.5 w-3.5 mr-1" />
                        Process Command
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Play a recording or start a new one to see speech recognition in action.
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-violet-500/10 border-violet-500/20">
              <CardContent className="p-4 text-center">
                <h4 className="font-medium mb-1">Speech Recognition</h4>
                <p className="text-xs text-muted-foreground mb-2">Supports multiple languages</p>
                <Badge variant="outline" className="bg-background/50">
                  Whisper-based
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="bg-fuchsia-500/10 border-fuchsia-500/20">
              <CardContent className="p-4 text-center">
                <h4 className="font-medium mb-1">NLP Processing</h4>
                <p className="text-xs text-muted-foreground mb-2">Entity & intent recognition</p>
                <Badge variant="outline" className="bg-background/50">
                  spaCy-powered
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <DownloadCloud className="h-3.5 w-3.5" />
              Download Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceFeatures;
