import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/context/InventoryContext';
import { useLanguage } from '@/context/LanguageContext';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mic, MicOff, Package2, Plus, Receipt, Trash2, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { 
  extractBillItems, 
  processBillingVoiceCommand, 
  detectCommandType, 
  VOICE_COMMAND_TYPES 
} from '@/utils/voiceCommandUtils';
import { formatCurrency } from '@/utils/formatters';

const UNIT_TYPES = {
  WEIGHT: 'weight',
  VOLUME: 'volume',
  PIECE: 'piece',
};

const UNIT_OPTIONS = {
  [UNIT_TYPES.WEIGHT]: [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'mg', label: 'Milligrams (mg)' }
  ],
  [UNIT_TYPES.VOLUME]: [
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' }
  ],
  [UNIT_TYPES.PIECE]: [
    { value: 'pcs', label: 'Pieces' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' }
  ]
};

const detectUnitType = (unit: string): string => {
  const weightUnits = ['kg', 'g', 'mg', 'kilogram', 'gram', 'किलो'];
  const volumeUnits = ['l', 'ml', 'liter', 'litre', 'लीटर'];
  
  unit = unit.toLowerCase();
  
  if (weightUnits.some(wu => unit.includes(wu))) {
    return UNIT_TYPES.WEIGHT;
  } else if (volumeUnits.some(vu => unit.includes(vu))) {
    return UNIT_TYPES.VOLUME;
  } else {
    return UNIT_TYPES.PIECE;
  }
};

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
    findProduct,
    updateBillItemQuantity,
    updateBillItemUnit
  } = useInventory();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [interpretedCommand, setInterpretedCommand] = useState<string | null>(null);
  
  useEffect(() => {
    if (open && !currentBill) {
      startNewBill();
    }
  }, [open, currentBill, startNewBill]);
  
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
            
            const commandInfo = detectCommandType(finalTranscript);
            
            let interpretedMsg = '';
            switch(commandInfo.type) {
              case VOICE_COMMAND_TYPES.CREATE_BILL:
                interpretedMsg = 'Creating bill';
                if (commandInfo.data?.items?.length) {
                  interpretedMsg += ` with ${commandInfo.data.items.length} item(s)`;
                  
                  commandInfo.data.items.forEach(item => {
                    const matchingProducts = findProduct(item.name);
                    if (matchingProducts.length > 0) {
                      addToBill(matchingProducts[0].id, item.quantity);
                    }
                  });
                }
                break;
              default:
                processCommand(finalTranscript);
                interpretedMsg = 'Processed command';
            }
            
            setInterpretedCommand(interpretedMsg);
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
  }, [findProduct, addToBill]);
  
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
        toast.info('Say anything and I will try to add it to the bill');
      } catch (error) {
        console.error('Speech recognition error', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };
  
  const processCommand = (command: string) => {
    const commandInfo = detectCommandType(command);
    
    if (commandInfo.type === VOICE_COMMAND_TYPES.CREATE_BILL && commandInfo.data?.items?.length > 0) {
      let addedCount = 0;
      
      commandInfo.data.items.forEach(item => {
        const matchingProducts = findProduct(item.name);
        
        if (matchingProducts.length > 0) {
          const product = matchingProducts[0];
          let quantity = item.quantity;
          
          addToBill(product.id, quantity);
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} item(s) to bill`);
      } else {
        toast.warning("Found items in your command, but they're not in inventory");
      }
    } else {
      const items = extractBillItems(command);
      
      if (items.length > 0) {
        let addedCount = 0;
        
        items.forEach(item => {
          const matchingProducts = findProduct(item.name);
          
          if (matchingProducts.length > 0) {
            const product = matchingProducts[0];
            addToBill(product.id, item.quantity);
            addedCount++;
          }
        });
        
        if (addedCount > 0) {
          toast.success(`Added ${addedCount} item(s) to bill`);
        } else {
          toast.warning("Found items in your command, but they're not in inventory");
        }
      } else {
        const words = command.toLowerCase().split(/\s+/);
        let addedAny = false;
        
        words.forEach(word => {
          if (word.length < 3) return;
          
          const matchingProducts = findProduct(word);
          if (matchingProducts.length > 0) {
            const product = matchingProducts[0];
            addToBill(product.id, 1);
            addedAny = true;
            toast.success(`Added ${product.name} to bill`);
          }
        });
        
        if (!addedAny) {
          toast.info(`Couldn't identify any products in "${command}"`);
        }
      }
    }
  };
  
  const getBillItemImage = (item: any): string => {
    return item.image || '';
  };
  
  const hasItemImage = (item: any): boolean => {
    return Boolean(item.image);
  }
  
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {language === 'hi-IN' ? 'त्वरित बिल' : 'Quick Bill'}
          </DialogTitle>
          <DialogDescription>
            {language === 'hi-IN' 
              ? 'अपने बिल में आवाज़ कमांड या खोज का उपयोग करके आइटम जोड़ें'
              : 'Add items to your bill using voice commands or search'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-4">
            {currentBill && currentBill.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">{language === 'hi-IN' ? 'आइटम' : 'Item'}</TableHead>
                    <TableHead className="text-right">{language === 'hi-IN' ? 'मात्रा' : 'Qty'}</TableHead>
                    <TableHead className="text-right">{language === 'hi-IN' ? 'मूल्य' : 'Price'}</TableHead>
                    <TableHead className="text-right">{language === 'hi-IN' ? 'कुल' : 'Total'}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBill.items.map((item) => {
                    const unitType = detectUnitType(item.unit || '');
                    const unitOptions = UNIT_OPTIONS[unitType] || UNIT_OPTIONS[UNIT_TYPES.PIECE];
                    
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium text-base">
                          <div className="flex items-center gap-2">
                            {hasItemImage(item) ? (
                              <img 
                                src={getBillItemImage(item)} 
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Input 
                              type="number"
                              value={item.quantity}
                              step="0.01"
                              onChange={(e) => {
                                const newQuantity = parseFloat(e.target.value);
                                if (!isNaN(newQuantity) && newQuantity > 0) {
                                  updateBillItemQuantity(item.productId, newQuantity);
                                }
                              }}
                              className="w-20 h-9 text-right"
                            />
                            
                            <Select
                              value={item.unit || 'pcs'}
                              onValueChange={(value) => updateBillItemUnit(item.productId, value)}
                            >
                              <SelectTrigger className="w-24 h-9">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-base">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-base">
                          {formatCurrency(item.total)}
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
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium text-lg">
                      {language === 'hi-IN' ? 'कुल' : 'Total'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(currentBill.total)}
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
                <h3 className="text-lg font-medium">
                  {language === 'hi-IN' ? 'बिल में कोई आइटम नहीं' : 'No items in bill'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'hi-IN' 
                    ? 'आइटम जोड़ने के लिए आवाज़ कमांड या खोज का उपयोग करें'
                    : 'Use voice commands or search to add items'}
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
                    onClick={() => {
                      setTranscript('');
                      setInterpretedCommand(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p>{transcript}</p>
                
                {interpretedCommand && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    {interpretedCommand}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
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
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{product.name}</span>
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
