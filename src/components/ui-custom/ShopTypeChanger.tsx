
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Store, Building, Building2, ShoppingBag, Package, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';

export const SHOP_TYPES = [
  { id: 'grocery', name: 'Grocery', icon: ShoppingBag },
  { id: 'electronics', name: 'Electronics', icon: Package },
  { id: 'clothing', name: 'Clothing', icon: Building },
  { id: 'pharmacy', name: 'Pharmacy', icon: Building2 },
  { id: 'general', name: 'General Store', icon: Store },
];

interface ShopTypeChangerProps {
  currentType?: string;
  onTypeChange: (type: string) => void;
}

const ShopTypeChanger: React.FC<ShopTypeChangerProps> = ({ 
  currentType = 'grocery',
  onTypeChange 
}) => {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState(currentType);
  const [isEditing, setIsEditing] = useState(false);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  const handleSave = () => {
    onTypeChange(selectedType);
    setIsEditing(false);
    toast.success(`Shop type changed to ${SHOP_TYPES.find(t => t.id === selectedType)?.name || selectedType}`);
  };

  // Get the current type details
  const currentTypeDetails = SHOP_TYPES.find(t => t.id === currentType) || SHOP_TYPES[0];
  const IconComponent = currentTypeDetails.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Shop Type</span>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Change
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Set the type of shop you are managing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <RadioGroup value={selectedType} onValueChange={handleTypeChange} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_TYPES.map((type) => {
              const TypeIcon = type.icon;
              return (
                <div key={type.id} className="relative">
                  <RadioGroupItem 
                    value={type.id} 
                    id={type.id} 
                    className="peer sr-only" 
                  />
                  <Label
                    htmlFor={type.id}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <TypeIcon className="mb-3 h-6 w-6" />
                    <span className="text-center">{type.name}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        ) : (
          <div className="flex items-center gap-4 p-4 border rounded-md">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{currentTypeDetails.name}</h3>
              <p className="text-sm text-muted-foreground">
                {language === 'hi-IN' ? 'वर्तमान दुकान का प्रकार' : 'Current shop type'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setSelectedType(currentType);
            setIsEditing(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ShopTypeChanger;
