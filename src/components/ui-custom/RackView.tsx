
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Image, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useInventory, Product } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';

interface ShelfPosition {
  id: string;
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
  products: string[]; // product IDs
}

interface RackViewProps {
  rackImage?: string;
  shelves?: ShelfPosition[];
  searchTerm?: string;
  onEditRack?: () => void;
  className?: string;
}

const RackView: React.FC<RackViewProps> = ({
  rackImage,
  shelves = [],
  searchTerm = '',
  onEditRack,
  className,
}) => {
  const { products } = useInventory();
  const navigate = useNavigate();
  const [highlightedProducts, setHighlightedProducts] = useState<string[]>([]);
  const [activeShelf, setActiveShelf] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Demo rack images
  const demoRackImages = [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c2hlbHZlc3xlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1600566752355-35792bedaef0?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c2hlbHZlc3xlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c2hlbHZlc3xlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
  ];
  
  const currentRackImage = rackImage || demoRackImages[currentImageIndex];
  
  useEffect(() => {
    if (searchTerm) {
      const matchingProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(p => p.id);
      
      setHighlightedProducts(matchingProducts);
      
      // Highlight shelf containing these products
      const shelfWithProduct = shelves.find(shelf => 
        shelf.products.some(productId => matchingProducts.includes(productId))
      );
      
      if (shelfWithProduct) {
        setActiveShelf(shelfWithProduct.id);
        toast.info(`Found on ${shelfWithProduct.name}`);
      } else {
        setActiveShelf(null);
      }
    } else {
      setHighlightedProducts([]);
      setActiveShelf(null);
    }
  }, [searchTerm, products, shelves]);
  
  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };
  
  // Demo shelves for visualization
  const demoShelves: ShelfPosition[] = shelves.length > 0 ? shelves : [
    {
      id: '1',
      name: 'Top Shelf',
      top: 10,
      left: 10,
      width: 80,
      height: 15,
      products: products.slice(0, 3).map(p => p.id)
    },
    {
      id: '2',
      name: 'Middle Shelf',
      top: 35,
      left: 10,
      width: 80,
      height: 15,
      products: products.slice(3, 6).map(p => p.id)
    },
    {
      id: '3',
      name: 'Bottom Shelf',
      top: 60,
      left: 10,
      width: 80,
      height: 15,
      products: products.slice(6, 9).map(p => p.id)
    }
  ];
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Store Layout</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : demoRackImages.length - 1))}
              disabled={!!rackImage}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentImageIndex((prev) => (prev < demoRackImages.length - 1 ? prev + 1 : 0))}
              disabled={!!rackImage}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            {onEditRack && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onEditRack}
              >
                <Image className="mr-2 h-4 w-4" />
                Edit Layout
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="relative border rounded-lg overflow-hidden" 
          style={{ height: '400px' }}
        >
          <img 
            src={currentRackImage} 
            alt="Rack" 
            className="w-full h-full object-cover"
          />
          
          {demoShelves.map((shelf) => (
            <div
              key={shelf.id}
              className={cn(
                "absolute border-2 rounded flex flex-wrap items-start justify-start content-start gap-1 p-1 overflow-hidden cursor-pointer transition-all duration-300",
                activeShelf === shelf.id
                  ? "border-primary bg-primary/30" 
                  : shelf.products.some(id => highlightedProducts.includes(id))
                    ? "border-yellow-500 bg-yellow-500/20"
                    : "border-blue-500/50 bg-blue-500/10"
              )}
              style={{
                top: `${shelf.top}%`,
                left: `${shelf.left}%`,
                width: `${shelf.width}%`,
                height: `${shelf.height}%`,
              }}
              onClick={() => setActiveShelf(shelf.id === activeShelf ? null : shelf.id)}
            >
              <span className="text-xs font-bold text-white drop-shadow-md w-full mb-1">
                {shelf.name}
              </span>
              
              {shelf.products.map(productId => {
                const product = getProductById(productId);
                if (!product) return null;
                
                const isHighlighted = highlightedProducts.includes(productId);
                
                return (
                  <motion.div 
                    key={productId}
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: isHighlighted ? [1, 1.1, 1] : 1,
                      borderColor: isHighlighted ? "rgba(234, 179, 8, 1)" : "rgba(255, 255, 255, 0.5)"
                    }}
                    transition={{ 
                      duration: 0.5,
                      repeat: isHighlighted ? Infinity : 0,
                      repeatType: "reverse"
                    }}
                    className={cn(
                      "relative w-10 h-10 bg-background rounded-sm overflow-hidden border-2 flex-shrink-0",
                      isHighlighted ? "border-yellow-500 z-10" : "border-white/50"
                    )}
                    title={product.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products?id=${product.id}`);
                    }}
                  >
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-[8px] text-center p-0.5">
                        {product.name}
                      </div>
                    )}
                    
                    {isHighlighted && (
                      <motion.div
                        className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.7, 0] }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity
                        }}
                      >
                        <Search className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        
        {activeShelf && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">
              {demoShelves.find(s => s.id === activeShelf)?.name} Products
            </h3>
            <div className="flex flex-wrap gap-2">
              {demoShelves
                .find(s => s.id === activeShelf)
                ?.products.map(productId => {
                  const product = getProductById(productId);
                  if (!product) return null;
                  
                  const isHighlighted = highlightedProducts.includes(productId);
                  
                  return (
                    <div 
                      key={productId}
                      className={cn(
                        "flex items-center space-x-2 bg-background rounded p-2",
                        isHighlighted && "ring-2 ring-yellow-500"
                      )}
                      onClick={() => navigate(`/products?id=${product.id}`)}
                    >
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs">{product.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm">{product.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RackView;
