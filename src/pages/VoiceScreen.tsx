
import React from 'react';
import VoiceFeatures from '@/components/ui-custom/VoiceFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VoiceScreen: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Voice & NLP Features</CardTitle>
          <CardDescription>
            Use speech recognition, text-to-speech, and natural language processing tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page provides access to advanced voice and language processing features including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Speech-to-text transcription</li>
            <li>Text-to-speech conversion</li>
            <li>Named entity recognition (NER)</li>
            <li>Voice commands for shop operations</li>
            <li>Multilingual support</li>
          </ul>
        </CardContent>
      </Card>
      
      <VoiceFeatures />
    </div>
  );
};

export default VoiceScreen;
