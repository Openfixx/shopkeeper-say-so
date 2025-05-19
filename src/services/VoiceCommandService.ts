
import { toast } from 'sonner';
import { parseMultipleProducts } from '@/utils/voiceCommandUtils';
import { VoiceProduct } from '@/types/voice';

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
}

export interface VoiceCommandListeners {
  onStart?: () => void;
  onResult?: (text: string, products: VoiceProduct[]) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProcessing?: (isProcessing: boolean) => void;
}

export class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private transcript: string = '';
  private listeners: VoiceCommandListeners = {};

  constructor(options: SpeechRecognitionOptions = {}) {
    this.initRecognition(options);
  }

  private initRecognition(options: SpeechRecognitionOptions) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("Speech recognition is not supported in this browser");
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Set default options
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.lang ?? 'en-US';
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
      
      // Set up event handlers
      this.recognition.onstart = this.handleStart.bind(this);
      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
    }
  }

  public setListeners(listeners: VoiceCommandListeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public start() {
    if (!this.recognition) {
      toast.error("Speech recognition is not supported in your browser");
      return false;
    }

    if (this.isListening) {
      return true; // Already listening
    }

    try {
      this.transcript = '';
      this.recognition.start();
      return true;
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      toast.error("Failed to start voice recognition");
      return false;
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) {
      return false;
    }

    try {
      this.recognition.stop();
      return true;
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
      return false;
    }
  }

  public abort() {
    if (!this.recognition) {
      return false;
    }

    try {
      this.recognition.abort();
      return true;
    } catch (error) {
      console.error("Failed to abort speech recognition:", error);
      return false;
    }
  }

  private handleStart() {
    this.isListening = true;
    toast.info("Listening... Try saying 'Add 2kg rice and 3 packets of sugar'");
    
    if (this.listeners.onStart) {
      this.listeners.onStart();
    }
  }

  private handleResult(event: SpeechRecognitionEvent) {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        this.transcript = transcript;
        this.processCommand(transcript);
      } else {
        interimTranscript += transcript;
        // Update UI with interim results if needed
      }
    }
  }

  private handleError(event: SpeechRecognitionErrorEvent) {
    this.isListening = false;
    console.error("Speech recognition error:", event.error);
    
    if (this.listeners.onError) {
      this.listeners.onError(new Error(`Speech recognition error: ${event.error}`));
    }
    
    toast.error("Failed to recognize speech");
  }

  private handleEnd() {
    this.isListening = false;
    
    if (this.listeners.onEnd) {
      this.listeners.onEnd();
    }
  }

  private processCommand(text: string) {
    if (!text.trim()) {
      toast.warning("No voice input detected");
      return;
    }
    
    if (this.listeners.onProcessing) {
      this.listeners.onProcessing(true);
    }
    
    try {
      console.log("Processing command:", text);
      
      // Parse products from the command
      const products = parseMultipleProducts(text);
      console.log("Parsed products:", products);
      
      if (products.length > 0) {
        if (this.listeners.onResult) {
          this.listeners.onResult(text, products);
        }
      } else {
        toast.warning("Could not detect any products. Try speaking more clearly.");
      }
    } catch (error) {
      console.error("Error processing command:", error);
      toast.error("Failed to process voice command");
      
      if (this.listeners.onError) {
        this.listeners.onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      if (this.listeners.onProcessing) {
        this.listeners.onProcessing(false);
      }
    }
  }

  public isSupported(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  public getTranscript(): string {
    return this.transcript;
  }
}

// Singleton instance for app-wide use
export const voiceCommandService = new VoiceCommandService();

export default voiceCommandService;
