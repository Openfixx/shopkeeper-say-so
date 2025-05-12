
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package2, 
  Plus, 
  Search,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Product as TypesProduct } from '@/types';
import ProductCard from '@/components/ui-custom/ProductCard';
import SearchBar from '@/components/ui-custom/SearchBar';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CommandResult } from '@/lib/voice';
import VoiceCommandPopup from '@/components/ui-custom/VoiceCommandPopup';
import { MultiProduct, parseMultiProductCommand } from '@/utils/multiVoiceParse';
import MultiProductAddToast from '@/components/ui-custom/MultiProductAddToast';
import { getCachedImage } from '@/utils/fetchImage';
import { convertProduct } from '@/utils/productUtils';

interface ProductFormData {
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image_url?: string;
}

const initialFormData: ProductFormData = {
  name: '',
  quantity: 0,
  unit: 'kg',
  position: '',
  expiry: '',
  price: 0,
  image_url: '',
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [multiProducts, setMultiProducts] = useState<MultiProduct[]>([]);
  const [showMultiProductToast, setShowMultiProductToast] = useState(false);
  const navigate = useNavigate();
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleVoiceCommand = async (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => {
    console.log("Voice command:", command);
    console.log("Processed product:", processedProduct);
    
    // Check if it's a multi-product command by looking for commas or "and"
    if (command.includes(',') || /\band\b/i.test(command)) {
      // Use our multi-product parser
      const productNames = products.map(p => ({ name: p.name }));
      const parsedProducts = parseMultiProductCommand(command, productNames);
      
      if (parsedProducts.length > 0) {
        setMultiProducts(parsedProducts);
        setShowMultiProductToast(true);
        
        // Add all products with a delay
        parsedProducts.forEach((product, index) => {
          setTimeout(() => {
            addProduct({
              name: product.name,
              quantity: product.quantity || 1,
              unit: product.unit || 'unit',
              price: product.price || 0,
              position: 'Default', 
              image_url: ''
            });
          }, index * 800);
        });
        
        return;
      }
    }
    
    // Handle single product command
    if (command.toLowerCase().includes('add') && processedProduct.name) {
      const productName = processedProduct.name;
      setIsProcessingCommand(true);
      
      try {
        // Try to get a product image
        const imageUrl = await getCachedImage(productName);
        
        const result: CommandResult = {
          productName,
          quantity: processedProduct.quantity ? 
            { value: processedProduct.quantity, unit: processedProduct.unit || 'unit' } : 
            { value: 1, unit: 'unit' },
          imageUrl,
          rawText: command
        };
        
        setCommandResult(result);
      } catch (error) {
        console.error("Error processing command:", error);
        toast.error("Error processing voice command");
      } finally {
        setIsProcessingCommand(false);
      }
    } else if (command.toLowerCase().includes('search') || command.toLowerCase().includes('find')) {
      // Handle search command
      setSearchQuery(processedProduct.name || '');
    }
  };
  
  const handleConfirmProduct = () => {
    if (!commandResult) return;
    
    setIsProcessingCommand(true);
    
    addProduct({
      name: commandResult.productName,
      quantity: commandResult.quantity?.value || 1,
      unit: commandResult.quantity?.unit || 'unit',
      price: commandResult.price || 0,
      position: commandResult.position || 'Default',
      image_url: commandResult.imageUrl || ''
    });
    
    toast.success(`Added ${commandResult.productName} to inventory`);
    
    setIsProcessingCommand(false);
    setCommandResult(null);
  };
  
  const handleCancelCommand = () => {
    setCommandResult(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setFormData(prev => ({
          ...prev,
          image_url: imageUrl
        }));
        toast.success('Product image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImage = () => {
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
          setFormData(prev => ({
            ...prev,
            image_url: imageUrl
          }));
          toast.success('Product image captured');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const findProductImage = async () => {
    if (!formData.name) {
      toast.error('Please enter a product name first');
      return;
    }
    
    toast.loading('Searching for product image...');
    
    try {
      const imageUrl = await getCachedImage(formData.name);
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          image_url: imageUrl
        }));
        toast.dismiss();
        toast.success('Product image found');
      } else {
        toast.dismiss();
        toast.error('No image found for this product');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to find product image');
      console.error('Error finding product image:', error);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProductId) {
      const product = convertProduct(products.find(p => p.id === editingProductId));
      if (!product) return;
      
      const updatedProduct = {
        ...product,
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        position: formData.position,
        price: formData.price,
        image_url: formData.image_url
      };
      
      updateProduct(editingProductId, updatedProduct);
      setIsEditDialogOpen(false);
    } else {
      addProduct({
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        position: formData.position,
        price: formData.price,
        image_url: formData.image_url
      });
      setIsAddDialogOpen(false);
    }
    
    setFormData(initialFormData);
    setEditingProductId(null);
  };
  
  const handleEdit = (productToEdit: any) => {
    const product = {
      ...convertProduct(productToEdit),
      updatedAt: productToEdit.updatedAt || new Date().toISOString(),
      userId: productToEdit.userId || productToEdit.user_id || 'demo-user'
    };
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      position: product.position || '',
      expiry: product.expiry || '',
      price: product.price,
      image_url: product.image_url || product.image || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteProduct(id);
  };
  
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Sugar, Rice, etc."
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <div className="flex space-x-2">
            <Input
              id="image"
              name="image"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={findProductImage}
              title="Search for product image online"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            placeholder="kg, g, l, ml, etc."
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="Rack 7"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            name="expiry"
            type="date"
            value={formData.expiry}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>Product Image</Label>
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={captureImage}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture Image
              </Button>
              
              <Label
                htmlFor="product-image-upload"
                className="flex-1 cursor-pointer flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload from Gallery
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
            
            {formData.image_url && (
              <div className="relative border rounded-md overflow-hidden h-40">
                <img 
                  src={formData.image_url} 
                  alt={formData.name || 'Product'} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit">
          {editingProductId ? 'Update Product' : 'Add Product'}
        </Button>
      </DialogFooter>
    </form>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <div className="flex space-x-2">
          <VoiceCommandButton 
            onVoiceCommand={handleVoiceCommand}
            showDialog={true}
            label="Voice Command"
            size="default"
          />
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new product to your inventory.
                </DialogDescription>
              </DialogHeader>
              {renderForm()}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          placeholder="Search products..."
          onSearch={handleSearch}
          className="w-full sm:w-96"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => {
            const convertedProduct = convertProduct(product);
            return (
              <ProductCard
                key={product.id}
                product={convertedProduct}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-12 space-y-3">
            <Package2 className="h-12 w-12 text-muted-foreground opacity-20" />
            <div>
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? `No products matching "${searchQuery}"`
                  : "Start by adding your first product"}
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new product to your inventory.
                  </DialogDescription>
                </DialogHeader>
                {renderForm()}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details in your inventory.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>
      
      {/* Voice Command Popup */}
      {commandResult && (
        <VoiceCommandPopup
          result={commandResult}
          onConfirm={handleConfirmProduct}
          onCancel={handleCancelCommand}
          loading={isProcessingCommand}
        />
      )}
      
      {showMultiProductToast && (
        <MultiProductAddToast 
          products={multiProducts} 
          onClose={() => setShowMultiProductToast(false)}
          onComplete={() => {
            toast.success(`Added ${multiProducts.length} products to inventory`);
          }}
        />
      )}
    </div>
  );
};

export default Products;
