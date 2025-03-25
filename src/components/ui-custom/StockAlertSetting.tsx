
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Save } from 'lucide-react';
import { useInventory, Product } from '@/context/InventoryContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockAlertSettingProps {
  product?: Product;
  productId?: string;
}

const StockAlertSetting: React.FC<StockAlertSettingProps> = ({ product, productId }) => {
  const { setStockAlert, removeStockAlert, stockAlerts, products } = useInventory();
  const [threshold, setThreshold] = useState<number>(10);
  const [selectedProduct, setSelectedProduct] = useState<string>(productId || '');
  
  const handleSetAlert = () => {
    if (selectedProduct) {
      setStockAlert(selectedProduct, threshold);
    }
  };
  
  const handleRemoveAlert = () => {
    if (selectedProduct) {
      removeStockAlert(selectedProduct);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Alert Settings</CardTitle>
        <CardDescription>Set alerts for low stock items</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!product && (
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Alert Threshold</label>
          <Input 
            type="number" 
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            min={1}
          />
          <p className="text-xs text-muted-foreground">
            You'll be notified when stock falls below this number
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleRemoveAlert}>
          <BellOff className="mr-2 h-4 w-4" />
          Remove Alert
        </Button>
        <Button onClick={handleSetAlert}>
          <Bell className="mr-2 h-4 w-4" />
          Set Alert
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StockAlertSetting;
