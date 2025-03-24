import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mic, ArrowLeft, Image, Package2, Save, X, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { extractProductDetails, fetchProductImageUrl } from '@/utils/voiceCommandUtils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  
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
          
          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            setTranscriptHistory(prev => [...prev, finalTranscript]);
            handleVoiceCommand(finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Failed to recognize command');
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Failed to restart recognition', error);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
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
  }, [isListening]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
      setIsVoiceDialogOpen(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        setIsVoiceDialogOpen(true);
        toast.info('Listening... Try saying "Add 5 kg sugar on rack 7 with expiry July 2026"');
      } catch (error) {
        console.error('Speech recognition error', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const handleVoiceCommand = (command: string) => {
    const { name, quantity, unit, position, expiry } = extractProductDetails(command);
    
    if (name) {
      form.setValue('name', name);
      toast.success(`Product name set to "${name}"`);
      
      if (quantity) {
        form.setValue('quantity', quantity);
        toast.success(`Quantity set to ${quantity}`);
      }
      
      if (unit) {
        form.setValue('unit', unit);
        toast.success(`Unit set to ${unit}`);
      }
      
      if (position) {
        form.setValue('position', position);
        toast.success(`Position set to ${position}`);
      }
      
      if (expiry) {
        form.setValue('expiry', expiry);
        toast.success(`Expiry set to ${expiry}`);
      }
      
      fetchProductImageUrl(name)
        .then(imageUrl => {
          if (imageUrl) {
            form.setValue('image', imageUrl);
            toast.success('Product image found');
          }
        })
        .catch(error => {
          console.error('Error fetching product image:', error);
        });
    } else {
      toast.error('Could not identify a product from your command');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        form.setValue('image', imageUrl);
        toast.success('Product image uploaded');
      };
      reader.readAsDataURL(file);
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

  const captureImage = () => {
    if (cameraRef.current) {
      cameraRef.current.click();
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

      <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-primary animate-pulse" />
              Voice Command
            </DialogTitle>
            <DialogDescription>
              Say "add product name, quantity, etc." or speak naturally about the product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium text-sm mb-1">Current transcript:</p>
              <p className="text-sm">{transcript || "Listening..."}</p>
            </div>
            
            {transcriptHistory.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Command history:</p>
                <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                  {transcriptHistory.map((cmd, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50">
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setTranscriptHistory([])}>
                Clear History
              </Button>
              <Button size="sm" onClick={() => setIsVoiceDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {transcript && !isVoiceDialogOpen && (
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
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                field.onChange(Number(value));
                              }
                            }} 
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
                      <FormLabel>Product Image</FormLabel>
                      <div className="grid grid-cols-3 gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="col-span-1"
                          onClick={captureImage}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Camera
                        </Button>
                        <div className="col-span-2">
                          <Input
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="Image URL or use buttons"
                            className="hidden"
                          />
                          <Label
                            htmlFor="product-image-upload"
                            className="cursor-pointer flex items-center justify-center w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            <Image className="mr-2 h-4 w-4" />
                            Upload from Gallery
                            <input
                              id="product-image-upload"
                              type="file"
                              accept="image/*"
                              ref={cameraRef}
                              className="sr-only"
                              onChange={(e) => {
                                handleImageUpload(e);
                                e.target.value = '';
                              }}
                            />
                          </Label>
                        </div>
                      </div>
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
                  <div className="flex space-x-2">
                    <Label
                      htmlFor="rack-image-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Gallery
                      <input
                        id="rack-image-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleRackImageUpload}
                      />
                    </Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if ('mediaDevices' in navigator) {
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
                                setRackImage(reader.result as string);
                                toast.success('Rack image captured');
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        } else {
                          toast.error('Camera not supported on this device');
                        }
                      }}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Camera
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Product Preview</h3>
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
                Product image preview. Use voice command to automatically fetch an image or upload one manually.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;
