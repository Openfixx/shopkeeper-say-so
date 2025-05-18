
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/context/InventoryContext';
import { toast } from 'sonner';

interface ImageAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onAssigned: () => void;
}

const ImageAssignModal: React.FC<ImageAssignModalProps> = ({ open, onOpenChange, imageUrl, onAssigned }) => {
  const { products, updateProduct } = useInventory();
  const [productsWithoutImage, setProductsWithoutImage] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Filter products without images and sort alphabetically by name
      const withoutImage = products.filter(p => !p.image_url || p.image_url.trim() === '').sort((a, b) => a.name.localeCompare(b.name));
      setProductsWithoutImage(withoutImage);
    }
  }, [open, products]);

  const handleAssign = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product to assign this image');
      return;
    }
    const productToUpdate = products.find(p => p.id === selectedProductId);
    if (!productToUpdate) {
      toast.error('Selected product not found');
      return;
    }
    try {
      await updateProduct({
        ...productToUpdate,
        image_url: imageUrl,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Image assigned to ${productToUpdate.name}`);
      onOpenChange(false);
      onAssigned();
    } catch (error) {
      console.error('Error assigning image:', error);
      toast.error('Failed to assign image');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Image to Product</DialogTitle>
          <DialogDescription>Select a product to assign this image:</DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <img src={imageUrl} alt="To assign" className="w-full rounded-md object-cover max-h-64" />
        </div>
        <div className="mb-4 max-h-60 overflow-y-auto border rounded p-2">
          {productsWithoutImage.length === 0 && (<p className="text-sm text-muted-foreground">All products have images assigned.</p>)}
          <ul>
            {productsWithoutImage.map(product => (
              <li key={product.id} className="mb-2">
                <label className="flex items-center cursor-pointer space-x-2">
                  <input
                    type="radio"
                    name="product"
                    value={product.id}
                    checked={selectedProductId === product.id}
                    onChange={() => setSelectedProductId(product.id)}
                    className="form-radio"
                  />
                  <span>{product.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedProductId}>Assign Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAssignModal;
