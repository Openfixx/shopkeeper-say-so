import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/context/InventoryContext';
import { identifyShelves, ShelfCoordinate, IdentifyShelvesResult } from '@/utils/voiceCommandUtils';

interface RackMappingProps {
  products: Product[];
  onSelectProduct?: (productId: string) => void;
}

interface ShelfProduct {
  productId: string;
  name: string;
  image?: string;
  position: string;
  shelfNumber: number;
}

const RackMapping: React.FC<RackMappingProps> = ({ products, onSelectProduct }) => {
  const [rackImage, setRackImage] = useState<string | null>(null);
  const [shelfCoordinates, setShelfCoordinates] = useState<ShelfCoordinate[]>([]);
  const [shelfProducts, setShelfProducts] = useState<ShelfProduct[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  
  // Map products to shelves based on their position
  useEffect(() => {
    if (products.length > 0 && shelfCoordinates.length > 0) {
      const mappedProducts: ShelfProduct[] = [];
      
      products.forEach(product => {
        // Extract shelf/rack number from position (e.g., "Rack 7" -> 7)
        const positionMatch = product.position.match(/\d+/);
        if (positionMatch) {
          const shelfNumber = parseInt(positionMatch[0]);
          
          // Only map if the shelf number is valid for our coordinates
          if (shelfNumber > 0 && shelfNumber <= shelfCoordinates.length) {
            mappedProducts.push({
              productId: product.id,
              name: product.name,
              image: product.image,
              position: product.position,
              shelfNumber: shelfNumber
            });
          }
        }
      });
      
      setShelfProducts(mappedProducts);
    }
  }, [products, shelfCoordinates]);
  
  const handleRackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setRackImage(imageUrl);
        
        // Analyze the rack image for shelves
        const result: IdentifyShelvesResult = identifyShelves(imageUrl);
        setShelfCoordinates(result.shelfCoordinates);
        
        toast.success(`Rack image uploaded with ${result.shelfCoordinates.length} shelves identified`);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const captureRackImage = () => {
    // Create an input element for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;
          setRackImage(imageUrl);
          
          // Analyze the rack image for shelves
          const result: IdentifyShelvesResult = identifyShelves(imageUrl);
          setShelfCoordinates(result.shelfCoordinates);
          
          toast.success(`Rack image captured with ${result.shelfCoordinates.length} shelves identified`);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };
  
  const handleSearch = (productId: string) => {
    // Find the product's shelf and highlight it
    const product = shelfProducts.find(p => p.productId === productId);
    if (product) {
      setSelectedShelf(product.shelfNumber);
      setHighlight(productId);
      
      setTimeout(() => {
        setHighlight(null);
      }, 3000); // Remove highlight after 3 seconds
      
      toast.success(`Found ${product.name} on ${product.position}`);
    } else {
      toast.error('Product location not found in rack map');
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Rack Mapping</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Find Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Find Product Location</DialogTitle>
                <DialogDescription>
                  Select a product to locate on the rack map
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4 max-h-[60vh] overflow-y-auto">
                {products.map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="justify-start h-auto py-2"
                    onClick={() => {
                      handleSearch(product.id);
                      if (onSelectProduct) onSelectProduct(product.id);
                    }}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.position || 'No location set'}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Upload a image of your store racks to map product locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rackImage ? (
          <div className="relative border rounded-lg overflow-hidden">
            <img 
              src={rackImage} 
              alt="Store Racks" 
              className="w-full max-h-[400px] object-contain"
            />
            
            {/* Shelves overlay */}
            {shelfCoordinates.map((coord, index) => (
              <div
                key={index}
                className={`absolute border-2 ${
                  selectedShelf === index + 1 ? 'border-primary animate-pulse' : 'border-dashed border-gray-400'
                }`}
                style={{
                  top: `${coord.top}%`,
                  left: `${coord.left}%`,
                  width: `${coord.width}%`,
                  height: `${coord.height}%`,
                }}
              >
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs px-1 rounded-br">
                  Shelf {index + 1}
                </div>
                
                {/* Products on this shelf */}
                <div className="absolute inset-0 flex items-center flex-wrap gap-1 p-1 overflow-hidden">
                  {shelfProducts
                    .filter(product => product.shelfNumber === index + 1)
                    .map(product => (
                      <div
                        key={product.productId}
                        className={`flex items-center bg-background/80 rounded p-1 border text-xs ${
                          highlight === product.productId ? 'border-primary ring-2 ring-primary animate-pulse' : 'border-muted'
                        }`}
                        title={product.name}
                      >
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="h-6 w-6 rounded object-cover mr-1" 
                          />
                        ) : (
                          <div className="h-6 w-6 bg-muted rounded mr-1" />
                        )}
                        <span className="truncate max-w-[60px]">{product.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            
            {/* Remove rack image button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={() => setRackImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Add shelf button */}
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-2 right-2 bg-background/80"
              onClick={() => {
                // Add a new mock shelf
                const newShelf = {
                  top: 70, // Position at the bottom
                  left: 0,
                  width: 100,
                  height: 20
                };
                setShelfCoordinates([...shelfCoordinates, newShelf]);
                toast.success('Added new shelf');
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Shelf
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-muted-foreground">
              Upload an image of your store racks to create a visual product map
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={captureRackImage}>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Label
                htmlFor="rack-image-upload"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
                <input
                  id="rack-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleRackImageUpload}
                />
              </Label>
            </div>
          </div>
        )}
        
        {/* Rack stats */}
        {rackImage && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted p-2 rounded">
              <div className="text-sm font-medium">Shelves</div>
              <div className="text-2xl font-bold">{shelfCoordinates.length}</div>
            </div>
            <div className="bg-muted p-2 rounded">
              <div className="text-sm font-medium">Mapped Products</div>
              <div className="text-2xl font-bold">{shelfProducts.length}</div>
            </div>
            <div className="bg-muted p-2 rounded">
              <div className="text-sm font-medium">Unmapped</div>
              <div className="text-2xl font-bold">{products.length - shelfProducts.length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RackMapping;
