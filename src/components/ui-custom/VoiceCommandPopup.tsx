
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommandResult } from '@/lib/voice';
import { VoiceProduct } from '@/utils/voiceCommandUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageIcon, Loader2, MapPin } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { EnhancedProduct } from '@/utils/nlp/enhancedProductParser';

interface VoiceCommandPopupProps {
  result: CommandResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  multiProductMode?: boolean;
  multiProducts?: VoiceProduct[];
  productList?: { name: string }[];
  onCommand?: (command: string, products: EnhancedProduct[]) => void;
}

export default function VoiceCommandPopup({ 
  result, 
  onConfirm, 
  onCancel, 
  loading = false,
  multiProductMode = false,
  multiProducts = [],
  productList,
  onCommand
}: VoiceCommandPopupProps) {
  const [locations, setLocations] = useState<Record<number, string>>({});

  const updateLocation = (index: number, location: string) => {
    setLocations(prev => ({
      ...prev,
      [index]: location
    }));
    
    // Update the multiProducts array if it exists
    if (multiProducts && multiProducts[index]) {
      multiProducts[index].position = location;
    }
  };

  const allLocationsProvided = () => {
    if (!multiProductMode || multiProducts.length === 0) return true;
    
    return multiProducts.every((p, index) => {
      return (locations[index] && locations[index].trim() !== '') || 
             (p.position && p.position.trim() !== '' && p.position !== 'General Storage');
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{multiProductMode ? "Confirm Products" : "Confirm Product"}</DialogTitle>
          <DialogDescription>
            {multiProductMode 
              ? `You're adding ${multiProducts.length} products to inventory` 
              : "Review the product details before adding to inventory"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {multiProductMode ? (
            // Multiple products display
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {multiProducts.map((product, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                        <PackageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Quantity: {product.quantity} {product.unit || 'piece'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`location-${index}`} className="block text-sm font-medium mb-1">
                        Location*
                      </label>
                      <Input
                        id={`location-${index}`}
                        type="text"
                        value={locations[index] || product.position || ''}
                        onChange={(e) => updateLocation(index, e.target.value)}
                        placeholder="e.g., Shelf 3, Rack 2"
                        className="w-full"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Single product display
            <div className="space-y-4">
              <div className="text-center">
                {result?.imageUrl && (
                  <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden mb-4">
                    <AspectRatio ratio={1/1} className="bg-muted">
                      <img 
                        src={result.imageUrl} 
                        alt={result.productName}
                        className="object-cover" 
                      />
                    </AspectRatio>
                  </div>
                )}
                
                <h3 className="text-lg font-semibold">{result?.productName}</h3>
                
                {result?.quantity && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span>{result.quantity.value}</span>
                    <Badge variant="outline">{result.quantity.unit}</Badge>
                  </div>
                )}
                
                {result?.position && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{result.position}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="quantity" className="block text-sm font-medium">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  defaultValue={result?.quantity?.value.toString() || "1"}
                  className="w-full"
                />
                
                <label htmlFor="location" className="block text-sm font-medium mt-3">
                  Location*
                </label>
                <Input
                  id="location"
                  type="text"
                  defaultValue={result?.position || ""}
                  placeholder="e.g., Shelf 3, Rack 2"
                  className="w-full"
                  required
                />
              </div>
            </div>
          )}
          
          {result?.rawText && (
            <div className="text-xs text-muted-foreground mt-4">
              <p>Heard: <span className="italic">"{result.rawText}"</span></p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading || (multiProductMode && !allLocationsProvided())}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {multiProductMode ? "Adding Products..." : "Adding..."}
              </>
            ) : (
              multiProductMode ? "Confirm All" : "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
