
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package2, Smartphone, Shirt, Stethoscope } from 'lucide-react';

interface ShopNicheSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (niche: string) => void;
}

const ShopNicheSelector: React.FC<ShopNicheSelectorProps> = ({ 
  open, 
  onOpenChange,
  onSelect
}) => {
  const shopTypes = [
    { 
      id: 'grocery', 
      name: 'Grocery', 
      icon: <Package2 className="h-8 w-8 mb-2" />,
      description: 'Food, beverages, and household items'
    },
    { 
      id: 'electronics', 
      name: 'Electronics', 
      icon: <Smartphone className="h-8 w-8 mb-2" />,
      description: 'Gadgets, appliances, and tech products'
    },
    { 
      id: 'clothing', 
      name: 'Clothing', 
      icon: <Shirt className="h-8 w-8 mb-2" />,
      description: 'Apparel, accessories, and fashion items'
    },
    { 
      id: 'pharmacy', 
      name: 'Pharmacy', 
      icon: <Stethoscope className="h-8 w-8 mb-2" />,
      description: 'Medicines, healthcare products, and wellness items'
    }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Your Shop Type</DialogTitle>
          <DialogDescription>
            Choose the category that best fits your business
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {shopTypes.map((type) => (
            <div 
              key={type.id}
              className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
              onClick={() => {
                onSelect(type.name);
                onOpenChange(false);
              }}
            >
              {type.icon}
              <h3 className="font-medium text-center">{type.name}</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                {type.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onSelect('Custom');
              onOpenChange(false);
            }}
          >
            I'll choose later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopNicheSelector;
