
import React, { useState, useEffect, useRef } from 'react';
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
import { extractProductDetails, searchProductImage, updateProductDetails } from '@/utils/voiceCommandUtils';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
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

  // Auto-search for product image when name is set
  useEffect(() => {
    const autoFindImage = async () => {
      if (formData.name && !formData.image) {
        await findProductImage();
      }
    };
    
    if (formData.name && !isProcessing) {
      autoFindImage();
    }
  }, [formData.name]);

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
    setLastCommand('');
    navigate('/products');
    toast.success(`Product ${formData.name} added to inventory`);
  };
  
  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    try {
      console.log('Processing voice command:', command);
      toast.loading('Processing voice command...');
      
      // Check if this is a continuation of the previous command
      // If the form already has data and the new command doesn't have "add" or "create"
      const isContinuation = formData.name && 
        !/\b(?:add|create|make)\s+(?:a\s+)?product\b/i.test(command) &&
        !/\bnew product\b/i.test(command);
      
      if (isContinuation) {
        // This is a continuation command, update existing product details
        const updatedDetails = await updateProductDetails(formData, command);
        setFormData(updatedDetails);
        toast.dismiss();
        toast.success('Product details updated');
      } else {
        // This is a new product command
        const productDetails = await extractProductDetails(command);
        
        if (productDetails.name) {
          // Set the form data with the extracted details
          setFormData({
            name: productDetails.name || '',
            quantity: productDetails.quantity || 0,
            unit: productDetails.unit || 'kg',
            position: productDetails.position || '',
            expiry: productDetails.expiry || '',
            price: productDetails.price || 0,
            image: '',  // Will be auto-populated by useEffect
          });
          
          toast.dismiss();
          toast.success(`Product details extracted: ${productDetails.name}`);
        } else {
          toast.dismiss();
          toast.info('Could not detect product name. Please try again.');
        }
      }
      
      setLastCommand(command);
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.dismiss();
      toast.error('Error processing voice command');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to determine if required fields are filled
  const isFormComplete = () => {
    return formData.name && (formData.quantity > 0);
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
            Try saying "Add 5kg sugar in rack 3 price ₹50 expiry July 2026"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="image">Product Image</Label>
                <div className="flex space-x-2">
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={findProductImage}
                    title="Search for product image online"
                    disabled={!formData.name || isProcessing}
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
              
              {formData.image && (
                <div className="md:col-span-2">
                  <div className="relative border rounded-md overflow-hidden h-40">
                    <img 
                      src={formData.image} 
                      alt={formData.name || 'Product'} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={captureImage}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Image
                  </Button>
                  
                  <Label
                    htmlFor="product-image-upload"
                    className="cursor-pointer flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
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
              </div>
            </div>
            
            <CardFooter className="px-0 pt-6">
              <Button 
                type="submit" 
                disabled={!isFormComplete() || isProcessing}
                className="w-full md:w-auto"
              >
                Add Product
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-8 right-8 z-50">
        <VoiceCommandButton 
          onVoiceCommand={handleVoiceCommand} 
          showDialog={true}
          pulseColor="bg-green-500"
          label="Voice Add Product"
          variant="default"
          size="default"
        />
      </div>
      
      {lastCommand && (
        <div className="fixed bottom-24 right-8 p-3 bg-background border rounded-lg shadow-lg max-w-sm z-40">
          <p className="text-xs font-medium mb-1">Last command:</p>
          <p className="text-sm">{lastCommand}</p>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
