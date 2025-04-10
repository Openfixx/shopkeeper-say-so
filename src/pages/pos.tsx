import { useState } from 'react';
import VoiceInput from '../components/VoiceInput';
import BillGenerator from '../components/BillGenerator';
import { translate } from '../lib/translate';
import { addItem } from '../lib/inventory';

export default function POS() {
  const [items, setItems] = useState<{ name: string; price: number }[]>([]);

  const handleCommand = (text: string) => {
    // Example commands:
    // "Add sugar ₹50"
    // "5 किलो चीनी ₹100"
    const translatedText = translate(text);
    const match = translatedText.match(/(?:Add|)\s*(\d*\s*\w+)\s*₹?(\d+)/i);
    
    if (match) {
      const newItem = {
        name: match[1].trim(),  // "sugar" or "5 kilo sugar"
        price: Number(match[2]) // 50
      };
      setItems([...items, newItem]);
      addItem(newItem);
    }
  };

  return (
    <div className="pos-container">
      <h1>Shopkeeper POS</h1>
      <VoiceInput onCommand={handleCommand} />
      <BillGenerator items={items} />
    </div>
  );
}
