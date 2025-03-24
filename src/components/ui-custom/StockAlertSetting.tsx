
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Bell, Plus } from 'lucide-react';
import { useInventory, Product } from '@/context/InventoryContext';
import { toast } from 'sonner';

type StockAlertSettingProps = {
  product: Product;
  trigger?: React.ReactNode;
};

const StockAlertSetting: React.FC<StockAlertSettingProps> = ({ 
  product,
  trigger 
}) => {
  const { setStockAlert, removeStockAlert, stockAlerts } = useInventory();
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(product.stockAlert || Math.ceil(product.quantity * 0.2));
  
  const existingAlert = stockAlerts.find(a => a.productId === product.id);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (threshold <= 0) {
      toast.error('Threshold must be greater than zero');
      return;
    }
    
    if (threshold > product.quantity) {
      toast.warning('Threshold is higher than current stock. Alert will trigger immediately.');
    }
    
    setStockAlert(product.id, threshold);
    setOpen(false);
    
    toast.success(`Stock alert set for ${product.name}`);
  };
  
  const handleRemove = () => {
    if (existingAlert) {
      removeStockAlert(existingAlert.id);
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Stock Alert for {product.name}
            </DialogTitle>
            <DialogDescription>
              Receive a notification when this item's stock falls below the threshold
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input
                id="current-stock"
                value={`${product.quantity} ${product.unit}`}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Alert Threshold ({product.unit})</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                You'll be notified when stock falls below this level
              </p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            {existingAlert && (
              <Button 
                type="button"
                variant="outline" 
                className="text-destructive hover:text-destructive" 
                onClick={handleRemove}
              >
                Remove Alert
              </Button>
            )}
            <Button type="submit">
              {existingAlert ? 'Update Alert' : 'Set Alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAlertSetting;
