import { useState } from 'react';

export type CommandResult = {
  productName: string;
  quantity: { value: number; unit: string };
  position: string;
  price: number;
  expiry: string;
  imageUrl: string;
  rawText: string;
};

type Step =
  | 'askName'
  | 'askQuantity'
  | 'askPosition'
  | 'askPrice'
  | 'askExpiry'
  | 'done';

export const useVoiceRecognition = () => {
  const [step, setStep] = useState<Step>('askName');
  const [partial, setPartial] = useState<Partial<CommandResult>>({});
  const [isListening, setIsListening] = useState(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(
    null
  );

  // Prompts for each step
  const prompts: Record<Step, string> = {
    askName: 'Please say the product name.',
    askQuantity: 'Please say the quantity and its unit.',
    askPosition: 'Please say the position—e.g. rack 7.',
    askPrice: 'Please say the price in rupees.',
    askExpiry: 'Please say the expiry (date or relative time).',
    done: '',
  };
  const promptText = prompts[step];

  // —— extractPureProductName (same as before) ——
  const extractPureProductName = (t: string): string => {
    const m = t.match(
      /(?:add|create)?\s*(?:\d+\s*(?:kg|g|ml|l)\s*)?(.+?)(?=\s+(?:to\s+rack|on\s+shelf|for\s+₹|\d|kg|g|ml|l|$))/i
    );
    if (m && m[1]) return m[1].trim();
    return t
      .replace(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(kg|g|ml|l)\b/gi, '')
      .replace(/\b(rack|shelf)\s*\d+\b/gi, '')
      .replace(/\b(add|create|to|on|in|at|for|₹)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // —— parseQuantity ——
  const parseQuantity = (t: string) => {
    const m = t.match(/(\d+)\s*(kg|g|ml|l)/i);
    return m
      ? { value: parseInt(m[1], 10), unit: m[2].toLowerCase() }
      : { value: 1, unit: 'pcs' };
  };

  // —— fetchProductImage (same Unsplash logic) ——
  const fetchProductImage = async (name: string): Promise<string> => {
    if (!name) return '';
    try {
      return `https://source.unsplash.com/300x300/?${encodeURIComponent(name)}`;
    } catch {
      return '';
    }
  };

  // —— Speech Recognition core ——
  const recognize = async (lang: string): Promise<string> => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = lang;
    recog.continuous = false;
    return new Promise((resolve, reject) => {
      recog.onresult = (e: any) => resolve(e.results[0][0].transcript);
      recog.onerror = (e: any) => reject(e.error);
      recog.start();
    });
  };

  // —— Move to next step —— 
  const next = async (lang = 'en-IN') => {
    setIsListening(true);
    try {
      const spoken = await recognize(lang);
      // accumulate rawText
      setPartial((p) => ({
        ...p,
        rawText: p.rawText ? p.rawText + ' ' + spoken : spoken,
      }));

      switch (step) {
        case 'askName': {
          const name = extractPureProductName(spoken);
          setPartial((p) => ({ ...p, productName: name }));
          setStep('askQuantity');
          break;
        }
        case 'askQuantity': {
          const qty = parseQuantity(spoken);
          setPartial((p) => ({ ...p, quantity: qty }));
          setStep('askPosition');
          break;
        }
        case 'askPosition': {
          const m = spoken.match(/(rack|shelf)\s*(\d+)/i);
          const pos = m ? `${m[1]} ${m[2]}` : spoken;
          setPartial((p) => ({ ...p, position: pos }));
          setStep('askPrice');
          break;
        }
        case 'askPrice': {
          const m = spoken.match(/₹?(\d+)/);
          const price = m ? parseInt(m[1], 10) : 0;
          setPartial((p) => ({ ...p, price }));
          setStep('askExpiry');
          break;
        }
        case 'askExpiry': {
          // store exactly what was spoken for expiry
          setPartial((p) => ({ ...p, expiry: spoken }));
          setStep('done');
          break;
        }
        case 'done': {
          // nothing
          break;
        }
      }

      // once done, assemble final result
      if (step === 'done' || step === 'askExpiry') {
        const final: CommandResult = {
          productName: partial.productName!,
          quantity: partial.quantity!,
          position: partial.position!,
          price: partial.price!,
          expiry: partial.expiry!,
          rawText: (partial.rawText || '') + ' ' + spoken,
          imageUrl: await fetchProductImage(partial.productName!),
        };
        setCommandResult(final);
      }
    } finally {
      setIsListening(false);
    }
  };

  const reset = () => {
    setStep('askName');
    setPartial({});
    setCommandResult(null);
  };

  return {
    step,
    promptText,
    isListening,
    next,
    commandResult,
    reset,
  };
};
