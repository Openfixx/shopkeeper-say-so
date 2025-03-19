
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInventory, BillItem } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Receipt, MinusCircle, Plus, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { extractBillItems } from '@/utils/voiceCommandUtils';

interface QuickBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTranscript?: string;
}

const QuickBillDialog: React.FC<QuickBillDialogProps> = ({
  open,
  onOpenChange,
  initialTranscript = '',
}) => {
  const { products, currentBill, startNewBill, addToBill, removeFromBill, completeBill } = useInventory();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [pendingItems, setPendingItems] = useState<BillItem[]>([]);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemQuantity, setManualItemQuantity] = useState('1');
  
  useEffect(() => {
    if (!open) {
      setTranscript('');
      setPendingItems([]);
      setManualItemName('');
      setManualItemQuantity('1');
      if (isListening && recognition) {
        recognition.abort();
        setIsListening(false);
      }
      return;
    }
    
    // Start a new bill if one doesn't exist
    if (!currentBill) {
      startNewBill();
    }
    
    // Init speech recognition
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
            processVoiceCommand(finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      }
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [open, currentBill, startNewBill]);
  
  useEffect(() => {
    // Process initial transcript if provided
    if (initialTranscript && open) {
      processVoiceCommand(initialTranscript);
    }
  }, [initialTranscript, open]);
  
  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast.info('Listening... Say items to add to the bill');
      } catch (error) {
        console.error('Speech recognition error', error);
        setIsListening(false);
        toast.error('Failed to start voice recognition');
      }
    }
  };
  
  const processVoiceCommand = (command: string) => {
    setIsProcessing(true);
    
    try {
      // Extract items from the command
      const extractedItems = extractBillItems(command);
      
      if (extractedItems.length === 0) {
        // Try to find direct product matches
        const words = command.toLowerCase().split(/\s+/);
        const matchedProducts: BillItem[] = [];
        
        for (const word of words) {
          if (word.length < 3) continue;
          
          const matchingProducts = products.filter(product => 
            product.name.toLowerCase().includes(word)
          );
          
          if (matchingProducts.length > 0) {
            // Take the first match
            const product = matchingProducts[0];
            matchedProducts.push({
              productId: product.id,
              name: product.name,
              quantity: 1,
              unit: product.unit,
              price: product.price,
              total: product.price
            });
          }
        }
        
        if (matchedProducts.length > 0) {
          setPendingItems(prev => [...prev, ...matchedProducts]);
          toast.success(`Found ${matchedProducts.length} products in your command`);
        } else {
          toast.info("Couldn't identify any products in your command");
        }
      } else {
        // Process extracted items
        const billItems: BillItem[] = [];
        
        for (const item of extractedItems) {
          const matchingProducts = products.filter(product => 
            product.name.toLowerCase().includes(item.name.toLowerCase())
          );
          
          if (matchingProducts.length > 0) {
            const product = matchingProducts[0];
            billItems.push({
              productId: product.id,
              name: product.name,
              quantity: item.quantity,
              unit: product.unit,
              price: product.price,
              total: product.price * item.quantity
            });
          }
        }
        
        if (billItems.length > 0) {
          setPendingItems(prev => [...prev, ...billItems]);
          toast.success(`Added ${billItems.length} items to bill`);
        } else {
          toast.warning("Products not found in inventory");
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Error processing voice command');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddToBill = () => {
    if (pendingItems.length === 0) {
      toast.warning('No items to add to bill');
      return;
    }
    
    // Add all pending items to the bill
    pendingItems.forEach(item => {
      addToBill(item.productId, item.quantity);
    });
    
    toast.success(`Added ${pendingItems.length} items to bill`);
    setPendingItems([]);
  };
  
  const handleAddManualItem = () => {
    if (!manualItemName) {
      toast.warning('Please enter a product name');
      return;
    }
    
    const quantity = parseInt(manualItemQuantity) || 1;
    
    // Find matching products
    const matchingProducts = products.filter(product => 
      product.name.toLowerCase().includes(manualItemName.toLowerCase())
    );
    
    if (matchingProducts.length > 0) {
      const product = matchingProducts[0];
      const newItem: BillItem = {
        productId: product.id,
        name: product.name,
        quantity,
        unit: product.unit,
        price: product.price,
        total: product.price * quantity
      };
      
      setPendingItems(prev => [...prev, newItem]);
      setManualItemName('');
      setManualItemQuantity('1');
      toast.success(`Added ${product.name} to pending items`);
    } else {
      toast.error(`Product "${manualItemName}" not found in inventory`);
    }
  };
  
  const handleCompleteBill = () => {
    // First add any pending items
    if (pendingItems.length > 0) {
      handleAddToBill();
    }
    
    // Then complete the bill
    completeBill();
    onOpenChange(false);
    toast.success('Bill completed');
  };
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  
  const calculateTotal = (items: BillItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Quick Bill Creator
          </DialogTitle>
          <DialogDescription>
            Use voice commands to quickly add items to your bill
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-3 space-y-4">
            <div className="flex space-x-2">
              <Button
                className="flex-1"
                variant={isListening ? "default" : "outline"}
                onClick={toggleListening}
                disabled={isProcessing}
              >
                {isListening ? (
                  <>
                    <Mic className="mr-2 h-4 w-4 animate-pulse" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Speak Items'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setTranscript('');
                  setPendingItems([]);
                }}
              >
                Clear
              </Button>
            </div>
            
            {transcript && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Transcript:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
            
            <div className="flex items-end space-x-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="Enter product name"
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                />
              </div>
              <div className="w-20 space-y-2">
                <Label htmlFor="product-quantity">Qty</Label>
                <Input
                  id="product-quantity"
                  type="number"
                  min="1"
                  value={manualItemQuantity}
                  onChange={(e) => setManualItemQuantity(e.target.value)}
                />
              </div>
              <Button onClick={handleAddManualItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Pending Items</h3>
              {pendingItems.length === 0 ? (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">No pending items</p>
                  <p className="text-xs text-muted-foreground">Use voice commands or add items manually</p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatter.format(item.price * item.quantity)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingItems(prev => prev.filter((_, i) => i !== index))}
                            >
                              <MinusCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm font-medium">
                      Total: {formatter.format(calculateTotal(pendingItems))}
                    </p>
                    <Button onClick={handleAddToBill}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Bill
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Card className="bg-muted h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Current Bill
                  {currentBill && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      #{currentBill.id.slice(-4)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[300px]">
                {!currentBill || currentBill.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium">Empty bill</p>
                    <p className="text-xs text-muted-foreground">
                      Add items using voice commands or manually
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentBill.items.map((item) => (
                      <div 
                        key={item.productId} 
                        className="flex justify-between items-center p-2 rounded bg-background"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit} × {formatter.format(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatter.format(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex flex-col">
                <Separator className="mb-3" />
                <div className="flex justify-between items-center w-full mb-3">
                  <p className="text-sm font-medium">Total:</p>
                  <p className="text-lg font-bold">
                    {formatter.format(currentBill?.total || 0)}
                  </p>
                </div>
                <Button 
                  className="w-full"
                  disabled={!currentBill || currentBill.items.length === 0}
                  onClick={handleCompleteBill}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Complete Bill
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4", className)}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardProps> = ({ className, children }) => {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
};

const CardContent: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={cn("p-4 pt-0", className)}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={cn("flex items-center p-4 pt-0", className)}>
      {children}
    </div>
  );
};

export default QuickBillDialog;
