import { useState } from 'react';

export const useVoice = () => {
  const [text, setText] = useState('');

  const listen = (lang = 'en-IN') => {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                            (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in your browser!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;

    recognition.onresult = (e: any) => {
      setText(e.results[0][0].transcript);
    };

    recognition.start();
  };

  return { text, listen };
};
