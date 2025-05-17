
import React from 'react';
import VoiceInputWithLocation from '@/components/VoiceInputWithLocation';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { toast } from 'sonner';
import { useInventory } from '@/context/InventoryContext';

interface UnifiedVoiceCommandProps {
  compact?: boolean;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
}

export default function UnifiedVoiceCommand({ compact = false, onCommand }: UnifiedVoiceCommandProps) {
  const { addProduct } = useInventory();
  
  const handleCommand = (command: string, products: EnhancedProduct[]) => {
    // First try to use the provided onCommand handler
    if (onCommand) {
      onCommand(command, products);
      return;
    }
    
    // Default behavior: add products to inventory
    if (products && products.length > 0) {
      products.forEach(product => {
        addProduct({
          name: product.name,
          quantity: product.quantity || 1,
          unit: product.unit || 'piece',
          position: product.position || 'General Storage',
          price: product.price || 0,
          image_url: ''
        });
      });
      
      toast.success(`Added ${products.length} product(s) to inventory`);
    }
  };
  
  return (
    <VoiceInputWithLocation
      compact={compact}
      onCommand={handleCommand}
    />
  );
}
