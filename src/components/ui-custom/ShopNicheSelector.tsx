
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Store, Package, Utensils, Pill, Book, Shirt, Gift, ShoppingBag, User, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NicheOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export interface ShopNicheSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (niche: string) => void;
}

const ShopNicheSelector: React.FC<ShopNicheSelectorProps> = ({ open, onOpenChange, onSelect }) => {
  const [step, setStep] = useState<'select' | 'customize'>('select');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const nicheOptions: NicheOption[] = [
    {
      id: 'general-store',
      name: 'General Store',
      icon: <Store className="h-6 w-6" />,
      description: 'Grocery, household items, and daily essentials'
    },
    {
      id: 'grocery',
      name: 'Grocery Store',
      icon: <ShoppingBag className="h-6 w-6" />,
      description: 'Fresh produce, packaged foods, and beverages'
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      icon: <Pill className="h-6 w-6" />,
      description: 'Medicines, healthcare products, and wellness items'
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: <Utensils className="h-6 w-6" />,
      description: 'Food ingredients, supplies, and kitchen inventory'
    },
    {
      id: 'bookstore',
      name: 'Bookstore',
      icon: <Book className="h-6 w-6" />,
      description: 'Books, stationery, and educational materials'
    },
    {
      id: 'clothing',
      name: 'Clothing Store',
      icon: <Shirt className="h-6 w-6" />,
      description: 'Apparel, accessories, and fashion items'
    },
    {
      id: 'gift-shop',
      name: 'Gift Shop',
      icon: <Gift className="h-6 w-6" />,
      description: 'Gifts, souvenirs, and decorative items'
    },
    {
      id: 'hardware',
      name: 'Hardware Store',
      icon: <Package className="h-6 w-6" />,
      description: 'Tools, building materials, and home improvement items'
    },
    {
      id: 'electronics',
      name: 'Electronics Store',
      icon: <Package className="h-6 w-6" />,
      description: 'Electronic devices, gadgets, and accessories'
    },
    {
      id: 'convenience',
      name: 'Convenience Store',
      icon: <Store className="h-6 w-6" />,
      description: 'Snacks, beverages, and everyday essentials'
    },
    {
      id: 'beauty',
      name: 'Beauty Supply Store',
      icon: <User className="h-6 w-6" />,
      description: 'Cosmetics, skincare, and personal care products'
    },
    {
      id: 'custom',
      name: 'Custom Store Type',
      icon: <Package className="h-6 w-6" />,
      description: 'Define your own store category'
    },
  ];
  
  const filteredOptions = searchQuery
    ? nicheOptions.filter(option => 
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nicheOptions;
  
  const handleNicheSelect = (id: string) => {
    setSelectedNiche(id);
    if (id === 'custom') {
      setStep('customize');
    }
  };
  
  const handleContinue = () => {
    if (selectedNiche === 'custom') {
      if (!customNiche.trim()) {
        toast.error('Please enter a custom store type');
        return;
      }
      onSelect(customNiche);
    } else if (selectedNiche) {
      const selected = nicheOptions.find(option => option.id === selectedNiche);
      if (selected) {
        onSelect(selected.name);
      }
    } else {
      toast.error('Please select a store type');
      return;
    }
    
    toast.success('Store type selected');
    onOpenChange(false);
  };
  
  const handleBack = () => {
    if (step === 'customize') {
      setStep('select');
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Select Your Shop Type</CardTitle>
        <CardDescription>
          This helps us optimize your inventory management experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search store types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedNiche === option.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleNicheSelect(option.id)}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          selectedNiche === option.id ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {option.icon}
                        </div>
                        <h3 className="font-medium text-lg">{option.name}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      
                      {selectedNiche === option.id && (
                        <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {filteredOptions.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium">No matching store types</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try a different search term or select "Custom Store Type"
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
          
          {step === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-8 space-y-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium">Custom Store Type</h3>
                  <p className="text-muted-foreground max-w-md">
                    Let us know what type of store you're managing to help us provide the best experience
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom-niche">Store Type</Label>
                  <Input
                    id="custom-niche"
                    placeholder="e.g., Pet Store, Sports Shop, etc."
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        {step === 'customize' ? (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div></div> /* Empty div to maintain flex layout */
        )}
        <Button onClick={handleContinue}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopNicheSelector;
