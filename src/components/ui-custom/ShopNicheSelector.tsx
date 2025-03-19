
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store, CheckCircle, Store as StoreIcon, Pill, ShoppingBag, Wrench, Laptop, Salad, Beef, Book, Shirt, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface ShopNicheOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ShopNicheSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (niche: string) => void;
}

const SHOP_NICHES: ShopNicheOption[] = [
  {
    id: 'general-store',
    name: 'General Store',
    icon: <Store className="h-5 w-5" />,
    description: 'Groceries, household items, and daily essentials'
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy / Medical',
    icon: <Pill className="h-5 w-5" />,
    description: 'Medicines, health products, and medical supplies'
  },
  {
    id: 'grocery',
    name: 'Grocery Store',
    icon: <ShoppingBag className="h-5 w-5" />,
    description: 'Food, produce, and grocery items'
  },
  {
    id: 'hardware',
    name: 'Hardware Store',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Tools, building materials, and hardware supplies'
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: <Laptop className="h-5 w-5" />,
    description: 'Electronic devices, gadgets, and accessories'
  },
  {
    id: 'produce',
    name: 'Fruits & Vegetables',
    icon: <Salad className="h-5 w-5" />,
    description: 'Fresh fruits, vegetables, and produce'
  },
  {
    id: 'butcher',
    name: 'Meat & Poultry',
    icon: <Beef className="h-5 w-5" />,
    description: 'Meat, poultry, seafood, and related products'
  },
  {
    id: 'stationary',
    name: 'Stationery & Books',
    icon: <Book className="h-5 w-5" />,
    description: 'Books, stationery items, and office supplies'
  },
  {
    id: 'clothing',
    name: 'Clothing & Apparel',
    icon: <Shirt className="h-5 w-5" />,
    description: 'Clothing, apparel, and fashion accessories'
  },
];

const ShopNicheSelector: React.FC<ShopNicheSelectorProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [otherNiche, setOtherNiche] = useState('');
  const [step, setStep] = useState(1);
  
  const handleSelect = (nicheId: string) => {
    setSelectedNiche(nicheId);
  };
  
  const handleContinue = () => {
    if (!selectedNiche && step === 1) {
      toast.error('Please select a shop type');
      return;
    }
    
    if (selectedNiche === 'other' && !otherNiche && step === 2) {
      toast.error('Please enter your shop type');
      return;
    }
    
    if (step === 1) {
      if (selectedNiche === 'other') {
        setStep(2);
      } else {
        const selectedNicheObj = SHOP_NICHES.find(niche => niche.id === selectedNiche);
        if (selectedNicheObj) {
          onSelect(selectedNicheObj.name);
          onOpenChange(false);
          toast.success(`Shop type set to ${selectedNicheObj.name}`);
        }
      }
    } else {
      onSelect(otherNiche);
      onOpenChange(false);
      toast.success(`Shop type set to ${otherNiche}`);
    }
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            Select Your Shop Type
          </DialogTitle>
          <DialogDescription>
            This helps us customize the app experience for your business
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {SHOP_NICHES.map((niche) => (
              <motion.div
                key={niche.id}
                variants={itemVariants}
                className={`border rounded-lg p-3 cursor-pointer transition-all relative ${
                  selectedNiche === niche.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50 hover:bg-muted/50'
                }`}
                onClick={() => handleSelect(niche.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2">
                    {niche.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{niche.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {niche.description}
                    </p>
                  </div>
                </div>
                
                {selectedNiche === niche.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
            
            <motion.div
              variants={itemVariants}
              className={`border rounded-lg p-3 cursor-pointer transition-all relative ${
                selectedNiche === 'other' 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => handleSelect('other')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2">
                  <Circle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">Other</h3>
                  <p className="text-xs text-muted-foreground">
                    A custom shop type not listed above
                  </p>
                </div>
              </div>
              
              {selectedNiche === 'other' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please tell us your shop type
            </p>
            <Input 
              placeholder="e.g. Bakery, Flower Shop, etc."
              value={otherNiche}
              onChange={(e) => setOtherNiche(e.target.value)}
            />
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0">
          {step === 2 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div> /* Empty div to maintain flex layout */
          )}
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopNicheSelector;
