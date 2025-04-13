
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Loader2 } from 'lucide-react';

export interface QuickBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript?: string; // Make this optional
}

const QuickBillDialog: React.FC<QuickBillDialogProps> = ({
  open,
  onOpenChange,
  transcript = '' // Default value
}) => {
  const { products, currentBill, startNewBill, addToBill, completeBill } = useInventory();
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<{ product: string; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Process transcript to extract items
  useEffect(() => {
    if (transcript) {
      setIsProcessing(true);
      
      try {
        // Simple regex to extract product quantities
        // Format: "create bill for 2 rice 3 sugar"
        const matches = transcript.toLowerCase().match(/(\d+)\s+([a-z]+)/g);
        
        if (matches) {
          const extractedItems = matches.map(match => {
            const [quantity, product] = match.split(/\s+/, 2);
            return { 
              product: product.trim(), 
              quantity: parseInt(quantity.trim()) 
            };
          });
          
          setItems(extractedItems);
        }
      } catch (error) {
        console.error('Error processing voice command:', error);
      }
      
      setIsProcessing(false);
    }
  }, [transcript]);
  
  const handleAddItem = () => {
    setItems([...items, { product: '', quantity: 1 }]);
  };
  
  const handleItemChange = (index: number, field: 'product' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  const handleCreateBill = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Start a new bill if one doesn't exist
      if (!currentBill) {
        startNewBill();
      }
      
      // Add each item to the bill
      items.forEach(item => {
        const product = products.find(p => 
          p.name.toLowerCase().includes(item.product.toLowerCase())
        );
        
        if (product) {
          addToBill(product.id, item.quantity);
        } else {
          toast.warning(`Product "${item.product}" not found`);
        }
      });
      
      toast.success('Bill created successfully');
      onOpenChange(false);
      setItems([]);
      setCustomerName('');
      setCustomerPhone('');
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Bill Creator</DialogTitle>
          <DialogDescription>
            Quickly create a bill with multiple items
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bill Items</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddItem}
                type="button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No items added yet</p>
                <p className="text-xs mt-1">Add items or use voice command</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      type="number"
                      min="1"
                      className="w-20"
                    />
                    <Input
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      placeholder="Product name"
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveItem(index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {transcript && (
              <div className="bg-muted p-2 rounded text-sm mt-2">
                <p className="text-xs font-medium">Voice command:</p>
                <p>{transcript}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBill}
            disabled={isProcessing || items.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Create Bill</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickBillDialog;
