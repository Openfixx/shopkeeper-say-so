export const useVoiceRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognize = async (lang: string, attempts = 3): Promise<string> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;

    try {
      return await new Promise((resolve, reject) => {
        recognition.onresult = (e) => resolve(e.results[0][0].transcript);
        recognition.onerror = () => attempts > 1 
          ? resolve(recognize(lang, attempts - 1)) 
          : reject('Recognition failed');
        
        recognition.start();
        setTimeout(() => reject('Timeout'), 5000); // 5s timeout
      });
    } catch (error) {
      throw new Error(`Voice recognition failed: ${error}`);
    }
  };

  const listen = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const result = await recognize(lang);
      setText(result);
    } finally {
      setIsListening(false);
    }
  };

  return { text, isListening, listen };
};
