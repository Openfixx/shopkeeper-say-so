
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/context/InventoryContext';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onAddToBill?: (id: string, quantity: number) => void;
  className?: string;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onAddToBill,
  className,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={cn("overflow-hidden border", className)}>
        <div className="relative h-48 overflow-hidden bg-muted">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-xl">{product.name}</h3>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <p className="text-sm">{product.position}</p>
              </div>
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              ${product.price.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="font-medium">
                {product.quantity} {product.unit}
              </span>
            </div>
            
            {product.expiry && (
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-3 w-3" /> Expiry
                </span>
                <span className="font-medium">
                  {new Date(product.expiry).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(product.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
              </Button>
            )}
          </div>
          
          {onAddToBill && (
            <Button size="sm" onClick={() => onAddToBill(product.id, 1)}>
              <Plus className="h-4 w-4 mr-1" /> Add to Bill
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
