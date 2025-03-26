import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventory } from '@/context/InventoryContext';
import { Camera, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { extractProductDetails, searchProductImage } from '@/utils/voiceCommandUtils';
import { processWithSpacy } from '@/utils/spacyApi';

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

const AddProduct: React.FC = () => {
  const { addProduct } = useInventory();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const navigate = useNavigate();
  
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
    addProduct(formData);
    setFormData(initialFormData);
    navigate('/products');
  };
  
  const handleVoiceCommand = async (command: string) => {
    const productDetails = extractProductDetails(command);
    
    if (Object.keys(productDetails).length > 0) {
      if (productDetails.name) {
        setFormData({
          name: productDetails.name || '',
          quantity: productDetails.quantity || 0,
          unit: productDetails.unit || 'kg',
          position: productDetails.position || '',
          expiry: productDetails.expiry || '',
          price: productDetails.price || 0,
          image: productDetails.image || '',
        });
        toast.success(`Product details extracted: ${productDetails.name}`);
      } else {
        toast.info('Please provide product details');
      }
    } else {
      toast.info('Please provide product details');
    }
  };
  
  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/products')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>
            Fill in the details to add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      <Search className="mr-2 h-4 w-4" />
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
            
            <CardFooter className="pt-6">
              <Button type="submit">Add Product</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-8 right-8">
        <VoiceCommandButton onVoiceCommand={handleVoiceCommand} />
      </div>
    </div>
  );
};

export default AddProduct;
