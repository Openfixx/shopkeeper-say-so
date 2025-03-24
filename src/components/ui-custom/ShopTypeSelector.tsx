
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Smartphone, Shirt, Stethoscope } from 'lucide-react';

interface ShopTypeSelectorProps {
  onSelect?: (type: string) => void;
  hideTitle?: boolean;
}

const ShopTypeSelector: React.FC<ShopTypeSelectorProps> = ({ 
  onSelect,
  hideTitle = false
}) => {
  const { currentShopType, setShopType } = useInventory();
  
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
  
  const handleSelect = (type: string) => {
    setShopType(type);
    if (onSelect) onSelect(type);
  };
  
  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Select Your Shop Type</h2>
          <p className="text-muted-foreground">
            Choose the category that best fits your business
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shopTypes.map((type) => (
          <Card 
            key={type.id}
            className={`relative cursor-pointer transition-all ${
              currentShopType === type.name 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleSelect(type.name)}
          >
            <CardContent className="p-6 text-center">
              {type.icon}
              <h3 className="font-bold mb-1">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
              
              {currentShopType === type.name && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {currentShopType && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Current shop type: <span className="font-medium">{currentShopType}</span>
          </p>
          <Button 
            variant="link" 
            className="text-xs"
            onClick={() => handleSelect('')}
          >
            Change shop type
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShopTypeSelector;
