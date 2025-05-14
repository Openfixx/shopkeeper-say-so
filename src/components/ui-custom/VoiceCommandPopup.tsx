
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Plus, X, MapPin } from 'lucide-react';
import { CommandResult } from '@/lib/voice';

interface VoiceCommandPopupProps {
  result: CommandResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const VoiceCommandPopup: React.FC<VoiceCommandPopupProps> = ({ 
  result, 
  onConfirm, 
  onCancel,
  loading = false 
}) => {
  const [location, setLocation] = useState('');
  
  // Update location when result changes
  useEffect(() => {
    if (!result || result.position === null || result.position === undefined) {
      setLocation('');
      return;
    }
    
    if (typeof result.position === 'object' && result.position !== null) {
      if ('value' in result.position && result.position.value !== undefined) {
        setLocation(String(result.position.value));
      }
    } else if (typeof result.position === 'string') {
      setLocation(result.position);
    } else {
      // Default location if format is not recognized
      setLocation('');
    }
  }, [result]);
  
  if (!result) return null;

  // Extract product name, handling cases where it might be different formats or null
  const productName = (() => {
    if (!result.productName) return 'Unknown Product';
    
    if (typeof result.productName === 'object' && result.productName !== null) {
      if ('value' in result.productName && result.productName.value !== undefined) {
        return String(result.productName.value);
      }
    }
    
    return typeof result.productName === 'string' ? result.productName : 'Unknown Product';
  })();

  // Function to safely extract price value
  const getPriceValue = () => {
    if (result.price === null || result.price === undefined) {
      return null;
    }
    
    if (typeof result.price === 'object' && result.price !== null) {
      if ('value' in result.price && result.price.value !== undefined) {
        return result.price.value;
      }
    }
    
    return result.price;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
    >
      <Card className="shadow-lg border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Confirm Product</h3>
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-3 items-center">
            {result.imageUrl && (
              <div className="relative h-16 w-16 rounded overflow-hidden bg-muted">
                <img 
                  src={result.imageUrl} 
                  alt={productName} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Product';
                  }}
                />
              </div>
            )}
            
            <div className="flex-1 space-y-1">
              <p className="font-medium text-base">{productName}</p>
              
              <div className="flex flex-wrap gap-2">
                {result.quantity && (
                  <Badge variant="outline" className="bg-primary/10">
                    {result.quantity.value} {result.quantity.unit}
                  </Badge>
                )}
                
                {result.price !== null && result.price !== undefined && (
                  <Badge variant="outline" className="bg-green-500/10">
                    ₹{getPriceValue()}
                  </Badge>
                )}
                
                {location && (
                  <Badge variant="outline" className="bg-blue-500/10">
                    {location}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              Location (Rack/Shelf)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter shelf or rack number"
              className="h-8 text-sm"
            />
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Update the result object with the location
                if (result) {
                  result.position = location;
                }
                onConfirm();
              }} 
              disabled={loading} 
              className="flex items-center gap-1"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add to Inventory</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VoiceCommandPopup;
