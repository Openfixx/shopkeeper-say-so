
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package2, 
  Plus, 
  Search 
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
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('add')) {
      // Extract product information using regex
      const productInfo = lowerCommand.replace(/add/i, '').trim();
      
      // Simple regex patterns to extract information
      const quantityMatch = productInfo.match(/(\d+)\s*(kg|g|l|ml)/i);
      const expiryMatch = productInfo.match(/expiry\s+(\w+\s+\d{4})/i);
      const rackMatch = productInfo.match(/rack\s+(\d+)/i);
      
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        const unit = quantityMatch[2].toLowerCase();
        
        // Get product name by removing extracted parts
        let productName = productInfo
          .replace(quantityMatch[0], '')
          .replace(expiryMatch ? expiryMatch[0] : '', '')
          .replace(rackMatch ? rackMatch[0] : '', '')
          .trim();
        
        // Remove common words like "of", "on", "with"
        productName = productName.replace(/\s+(of|on|with)\s+/g, ' ').trim();
        
        setFormData({
          name: productName.charAt(0).toUpperCase() + productName.slice(1),
          quantity,
          unit,
          position: rackMatch ? `Rack ${rackMatch[1]}` : '',
          expiry: expiryMatch ? expiryMatch[1] : '',
          price: 0,
          image: '',
        });
        
        setIsAddDialogOpen(true);
      } else {
        toast.info('Could not identify product details from voice command');
      }
    } else if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      const searchTerm = lowerCommand
        .replace(/search|find/i, '')
        .trim();
      
      if (searchTerm) {
        setSearchQuery(searchTerm);
        toast.info(`Searching for "${searchTerm}"`);
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
          <Input
            id="image"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
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
          />
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
    </div>
  );
};

export default Products;
