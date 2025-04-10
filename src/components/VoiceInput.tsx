import { useVoice } from '../lib/voice';

interface VoiceInputProps {
  onCommand: (text: string) => void;
}

export default function VoiceInput({ onCommand }: VoiceInputProps) {
  const { text, listen } = useVoice();

  return (
    <div className="voice-input">
      <button onClick={() => listen('hi-IN')}>Speak Hindi</button>
      <button onClick={() => listen('en-IN')}>Speak English</button>
      <p>You said: {text}</p>
      <button onClick={() => onCommand(text)}>Process Command</button>
    </div>
  );
}
