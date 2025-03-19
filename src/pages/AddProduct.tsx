
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mic, ArrowLeft, Image, Package2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';

// Product form data type
interface ProductFormData {
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image?: string;
}

const AddProduct: React.FC = () => {
  const { addProduct } = useInventory();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rackImage, setRackImage] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'kg',
      position: '',
      expiry: '',
      price: 0,
      image: '',
    }
  });

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            processVoiceCommand(finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Failed to recognize command');
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      }
    } else {
      toast.error('Speech recognition is not supported in your browser');
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast.info('Listening... Say "Add [quantity] [unit] [product] on rack [number]"');
      } catch (error) {
        console.error('Speech recognition error', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    setProcessing(true);
    
    try {
      // Look for patterns like "add 5 kg sugar on rack 7 with expiry July 2026"
      if (lowerCommand.includes('add')) {
        const productInfo = lowerCommand.replace(/add/i, '').trim();
        
        // Extract quantity and unit using regex
        const quantityMatch = productInfo.match(/(\d+)\s*(kg|g|l|ml|pieces|packet|box)/i);
        const expiryMatch = productInfo.match(/expiry\s+(\w+\s+\d{4})|expires?\s+(\w+\s+\d{4})/i);
        const rackMatch = productInfo.match(/rack\s+(\d+)|shelf\s+(\d+)/i);
        const priceMatch = productInfo.match(/price\s+(\d+)/i);
        
        if (quantityMatch) {
          const quantity = parseInt(quantityMatch[1]);
          const unit = quantityMatch[2].toLowerCase();
          
          // Get product name by removing extracted parts
          let productName = productInfo
            .replace(quantityMatch[0], '')
            .replace(expiryMatch ? expiryMatch[0] : '', '')
            .replace(rackMatch ? rackMatch[0] : '', '')
            .replace(priceMatch ? priceMatch[0] : '', '')
            .trim();
          
          // Remove common words like "of", "on", "with"
          productName = productName
            .replace(/\s+(of|on|with|at|in)\s+/g, ' ')
            .replace(/\s+and\s+/g, ' ')
            .trim();
          
          const formValues: ProductFormData = {
            name: productName.charAt(0).toUpperCase() + productName.slice(1),
            quantity,
            unit,
            position: rackMatch ? `Rack ${rackMatch[1] || rackMatch[2]}` : '',
            expiry: expiryMatch ? (expiryMatch[1] || expiryMatch[2]) : undefined,
            price: priceMatch ? parseInt(priceMatch[1]) : 0,
            image: '',
          };
          
          // Update form values
          Object.entries(formValues).forEach(([key, value]) => {
            if (value !== undefined) {
              form.setValue(key as keyof ProductFormData, value);
            }
          });
          
          toast.success(`Product details captured: ${formValues.name}, ${formValues.quantity} ${formValues.unit}`);
          
          // Fetch a product image
          fetchProductImage(formValues.name);
        } else {
          toast.info('Could not identify product details from voice command');
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Error processing voice command');
    } finally {
      setProcessing(false);
    }
  };

  const fetchProductImage = async (productName: string) => {
    try {
      // In a real app, you would call an API to get a product image
      // For demo purposes, we'll just use placeholder images
      const placeholders = [
        'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a',
        'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a',
        'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8',
      ];
      
      // Randomly select a placeholder
      const randomImage = placeholders[Math.floor(Math.random() * placeholders.length)];
      form.setValue('image', randomImage);
    } catch (error) {
      console.error('Error fetching product image:', error);
    }
  };

  const onSubmit = (data: ProductFormData) => {
    try {
      addProduct(data);
      toast.success(`${data.name} added to inventory`);
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

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

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Add Product</h1>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            ref={micButtonRef}
            size="lg"
            className={cn(
              "relative px-6 gap-2 transition-all",
              isListening && "bg-red-500 hover:bg-red-600"
            )}
            onClick={toggleListening}
          >
            {isListening ? (
              <>
                <Mic className="h-5 w-5 animate-pulse" />
                <span>Listening...</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                <span>Voice Command</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
      
      {transcript && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Voice Command Transcript</span>
              <Button
                variant="ghost" 
                size="icon" 
                className="h-5 w-5"
                onClick={() => setTranscript('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{transcript}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Add details about your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sugar, Rice, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="kg, g, l, ml, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Rack 7, Shelf 3, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="expiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload Rack Image</CardTitle>
            <CardDescription>
              Upload an image of your rack to help locate products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
              {rackImage ? (
                <div className="relative w-full">
                  <img 
                    src={rackImage} 
                    alt="Rack" 
                    className="max-h-[200px] mx-auto rounded object-contain"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => setRackImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Image className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to upload
                  </p>
                  <Label
                    htmlFor="rack-image-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Upload Image
                    <input
                      id="rack-image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleRackImageUpload}
                    />
                  </Label>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview</h3>
              {form.watch('image') ? (
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={form.watch('image')} 
                    alt="Product" 
                    className="w-full object-cover h-[150px]"
                  />
                </div>
              ) : (
                <div className="border rounded-md bg-muted/20 flex items-center justify-center h-[150px]">
                  <Package2 className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Product image preview. Use voice command to automatically fetch an image or enter a URL manually.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;
