import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package2, 
  Plus, 
  Search,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useInventory, Product } from '@/context/InventoryContext';
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
import { 
  extractProductDetails, 
  searchProductImage, 
  detectCommandType, 
  VOICE_COMMAND_TYPES 
} from '@/utils/voiceCommandUtils';

interface ProductFormData {
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image?: string;
}

const initialFormData: ProductFormData = {
  name: '',
  quantity: 0,
  unit: 'kg',
  position: '',
  expiry: '',
  price: 0,
  image: '',
};

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const navigate = useNavigate();
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleVoiceCommand = async (command: string) => {
    setCurrentTranscript(command);
    const lowerCommand = command.toLowerCase();
    
    const commandInfo = detectCommandType(command);
    
    if (commandInfo.type === VOICE_COMMAND_TYPES.ADD_PRODUCT) {
      setIsProcessingVoice(true);
      
      try {
        const productDetails = await extractProductDetails(command);
        
        if (productDetails.name) {
          if (!productDetails.image && productDetails.name) {
            try {
              const imageUrl = await searchProductImage(productDetails.name);
              if (imageUrl) {
                productDetails.image = imageUrl;
                toast.success('Product image found automatically');
              }
            } catch (error) {
              console.error('Failed to fetch product image:', error);
            }
          }
          
          setFormData({
            name: productDetails.name || '',
            quantity: productDetails.quantity || 0,
            unit: productDetails.unit || 'kg',
            position: productDetails.position || '',
            expiry: productDetails.expiry || '',
            price: productDetails.price || 0,
            image: productDetails.image || '',
          });
          
          setIsAddDialogOpen(true);
          toast.success(`Product details extracted: ${productDetails.name}`);
        } else {
          setIsAddDialogOpen(true);
          toast.info('Please provide product details');
        }
      } catch (error) {
        console.error('Error extracting product details:', error);
        toast.error('Failed to process product details');
        setIsAddDialogOpen(true);
      }
      
      setIsProcessingVoice(false);
    } else if (commandInfo.type === VOICE_COMMAND_TYPES.CREATE_BILL) {
      navigate('/billing');
      toast.success('Opening billing page');
    } else if (commandInfo.type === VOICE_COMMAND_TYPES.SEARCH_PRODUCT) {
      if (commandInfo.data?.searchTerm) {
        setSearchQuery(commandInfo.data.searchTerm);
        toast.info(`Searching for "${commandInfo.data.searchTerm}"`);
      } else {
        toast.info('Please specify what to search for');
      }
    } else {
      toast.info(`Command not recognized: "${command}"`);
    }
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
          image: imageUrl
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
            image: imageUrl
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
      const imageUrl = await searchProductImage(formData.name);
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          image: imageUrl
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
      updateProduct(editingProductId, formData);
      setIsEditDialogOpen(false);
    } else {
      addProduct(formData);
      setIsAddDialogOpen(false);
    }
    
    setFormData(initialFormData);
    setEditingProductId(null);
  };
  
  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      position: product.position,
      expiry: product.expiry,
      price: product.price,
      image: product.image,
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
              value={formData.image}
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
            
            {formData.image && (
              <div className="relative border rounded-md overflow-hidden h-40">
                <img 
                  src={formData.image} 
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
          filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
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

      {currentTranscript && (
        <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Voice Command</DialogTitle>
              <DialogDescription>
                Processing your voice command...
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Transcript:</p>
              <p className="text-sm">{currentTranscript}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Products;
