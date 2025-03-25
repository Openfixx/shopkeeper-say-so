
import React from 'react';
import VoiceFeatures from '@/components/ui-custom/VoiceFeatures';

const VoiceScreen: React.FC = () => {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Voice & NLP Features</h1>
        <p className="text-muted-foreground">
          Explore speech recognition, text-to-speech, and named entity recognition capabilities
        </p>
      </div>
      
      <VoiceFeatures />
    </div>
  );
};

export default VoiceScreen;
