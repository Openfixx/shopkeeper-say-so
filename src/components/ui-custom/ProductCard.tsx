
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Edit2, Trash2, Package2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Product } from '@/types';
import { formatDistance } from 'date-fns';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    onDelete(product.id);
    setIsDeleteDialogOpen(false);
  };
  
  const isLowStock = product.quantity < 5;
  const hasExpiry = product.expiry && new Date(product.expiry) > new Date();
  const isExpiringSoon = product.expiry && 
    new Date(product.expiry) > new Date() && 
    new Date(product.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      onClick={() => setIsViewDialogOpen(true)}
    >
      <Card 
        className="overflow-hidden cursor-pointer transition-all duration-300 group h-[280px]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative h-40 bg-muted overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package2 className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isLowStock && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
            
            {isExpiringSoon && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                Expiring Soon
              </Badge>
            )}
            
            {!isLowStock && !isExpiringSoon && hasExpiry && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                In Stock
              </Badge>
            )}
          </div>
          
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-between p-3 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex gap-1">
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="default" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsViewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-1">
          <div className="flex justify-between items-start">
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
            <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
          </div>
          
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Stock: {product.quantity} {product.unit}
            </p>
            
            {product.position && (
              <p className="text-xs text-muted-foreground">
                {product.position}
              </p>
            )}
          </div>
          
          {product.expiry && (
            <p className="text-xs text-muted-foreground">
              Expiry: {new Date(product.expiry).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the product {product.name} from your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              Product details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="aspect-square rounded-md overflow-hidden bg-muted">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package2 className="h-16 w-16 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">{product.quantity} {product.unit}</p>
              </div>
              {product.position && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{product.position}</p>
                </div>
              )}
              {product.expiry && (
                <div>
                  <p className="text-sm text-muted-foreground">Expiry</p>
                  <p className="font-medium">
                    {new Date(product.expiry).toLocaleDateString()}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatDistance(new Date(product.expiry), new Date(), { addSuffix: true })})
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            {product.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleEdit}>
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProductCard;
