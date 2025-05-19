
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/context/InventoryContext';
import { Camera, Search, ArrowLeft, Save, Loader2, Upload, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setFormData(prev => ({
          ...prev,
          image: imageUrl
        }));
        toast.success('Product image uploaded');
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    const autoFindImage = async () => {
      if (formData.name && !formData.image) {
        await findProductImage();
      }
    };
    
    if (formData.name && !isProcessing && !isImageLoading) {
      autoFindImage();
    }
  }, [formData.name]);

  const findProductImage = async () => {
    if (!formData.name) {
      toast.error('Please enter a product name first');
      return;
    }
    
    setIsImageLoading(true);
    toast.loading('Searching for product image...');
    
    try {
      const response = await fetch(`/api/fetch-image?q=${encodeURIComponent(formData.name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Image search response:", data);
      
      if (data?.imageUrl) {
        setFormData(prev => ({
          ...prev,
          image: data.imageUrl
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
    } finally {
      setIsImageLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }
    
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    
    addProduct(formData);
    setFormData(initialFormData);
    navigate('/products');
    toast.success(`Product ${formData.name} added to inventory`);
  };
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => navigate('/products')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>
      
      <Card className="w-full max-w-4xl mx-auto bg-card shadow-lg border-primary/10">
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="text-2xl font-bold">Add New Product</CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the details to add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-md font-medium">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Sugar, Rice, etc."
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="text-md font-medium">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-md font-medium">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-md font-medium">Unit</Label>
                <Select 
                  value={formData.unit}
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="ml">Milliliter (ml)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="packet">Packet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position" className="text-md font-medium">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Rack 7"
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-md font-medium">Expiry Date</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="date"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-md font-medium">Product Image</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative border rounded-md overflow-hidden h-60 bg-muted/30">
                    {isImageLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                      </div>
                    ) : formData.image ? (
                      <img 
                        src={formData.image} 
                        alt={formData.name || 'Product'} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Camera className="h-16 w-16 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No image available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Input
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Image URL"
                    className="h-11"
                  />
                  
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={findProductImage}
                    className="w-full h-11 font-medium"
                    disabled={!formData.name || isImageLoading}
                  >
                    {isImageLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5 mr-2" />
                    )}
                    Find Image
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={captureImage}
                    className="w-full h-11 font-medium"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture Image
                  </Button>
                  
                  <Button
                    type="button" 
                    variant="outline"
                    className="w-full h-11 font-medium"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                  </Button>
                  
                  {formData.image && (
                    <Button 
                      type="button" 
                      variant="destructive"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="w-full h-11 font-medium"
                    >
                      <Trash className="h-5 w-5 mr-2" />
                      Remove Image
                    </Button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>
            
            <CardFooter className="px-0 pt-4 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setFormData(initialFormData)}
                type="button"
              >
                Reset Form
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name || formData.quantity <= 0 || isProcessing}
                className="px-8"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Add Product
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
