
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/context/InventoryContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mic, MicOff, Package2, Plus, Receipt, Trash2, X, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { extractBillItems, processBillingVoiceCommand } from '@/utils/voiceCommandUtils';

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BillingDialog: React.FC<BillingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { 
    products, 
    currentBill, 
    startNewBill, 
    addToBill, 
    removeFromBill, 
    completeBill,
    findProduct 
  } = useInventory();
  const navigate = useNavigate();
  
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize bill
  useEffect(() => {
    if (open && !currentBill) {
      startNewBill();
    }
  }, [open, currentBill, startNewBill]);
  
  // Setup speech recognition
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
            processCommand(finalTranscript);
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
  }, []);
  
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
        toast.info('Speak to add items to the bill');
      } catch (error) {
        console.error('Speech recognition error', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };
  
  const processCommand = (command: string) => {
    processBillingVoiceCommand(command, addToBill, findProduct);
  };
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products.slice(0, 5);
  
  const handleCompleteBill = () => {
    completeBill();
    onOpenChange(false);
    navigate('/billing');
  };
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Quick Bill
          </DialogTitle>
          <DialogDescription>
            Add items to your bill using voice commands or search
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2">
          {/* Current Bill */}
          <div className="space-y-4">
            {currentBill && currentBill.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBill.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(item.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(item.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromBill(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatter.format(currentBill.total)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-2">
                  <Package2 className="h-8 w-8 text-muted-foreground opacity-40" />
                </div>
                <h3 className="text-lg font-medium">No items in bill</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use voice commands or search to add items
                </p>
              </div>
            )}
            
            {transcript && (
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Voice transcript</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setTranscript('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p>{transcript}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Search and Add Items */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant={isListening ? "default" : "outline"}
              className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={toggleListening}
            >
              {isListening ? (
                <Mic className="h-4 w-4 mr-2" />
              ) : (
                <MicOff className="h-4 w-4 mr-2" />
              )}
              {isListening ? "Listening..." : "Voice"}
              
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Button>
          </div>
          
          {searchQuery && (
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => addToBill(product.id, 1)}
                  >
                    <div className="flex items-center gap-2">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Package2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span>{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {product.quantity} {product.unit} available
                      </span>
                      <Button size="icon" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No products found matching "{searchQuery}"
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/billing')}
            >
              Go to Billing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={handleCompleteBill}
              disabled={!currentBill || currentBill.items.length === 0}
            >
              Complete Bill
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;
