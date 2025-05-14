import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommandResult } from '@/lib/voice';
import { suggestLocationForProduct } from '@/utils/voiceCommandUtils';
import { MapPin, Package, Calendar } from 'lucide-react';

interface VoiceCommandConfirmationProps {
  open: boolean;
  result: CommandResult | null;
  onConfirm: (location: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PREDEFINED_LOCATIONS = [
  'Shelf A', 'Shelf B', 'Shelf C', 'Shelf D',
  'Rack 1', 'Rack 2', 'Rack 3',
  'Fridge', 'Freezer', 'Pantry',
  'Counter', 'Storage Room', 'Display'
];

const VoiceCommandConfirmation: React.FC<VoiceCommandConfirmationProps> = ({
  open,
  result,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [location, setLocation] = useState<string>("unspecified");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [isCustomLocation, setIsCustomLocation] = useState<boolean>(false);

  useEffect(() => {
    if (result) {
      // If the command already detected a position, use it
      if (result.position) {
        setLocation(result.position);
        setIsCustomLocation(false);
      } else {
        // Otherwise suggest a location based on product type
        const suggestedLocation = suggestLocationForProduct(result.productName);
        setLocation(suggestedLocation);
        setIsCustomLocation(false);
      }
    }
  }, [result]);

  const handleConfirm = () => {
    // Use custom location if selected, otherwise use the dropdown selection
    const finalLocation = isCustomLocation ? customLocation || "unspecified" : location;
    onConfirm(finalLocation);
  };

  const toggleCustomLocation = () => {
    setIsCustomLocation(!isCustomLocation);
    if (!isCustomLocation) {
      setCustomLocation("");
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirm Product</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="product-name">Product</Label>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-medium">{result.productName}</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  id="quantity"
                  type="number"
                  value={result.quantity?.value || 1}
                  readOnly
                  className="text-right"
                />
                <Badge variant="outline">{result.quantity?.unit || 'unit'}</Badge>
              </div>
            </div>
            
            {result.price && (
              <div className="flex-1">
                <Label htmlFor="price">Price</Label>
                <Input 
                  id="price"
                  value={`₹${result.price}`}
                  readOnly
                  className="mt-1"
                />
              </div>
            )}
          </div>
          
          {result.expiry && (
            <div>
              <Label htmlFor="expiry" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Expiry</span>
              </Label>
              <Input 
                id="expiry"
                value={result.expiry}
                readOnly
                className="mt-1"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Location <span className="text-rose-500">*</span></span>
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleCustomLocation}
                type="button"
              >
                {isCustomLocation ? "Use Predefined" : "Custom Location"}
              </Button>
            </div>
            
            {isCustomLocation ? (
              <Input
                placeholder="Enter custom location"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="mt-1"
              />
            ) : (
              <Select 
                value={location} 
                onValueChange={setLocation}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Heard: <span className="italic">"{result.rawText}"</span>
          </p>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading || (isCustomLocation && !customLocation)}
            className="min-w-24"
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCommandConfirmation;
