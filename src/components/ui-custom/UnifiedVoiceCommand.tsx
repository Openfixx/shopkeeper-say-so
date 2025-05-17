
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInventory } from '@/context/InventoryContext';
import { Mic } from 'lucide-react';
import VoiceInputWithLocation from '@/components/VoiceInputWithLocation';
import { VoiceProduct } from '@/types/voice';

interface UnifiedVoiceCommandProps {
  compact?: boolean;
  onCommand?: (command: string, products: VoiceProduct[]) => void;
}

export default function UnifiedVoiceCommand({ compact = false, onCommand }: UnifiedVoiceCommandProps) {
  const { addProduct } = useInventory();
  const [processing, setProcessing] = useState(false);
  
  const handleCommand = (command: string, products: VoiceProduct[]) => {
    console.log("UnifiedVoiceCommand received command:", command);
    console.log("UnifiedVoiceCommand received products:", products);
    
    setProcessing(true);
    
    try {
      // First try to use the provided onCommand handler
      if (onCommand) {
        onCommand(command, products);
        return;
      }
      
      // Default behavior: add products to inventory
      if (products && products.length > 0) {
        products.forEach(product => {
          console.log("Adding product to inventory:", product);
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
      } else {
        console.log("No products to add to inventory");
        toast.warning("No products were detected. Try speaking more clearly.");
      }
    } catch (error) {
      console.error("Error handling voice command:", error);
      toast.error("Failed to process voice command");
    } finally {
      setProcessing(false);
    }
  };
  
  // Enhanced UI for better visibility
  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-primary/10"
      >
        <VoiceInputWithLocation
          compact={compact}
          onCommand={handleCommand}
        />
      </Button>
    );
  }
  
  return (
    <div className="mb-6 relative">
      <VoiceInputWithLocation
        compact={compact}
        onCommand={handleCommand}
        className="shadow-md border-primary/20"
      />
    </div>
  );
}
