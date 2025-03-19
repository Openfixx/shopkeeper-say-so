
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package2, Camera, Image, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory, Product } from '@/context/InventoryContext';
import { toast } from 'sonner';

interface RackViewProps {
  className?: string;
}

const RackView: React.FC<RackViewProps> = ({ className }) => {
  const { products, isLoading } = useInventory();
  const navigate = useNavigate();
  const [rackImage, setRackImage] = React.useState<string | null>(null);
  
  // Group products by rack position
  const productsByRack = React.useMemo(() => {
    if (!products.length) return {};
    
    const grouped: Record<string, Product[]> = {};
    
    products.forEach(product => {
      const rack = product.position.match(/rack\s*(\d+)/i)?.[0] || 'Other';
      if (!grouped[rack]) {
        grouped[rack] = [];
      }
      grouped[rack].push(product);
    });
    
    return grouped;
  }, [products]);
  
  const handleRackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRackImage(reader.result as string);
        toast.success('Rack image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-20" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-40" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] bg-muted/30 rounded-md flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Rack View</CardTitle>
            <CardDescription>Visualize products by rack location</CardDescription>
          </div>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              {rackImage ? 'Change Image' : 'Upload Image'}
            </Button>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleRackImageUpload}
            />
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {rackImage ? (
          <div className="relative rounded-md overflow-hidden">
            <img
              src={rackImage}
              alt="Rack"
              className="w-full h-[220px] object-cover"
            />
            
            {Object.keys(productsByRack).length > 0 ? (
              <div className="absolute inset-0 p-4">
                <div className="grid grid-cols-3 gap-2 h-full">
                  {Object.entries(productsByRack).map(([rack, products], index) => (
                    <div 
                      key={rack} 
                      className="relative bg-background/60 backdrop-blur-sm rounded-md p-2 overflow-y-auto"
                    >
                      <h4 className="text-xs font-semibold mb-1">{rack}</h4>
                      <div className="space-y-1">
                        {products.map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-1 bg-background/80 rounded p-1 cursor-pointer"
                            onClick={() => navigate(`/products?edit=${product.id}`)}
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                                <Package2 className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <span className="text-xs truncate">{product.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground opacity-40 mx-auto mb-2" />
                  <p className="text-sm font-medium">No rack positions defined</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add rack positions to your products to visualize them here
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[220px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-4 text-center">
            <Image className="h-10 w-10 text-muted-foreground opacity-40 mb-2" />
            <h3 className="text-sm font-medium">No rack image uploaded</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Upload an image of your shop's racks to visualize inventory
            </p>
            <label className="cursor-pointer mt-3">
              <Button variant="outline" size="sm">
                <Camera className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleRackImageUpload}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RackView;
