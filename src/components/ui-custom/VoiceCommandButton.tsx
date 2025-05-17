
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { useVoiceStore } from '@/store/voiceStore';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventory } from '@/context/InventoryContext';

const VoiceCommandButton: React.FC = () => {
  const { isListening, isProcessing, startListening, stopListening } = useVoiceRecognition();
  const { products, clearProducts } = useVoiceStore();
  const { addProduct } = useInventory();
  const [open, setOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (products.length > 0) {
      setOpen(true);
      
      // Initialize locations
      const initialLocations: Record<string, string> = {};
      products.forEach(product => {
        initialLocations[product.name] = product.position || '';
      });
      setLocations(initialLocations);
    }
  }, [products]);

  const handleAddProducts = () => {
    products.forEach(product => {
      addProduct({
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        price: product.price || 0,
        position: locations[product.name] || 'unspecified',
        image_url: product.image_url || ''
      });
    });
    
    clearProducts();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative h-10 w-10 rounded-full"
        onClick={startListening}
        disabled={isListening || isProcessing}
      >
        <Mic className="h-4 w-4" />
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        )}
      </Button>
      
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirm product locations</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <p className="text-muted-foreground text-sm mb-4">
              Please specify the location for each product
            </p>
            
            {products.map((product, index) => (
              <Card key={`${product.name}-${index}`} className="mb-3">
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} {product.unit}
                      </p>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor={`location-${index}`}>Location</Label>
                      <Input
                        id={`location-${index}`}
                        placeholder="Rack 1, Shelf 2, etc."
                        value={locations[product.name] || ''}
                        onChange={(e) => setLocations({
                          ...locations,
                          [product.name]: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DrawerFooter>
            <Button onClick={handleAddProducts}>
              Add {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default VoiceCommandButton;
