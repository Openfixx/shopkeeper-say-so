
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CommandResult } from '@/lib/voice';
import { toast } from '@/components/ui/use-toast';
import VoiceCommandConfirmation from './VoiceCommandConfirmation';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';

interface VoiceCommandPopupProps {
  result: CommandResult | null;
  onConfirm: (location?: string) => void;
  onCancel: () => void;
  loading?: boolean;
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
  productList?: { name: string }[];
}

const VoiceCommandPopup: React.FC<VoiceCommandPopupProps> = ({
  result,
  onConfirm,
  onCancel,
  loading = false,
  onCommand,
  productList
}) => {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (result) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [result]);
  
  const handleConfirm = (location: string) => {
    onConfirm(location);
    setOpen(false);
  };
  
  const handleCancel = () => {
    onCancel();
    setOpen(false);
  };
  
  // Check if result has all required fields
  const validateResult = (result: CommandResult | null): boolean => {
    if (!result) return false;
    
    const missingFields = [];
    
    if (!result.productName || result.productName.trim() === '') {
      missingFields.push('product name');
    }
    
    if (!result.quantity || !result.quantity.value) {
      missingFields.push('quantity');
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please provide: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // If result is invalid, don't show the dialog
  if (result && !validateResult(result)) {
    onCancel();
    return null;
  }
  
  return (
    <VoiceCommandConfirmation
      open={open}
      result={result}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
    />
  );
};

export default VoiceCommandPopup;
