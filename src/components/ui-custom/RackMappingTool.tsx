
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Image, Save, X, Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useInventory, Product } from '@/context/InventoryContext';

interface ShelfPosition {
  id: string;
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
  products: string[]; // product IDs
}

interface RackMappingToolProps {
  rackImage?: string;
  onSave?: (shelfData: ShelfPosition[]) => void;
  className?: string;
}

const RackMappingTool: React.FC<RackMappingToolProps> = ({
  rackImage,
  onSave,
  className,
}) => {
  const { products } = useInventory();
  const [imageUrl, setImageUrl] = useState<string | null>(rackImage || null);
  const [shelves, setShelves] = useState<ShelfPosition[]>([]);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'shelves' | 'products'>('shelves');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        toast.success('Rack image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCaptureImage = () => {
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
          setImageUrl(reader.result as string);
          toast.success('Rack image captured');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  
  const handleClickOnImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !isAddingShelf) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    
    // Create a new shelf with default size
    const newShelf: ShelfPosition = {
      id: Date.now().toString(),
      name: `Shelf ${shelves.length + 1}`,
      top: relativeY,
      left: relativeX,
      width: 15,
      height: 8,
      products: []
    };
    
    setShelves(prev => [...prev, newShelf]);
    setSelectedShelf(newShelf.id);
    setIsAddingShelf(false);
    toast.success(`Added ${newShelf.name}`);
  };
  
  const handleUpdateShelf = (id: string, updates: Partial<ShelfPosition>) => {
    setShelves(prev => prev.map(shelf => 
      shelf.id === id ? { ...shelf, ...updates } : shelf
    ));
  };
  
  const handleDeleteShelf = (id: string) => {
    setShelves(prev => prev.filter(shelf => shelf.id !== id));
    if (selectedShelf === id) {
      setSelectedShelf(null);
    }
    toast.success('Shelf deleted');
  };
  
  const handleAddProductToShelf = (shelfId: string, productId: string) => {
    setShelves(prev => prev.map(shelf => {
      if (shelf.id === shelfId) {
        if (shelf.products.includes(productId)) {
          return shelf;
        }
        return {
          ...shelf,
          products: [...shelf.products, productId]
        };
      }
      return shelf;
    }));
    
    toast.success('Product added to shelf');
  };
  
  const handleRemoveProductFromShelf = (shelfId: string, productId: string) => {
    setShelves(prev => prev.map(shelf => {
      if (shelf.id === shelfId) {
        return {
          ...shelf,
          products: shelf.products.filter(id => id !== productId)
        };
      }
      return shelf;
    }));
    
    toast.success('Product removed from shelf');
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave(shelves);
    }
    toast.success('Rack mapping saved');
  };
  
  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };
  
  if (!imageUrl) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Rack Mapping Tool</CardTitle>
          <CardDescription>
            Upload an image of your store shelves to map products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Image Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image of your shelves or racks to start mapping products
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleCaptureImage}>
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Label
                htmlFor="rack-image-upload"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
              >
                <Image className="mr-2 h-4 w-4" />
                Upload Image
                <input
                  id="rack-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Rack Mapping Tool</CardTitle>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Mapping
          </Button>
        </div>
        <CardDescription>
          Map your products to shelf locations for easy inventory management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="shelves" onValueChange={(value) => setEditMode(value as 'shelves' | 'products')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shelves">Edit Shelves</TabsTrigger>
            <TabsTrigger value="products">Map Products</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shelves" className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <Button 
                variant={isAddingShelf ? "default" : "outline"} 
                onClick={() => setIsAddingShelf(!isAddingShelf)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isAddingShelf ? "Click on Image to Add Shelf" : "Add Shelf"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  // Generate shelf suggestions based on image height
                  const numShelves = 5;
                  const newShelves: ShelfPosition[] = [];
                  
                  for (let i = 0; i < numShelves; i++) {
                    newShelves.push({
                      id: `auto-${Date.now()}-${i}`,
                      name: `Shelf ${i + 1}`,
                      top: 10 + (i * (80 / numShelves)),
                      left: 10,
                      width: 80,
                      height: 10,
                      products: []
                    });
                  }
                  
                  setShelves(newShelves);
                  toast.success(`Generated ${numShelves} shelf positions`);
                }}
              >
                Auto-Generate Shelves
              </Button>
            </div>
            
            <div 
              className="relative border rounded-lg overflow-hidden" 
              style={{ height: '400px' }}
              ref={imageContainerRef}
              onClick={handleClickOnImage}
            >
              <img 
                src={imageUrl} 
                alt="Rack" 
                className="w-full h-full object-contain"
              />
              
              {shelves.map((shelf) => (
                <motion.div
                  key={shelf.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "absolute border-2 rounded flex items-center justify-center cursor-pointer",
                    selectedShelf === shelf.id ? "border-primary bg-primary/20" : "border-blue-500 bg-blue-500/20"
                  )}
                  style={{
                    top: `${shelf.top}%`,
                    left: `${shelf.left}%`,
                    width: `${shelf.width}%`,
                    height: `${shelf.height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShelf(shelf.id);
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-md">
                    {shelf.name}
                  </span>
                </motion.div>
              ))}
            </div>
            
            {selectedShelf && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Edit Shelf</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="shelf-name">Shelf Name</Label>
                      <Input
                        id="shelf-name"
                        value={shelves.find(s => s.id === selectedShelf)?.name || ''}
                        onChange={(e) => handleUpdateShelf(selectedShelf, { name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleDeleteShelf(selectedShelf)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="shelf-top">Top (%)</Label>
                      <Input
                        id="shelf-top"
                        type="number"
                        min="0"
                        max="100"
                        value={shelves.find(s => s.id === selectedShelf)?.top || 0}
                        onChange={(e) => handleUpdateShelf(selectedShelf, { top: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shelf-left">Left (%)</Label>
                      <Input
                        id="shelf-left"
                        type="number"
                        min="0"
                        max="100"
                        value={shelves.find(s => s.id === selectedShelf)?.left || 0}
                        onChange={(e) => handleUpdateShelf(selectedShelf, { left: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shelf-width">Width (%)</Label>
                      <Input
                        id="shelf-width"
                        type="number"
                        min="1"
                        max="100"
                        value={shelves.find(s => s.id === selectedShelf)?.width || 0}
                        onChange={(e) => handleUpdateShelf(selectedShelf, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shelf-height">Height (%)</Label>
                      <Input
                        id="shelf-height"
                        type="number"
                        min="1"
                        max="100"
                        value={shelves.find(s => s.id === selectedShelf)?.height || 0}
                        onChange={(e) => handleUpdateShelf(selectedShelf, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <div className="flex space-x-3 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shelf-select" className="sr-only">Select Shelf</Label>
                <select
                  id="shelf-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedShelf || ''}
                  onChange={(e) => setSelectedShelf(e.target.value)}
                >
                  <option value="">Select a shelf</option>
                  {shelves.map((shelf) => (
                    <option key={shelf.id} value={shelf.id}>
                      {shelf.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div 
              className="relative border rounded-lg overflow-hidden" 
              style={{ height: '250px' }}
            >
              <img 
                src={imageUrl} 
                alt="Rack" 
                className="w-full h-full object-contain"
              />
              
              {shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  className={cn(
                    "absolute border-2 rounded flex flex-wrap items-start justify-start content-start p-1 overflow-hidden",
                    selectedShelf === shelf.id ? "border-primary bg-primary/20" : "border-blue-500 bg-blue-500/20"
                  )}
                  style={{
                    top: `${shelf.top}%`,
                    left: `${shelf.left}%`,
                    width: `${shelf.width}%`,
                    height: `${shelf.height}%`,
                  }}
                  onClick={() => setSelectedShelf(shelf.id)}
                >
                  <span className="text-xs font-bold text-white drop-shadow-md w-full mb-1">
                    {shelf.name}
                  </span>
                  
                  {shelf.products.map(productId => {
                    const product = getProductById(productId);
                    if (!product) return null;
                    
                    return (
                      <div 
                        key={productId}
                        className="relative w-8 h-8 m-0.5 bg-background rounded-sm overflow-hidden flex-shrink-0"
                        title={product.name}
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
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {selectedShelf && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">
                  Products on {shelves.find(s => s.id === selectedShelf)?.name}
                </h3>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {shelves.find(s => s.id === selectedShelf)?.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products mapped to this shelf yet</p>
                  ) : (
                    shelves.find(s => s.id === selectedShelf)?.products.map(productId => {
                      const product = getProductById(productId);
                      if (!product) return null;
                      
                      return (
                        <div key={productId} className="flex items-center justify-between bg-background rounded p-2">
                          <div className="flex items-center">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-8 h-8 rounded object-cover mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center mr-2">
                                <span className="text-xs">{product.name.charAt(0)}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveProductFromShelf(selectedShelf, productId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-3">Add Products</h3>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-3"
                  />
                  
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-2">No products found</p>
                    ) : (
                      filteredProducts
                        .filter(p => !shelves.find(s => s.id === selectedShelf)?.products.includes(p.id))
                        .map(product => (
                          <div 
                            key={product.id} 
                            className="flex items-center bg-background rounded p-2 cursor-pointer hover:bg-accent"
                            onClick={() => handleAddProductToShelf(selectedShelf, product.id)}
                          >
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-6 h-6 rounded object-cover mr-2"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center mr-2">
                                <span className="text-xs">{product.name.charAt(0)}</span>
                              </div>
                            )}
                            <span className="text-sm truncate">{product.name}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RackMappingTool;
