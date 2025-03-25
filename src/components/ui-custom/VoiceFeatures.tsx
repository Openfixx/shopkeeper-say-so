
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Mic, Play, Square, VolumeX, Volume2, AlertCircle, Pause, RotateCcw, Search, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  speak, 
  stopSpeaking, 
  pauseSpeaking, 
  resumeSpeaking, 
  getVoices, 
  initSpeechSynthesis,
  SpeechOptions 
} from '@/utils/webSpeechApi';
import { 
  processWithSpacy, 
  Entity, 
  getEntityColor 
} from '@/utils/spacyApi';

const VoiceFeatures: React.FC = () => {
  // Text Input State
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  // Text to Speech State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  
  // NER State
  const [isProcessing, setIsProcessing] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [highlightedText, setHighlightedText] = useState<React.ReactNode>('');

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setText((prevText) => prevText + ' ' + transcript);
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update textarea with interim results
          if (interimTranscript) {
            const textArea = document.getElementById('voice-text-input') as HTMLTextAreaElement;
            if (textArea) {
              textArea.value = text + ' ' + interimTranscript;
            }
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Failed to recognize speech');
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Failed to restart recognition', error);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };
        
        setRecognition(recognitionInstance);
      }
    } else {
      toast.error('Speech recognition is not supported in your browser');
    }
    
    // Initialize text-to-speech
    initSpeechSynthesis().then((availableVoices) => {
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        // Prefer English voices
        const englishVoice = availableVoices.find(voice => voice.lang.includes('en-'));
        setSelectedVoice(englishVoice?.name || availableVoices[0].name);
      }
    });

    return () => {
      if (recognition) {
        recognition.abort();
      }
      stopSpeaking();
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.info('Speech recognition stopped');
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast.info('Listening... Speak now');
      } catch (error) {
        console.error('Speech recognition error', error);
        toast.error('Failed to start speech recognition');
      }
    }
  };

  const handleSpeak = () => {
    if (!text) {
      toast.error('Please enter or record some text first');
      return;
    }
    
    if (isSpeaking && isPaused) {
      resumeSpeaking();
      setIsPaused(false);
      return;
    }
    
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }
    
    const options: SpeechOptions = {
      text,
      voice: selectedVoice,
      rate,
      pitch,
      volume,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onError: (error) => {
        console.error('Speech synthesis error:', error);
        toast.error('Error during speech synthesis');
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };
    
    speak(options);
  };

  const handlePause = () => {
    if (isSpeaking && !isPaused) {
      pauseSpeaking();
      setIsPaused(true);
    } else if (isSpeaking && isPaused) {
      resumeSpeaking();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleAnalyzeText = async () => {
    if (!text) {
      toast.error('Please enter or record some text first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await processWithSpacy(text);
      
      if (result.success) {
        setEntities(result.entities);
        
        // Create highlighted text with entity markup
        createHighlightedText(text, result.entities);
        
        toast.success(`Found ${result.entities.length} entities in the text`);
      } else {
        toast.error(result.error || 'Failed to process text');
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast.error('An error occurred while analyzing the text');
    } finally {
      setIsProcessing(false);
    }
  };

  const createHighlightedText = (inputText: string, foundEntities: Entity[]) => {
    if (foundEntities.length === 0) {
      setHighlightedText(inputText);
      return;
    }
    
    // Sort entities by start position
    const sortedEntities = [...foundEntities].sort((a, b) => a.start - b.start);
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    sortedEntities.forEach((entity, index) => {
      // Add text before the entity
      if (entity.start > lastIndex) {
        parts.push(inputText.substring(lastIndex, entity.start));
      }
      
      // Add the entity with highlighting
      parts.push(
        <span 
          key={`entity-${index}`}
          className="px-1 py-0.5 rounded font-medium"
          style={{ backgroundColor: getEntityColor(entity.label) + '50' }}
          title={entity.description}
        >
          {inputText.substring(entity.start, entity.end)}
          <span className="text-xs ml-1 py-0.5 px-1 rounded-sm bg-muted text-muted-foreground">
            {entity.label}
          </span>
        </span>
      );
      
      lastIndex = entity.end;
    });
    
    // Add any remaining text
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    
    setHighlightedText(<>{parts}</>);
  };

  return (
    <div className="container max-w-4xl mx-auto my-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Voice & NLP Features</CardTitle>
          <CardDescription>
            Explore speech recognition, text-to-speech, and named entity recognition capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <Textarea 
                id="voice-text-input"
                placeholder="Type or speak your text here..." 
                className="min-h-[100px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={isListening ? "destructive" : "default"}
                  onClick={toggleListening}
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  {isListening ? 'Stop Listening' : 'Start Dictation'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setText('')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Text
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Text to Speech</CardTitle>
            <CardDescription>
              Convert your text into speech with customizable voices and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Rate: {rate.toFixed(1)}x</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={() => setRate(1)}
                >
                  Reset
                </Button>
              </div>
              <Slider
                value={[rate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => setRate(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Pitch: {pitch.toFixed(1)}</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={() => setPitch(1)}
                >
                  Reset
                </Button>
              </div>
              <Slider
                value={[pitch]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => setPitch(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Volume: {(volume * 100).toFixed(0)}%</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={() => setVolume(1)}
                >
                  Reset
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                  onValueChange={(value) => setVolume(value[0])}
                />
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button 
              variant={isSpeaking ? "destructive" : "default"}
              onClick={handleSpeak}
              className="gap-2"
            >
              {isSpeaking ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Speak Text
                </>
              )}
            </Button>
            
            {isSpeaking && (
              <Button 
                variant="outline"
                onClick={handlePause}
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Named Entity Recognition</CardTitle>
            <CardDescription>
              Extract and highlight entities from your text using NLP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleAnalyzeText}
              disabled={isProcessing || !text}
              className="w-full gap-2 mb-4"
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze Text
                </>
              )}
            </Button>
            
            {entities.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/20">
                  <p className="text-sm mb-2 font-medium">Highlighted Entities:</p>
                  <div className="text-sm">{highlightedText}</div>
                </div>
                
                <div>
                  <p className="text-sm mb-2 font-medium">Detected Entities ({entities.length}):</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {entities.map((entity, index) => (
                      <div 
                        key={`entity-list-${index}`}
                        className="flex items-start gap-2 text-sm p-2 border rounded-md"
                      >
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: getEntityColor(entity.label) }}
                        >
                          {entity.label}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{entity.text}</p>
                          <p className="text-xs text-muted-foreground">{entity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2 opacity-20" />
                <p>No entities detected yet. Enter some text and click "Analyze Text" to start.</p>
                <p className="text-xs mt-2">Try phrases like "John visited New York City last Friday and spent $200 on souvenirs."</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceFeatures;
