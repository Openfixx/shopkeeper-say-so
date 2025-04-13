
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
      whileHover={{ y: -5 }}
      className="card-wallet"
    >
      <Card className={cn("border-none shadow-md overflow-hidden rounded-3xl", className)}>
        <div className="relative h-48 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
        
        <CardHeader className="pb-2 relative z-10 -mt-16 pt-0">
          <div className="flex flex-col text-white pt-8">
            <h3 className="font-medium text-xl">{product.name}</h3>
            <div className="flex items-center text-white/80 text-sm">
              <MapPin className="mr-1 h-3 w-3" />
              <p>{product.position}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-medium text-lg">
                ${product.price.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="font-medium">
                {product.quantity} {product.unit}
              </span>
            </div>
            
            {product.expiry && (
              <div className="flex flex-col col-span-2 mt-2 pt-2 border-t">
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
        
        <CardFooter className="flex justify-between pt-2 border-t">
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(product)} className="rounded-xl">
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="text-destructive rounded-xl" onClick={() => onDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {onAddToBill && (
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={() => onAddToBill(product.id, 1)}>
              <Plus className="h-4 w-4 mr-1" /> Add to Bill
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
