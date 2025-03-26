
import React from 'react';
import VoiceFeatures from '@/components/ui-custom/VoiceFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Brain, FileText } from 'lucide-react';

const VoiceScreen: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mic className="h-5 w-5" /> Voice & NLP Features
          </CardTitle>
          <CardDescription>
            Advanced speech recognition, text-to-speech, and natural language processing capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="features" className="flex items-center gap-1">
                <Mic className="h-4 w-4" /> Features
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-1">
                <Brain className="h-4 w-4" /> AI Models
              </TabsTrigger>
              <TabsTrigger value="docs" className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Documentation
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="features">
              <p className="text-muted-foreground">
                This page provides access to advanced voice and language processing features including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Speech-to-text transcription with Whisper integration</li>
                <li>Text-to-speech conversion with customizable voices</li>
                <li>Named entity recognition (NER) using spaCy</li>
                <li>Voice commands for inventory management</li>
                <li>Multilingual support for English and Hindi</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="models">
              <p className="text-muted-foreground">
                This application integrates with powerful AI models for speech and language processing:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Whisper</strong> - State-of-the-art speech recognition model from OpenAI</li>
                <li><strong>spaCy</strong> - Industrial-strength NLP library with custom NER for inventory commands</li>
                <li><strong>Web Speech API</strong> - Browser-native speech synthesis for text-to-speech</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Note: For full functionality, a Python backend would be needed to host these models.
                This implementation provides UI integration and simulates model behavior.
              </p>
            </TabsContent>
            
            <TabsContent value="docs">
              <p className="text-muted-foreground">
                Documentation for training and deploying custom AI models:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>See <code>docs/custom-spacy-model.md</code> for spaCy model training instructions</li>
                <li>See <code>requirements.txt</code> for Python dependencies</li>
                <li>The <code>supabase/functions/ai-voice-processing</code> Edge Function provides API integration</li>
              </ul>
              <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">Training Data Example:</p>
                <pre className="text-xs font-mono mt-1 overflow-x-auto">
                  TRAIN_DATA = [<br/>
                  {"  (\"add 5 kg sugar to rack 3\", "}<br/>
                  {"   {\"entities\": [(4, 9, \"QUANTITY\"), (10, 15, \"PRODUCT_NAME\"), (19, 25, \"LOCATION\")]})"}<br/>
                  ]
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <VoiceFeatures />
    </div>
  );
};

export default VoiceScreen;
