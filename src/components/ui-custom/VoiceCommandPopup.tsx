
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Package, Plus, X } from 'lucide-react';
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
  if (!result) return null;

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
                  alt={result.productName} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Product';
                  }}
                />
              </div>
            )}
            
            <div className="flex-1 space-y-1">
              <p className="font-medium text-base">{result.productName}</p>
              
              <div className="flex flex-wrap gap-2">
                {result.quantity && (
                  <Badge variant="outline" className="bg-primary/10">
                    {result.quantity.value} {result.quantity.unit}
                  </Badge>
                )}
                
                {result.price && (
                  <Badge variant="outline" className="bg-green-500/10">
                    ₹{result.price}
                  </Badge>
                )}
                
                {result.position && (
                  <Badge variant="outline" className="bg-blue-500/10">
                    {result.position}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="flex items-center gap-1">
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
