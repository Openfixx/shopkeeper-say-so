
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, Save, Trash, Undo, Mic, MicOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import EnhancedVoiceCommand from './EnhancedVoiceCommand';
import { supabase } from '@/integrations/supabase/client';

interface ProductVoiceFormProps {
  onSubmit: (product: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

const ProductVoiceForm: React.FC<ProductVoiceFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    quantity: initialData?.quantity || 0,
    unit: initialData?.unit || 'kg',
    position: initialData?.position || '',
    price: initialData?.price || 0,
    expiry: initialData?.expiry || '',
    image: initialData?.image || '',
    notes: initialData?.notes || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [detectedEntities, setDetectedEntities] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCaptureImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImageLoading(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        image: reader.result as string
      }));
      setIsImageLoading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setIsImageLoading(false);
    };
    reader.readAsDataURL(file);
  };
  
  const fetchProductImage = async (product: string) => {
    if (!product) return;
    
    setIsImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-processing', {
        body: { type: 'fetch_image', data: product }
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.imageUrl) {
        setFormData(prev => ({
          ...prev,
          image: data.imageUrl
        }));
        toast.success("Found product image online");
      } else {
        toast.warning("Couldn't find image for this product");
      }
    } catch (error) {
      console.error('Error fetching product image:', error);
      toast.error("Failed to fetch product image");
    } finally {
      setIsImageLoading(false);
    }
  };
  
  // Auto search for image when name changes and no image is set
  useEffect(() => {
    if (formData.name && !formData.image && !isImageLoading) {
      fetchProductImage(formData.name);
    }
  }, [formData.name]);
  
  const handleVoiceResult = (text: string, processedData: any) => {
    setVoiceTranscript(text);
    
    if (processedData?.processed) {
      setDetectedEntities(processedData.processed);
      
      // Update form with detected entities
      const { product, quantity, position, price, expiryDate } = processedData.processed;
      
      const updates: any = {};
      if (product) updates.name = product;
      if (quantity) {
        updates.quantity = quantity.value;
        updates.unit = quantity.unit || formData.unit;
      }
      if (position) updates.position = position;
      if (price) updates.price = price;
      if (expiryDate) updates.expiry = expiryDate;
      if (processedData.imageUrl) updates.image = processedData.imageUrl;
      
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
      
      toast.success("Voice command processed successfully");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }
    
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    
    setIsLoading(true);
    try {
      // Submit the form data
      onSubmit(formData);
      toast.success(`Product ${formData.name} saved successfully`);
      
      // Reset form if not updating
      if (!initialData) {
        setFormData({
          name: '',
          quantity: 0,
          unit: 'kg',
          position: '',
          price: 0,
          expiry: '',
          image: '',
          notes: ''
        });
        setVoiceTranscript('');
        setDetectedEntities(null);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        quantity: initialData.quantity || 0,
        unit: initialData.unit || 'kg',
        position: initialData.position || '',
        price: initialData.price || 0,
        expiry: initialData.expiry || '',
        image: initialData.image || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        quantity: 0,
        unit: 'kg',
        position: '',
        price: 0,
        expiry: '',
        image: '',
        notes: ''
      });
    }
    setVoiceTranscript('');
    setDetectedEntities(null);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Product' : 'Add New Product'}</CardTitle>
        <CardDescription>
          {initialData 
            ? 'Update product details in your inventory' 
            : 'Add a new product to your inventory using voice or manual input'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Left column - Form fields */}
            <div className="space-y-4 flex-1">
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
                  <Label htmlFor="position">Storage Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="e.g. Rack 3, Shelf 2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange('unit', value)}
                  >
                    <SelectTrigger id="unit">
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
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="date"
                  value={formData.expiry}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information about this product"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            {/* Right column - Image and voice */}
            <div className="w-full md:w-1/3 space-y-4">
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="border rounded-md overflow-hidden bg-muted/30 aspect-square">
                  {formData.image ? (
                    <img 
                      src={formData.image} 
                      alt={formData.name || 'Product'} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                      {isImageLoading ? (
                        <Loader2 className="h-10 w-10 animate-spin mb-2" />
                      ) : (
                        <Camera className="h-10 w-10 mb-2" />
                      )}
                      <span className="text-sm text-center">
                        {isImageLoading ? "Loading image..." : "No image available"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCaptureImage}
                  size="sm"
                  disabled={isImageLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  <span>Capture</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isImageLoading || !formData.name}
                  onClick={() => fetchProductImage(formData.name)}
                >
                  {isImageLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Find Online</span>
                    </>
                  )}
                </Button>
                
                {formData.image && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
              
              <input 
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              
              {/* Voice command section */}
              <div className="mt-6">
                <Label className="mb-2 block">Voice Command</Label>
                <div className="flex items-center justify-between">
                  <EnhancedVoiceCommand 
                    onResult={handleVoiceResult}
                    size="md"
                    showTranscript={false}
                    autoProcess={true}
                    supportedLanguages={['en-US', 'hi-IN']}
                  />
                  <span className="text-xs text-muted-foreground">
                    Try: "Add 5kg sugar rack 3 price ₹50"
                  </span>
                </div>
                
                {voiceTranscript && (
                  <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Last command:</p>
                    <p>{voiceTranscript}</p>
                  </div>
                )}
                
                {detectedEntities && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Detected:</p>
                    <div className="flex flex-wrap gap-1">
                      {detectedEntities.product && (
                        <Badge variant="outline" className="text-xs">
                          Product: {detectedEntities.product}
                        </Badge>
                      )}
                      {detectedEntities.quantity && (
                        <Badge variant="outline" className="text-xs">
                          Qty: {detectedEntities.quantity.value} {detectedEntities.quantity.unit}
                        </Badge>
                      )}
                      {detectedEntities.position && (
                        <Badge variant="outline" className="text-xs">
                          {detectedEntities.position}
                        </Badge>
                      )}
                      {detectedEntities.price && (
                        <Badge variant="outline" className="text-xs">
                          ₹{detectedEntities.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {!initialData && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={resetForm} 
                className="ml-2"
              >
                <Undo className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !formData.name || formData.quantity <= 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {initialData ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {initialData ? 'Update Product' : 'Save Product'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProductVoiceForm;
