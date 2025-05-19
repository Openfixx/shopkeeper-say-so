
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Plus, 
  Save, 
  Trash, 
  Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseEnhancedVoiceCommand, EnhancedProduct } from '@/utils/nlp/enhancedProductParser';
import { useInventory } from '@/context/InventoryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceProductTableProps {
  onConfirm?: (products: EnhancedProduct[]) => void;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceProductTable: React.FC<VoiceProductTableProps> = ({
  onConfirm,
  className,
  open,
  onOpenChange
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { products: inventoryProducts, addProduct } = useInventory();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } else {
      setTranscript('');
      setEditingIndex(null);
    }
  }, [open]);

  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      
      // Start progress bar animation
      let progressValue = 0;
      progressTimerRef.current = window.setInterval(() => {
        progressValue += 1;
        if (progressValue > 100) {
          if (progressTimerRef.current) {
            window.clearInterval(progressTimerRef.current);
          }
          recognition.stop();
          return;
        }
      }, 100); // 10 seconds total
      
      toast.info('Listening... Say a command like "Add 5kg rice (shelf 3)"');
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcript);
        } else {
          interimTranscript += transcript;
          setTranscript(interimTranscript);
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      if (event.error === 'no-speech') {
        toast.warning("No speech detected");
      } else if (event.error === 'aborted') {
        // Do nothing for aborted
      } else {
        toast.error(`Error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      if (transcript) {
        processTranscript(transcript);
      }
    };
    
    recognition.start();
  };
  
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    
    setIsListening(false);
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Get product names from inventory for matching
      const productNames = inventoryProducts.map(p => ({ name: p.name }));
      
      // Parse the voice command using the enhanced parser
      const result = parseEnhancedVoiceCommand(text, productNames);
      
      if (result.products.length > 0) {
        setProducts(prev => [...prev, ...result.products]);
        toast.success(`Added ${result.products.length} products to table`);
      } else {
        toast.warning('No products recognized. Please try again.');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error('Failed to process command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRow = () => {
    setProducts([...products, { name: '', quantity: 1, unit: 'pcs', price: 0 }]);
    setEditingIndex(products.length);
  };

  const handleDeleteRow = (index: number) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleEditRow = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    setEditingIndex(null);
  };

  const handleFieldChange = (index: number, field: keyof EnhancedProduct, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleAddToInventory = () => {
    if (products.length === 0) {
      toast.error('No products to add');
      return;
    }

    products.forEach(product => {
      if (product.name) {
        addProduct({
          name: product.name,
          quantity: product.quantity || 1,
          unit: product.unit || 'pcs',
          position: product.position || '',
          price: product.price || 0,
          expiry: product.expiry ? new Date(product.expiry).toISOString() : undefined,
        });
      }
    });

    toast.success(`Added ${products.length} products to inventory`);
    
    if (onConfirm) {
      onConfirm(products);
    }
    
    onOpenChange(false);
    setProducts([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Voice Product Recognition
            <div className="ml-auto">
              <Button
                variant={isListening ? "destructive" : "default"}
                size="sm"
                onClick={isListening ? stopRecognition : startRecognition}
                disabled={isProcessing}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Voice
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Left side - Transcript and controls */}
          <div className="col-span-1 space-y-4">
            {/* Transcript Display */}
            {(transcript || isListening) && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Voice Input</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <p className={`text-sm ${isListening ? "animate-pulse" : ""}`}>
                    {transcript || "Listening..."}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Processing voice command...</span>
              </div>
            )}
            
            <div className="pt-4">
              <Button 
                className="w-full"
                variant="outline"
                onClick={handleAddRow}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Row
              </Button>
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-sm">
                <p className="font-medium mb-2">Voice Commands:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>"Add 5kg rice shelf 3"</li>
                  <li>"2 bottles of oil at $5 each"</li>
                  <li>"10 packages of sugar"</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Product table */}
          <div className="col-span-2">
            <Card className={className}>
              <Table>
                <TableCaption>
                  {products.length === 0 ? 
                    "No products added yet. Use voice or add rows manually." : 
                    `${products.length} product(s) added`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-card"
                      >
                        <TableCell>
                          {editingIndex === index ? (
                            <Input 
                              value={product.name} 
                              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                            />
                          ) : (
                            product.name || <Badge variant="outline">Not specified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input 
                              type="number" 
                              min="1"
                              value={product.quantity} 
                              onChange={(e) => handleFieldChange(index, 'quantity', Number(e.target.value))}
                            />
                          ) : (
                            product.quantity || '1'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Select
                              value={product.unit || 'pcs'}
                              onValueChange={(value) => handleFieldChange(index, 'unit', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">pcs</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="l">l</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="box">box</SelectItem>
                                <SelectItem value="pack">pack</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            product.unit || 'pcs'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input 
                              type="number" 
                              min="0"
                              step="0.01"
                              value={product.price} 
                              onChange={(e) => handleFieldChange(index, 'price', Number(e.target.value))}
                            />
                          ) : (
                            (product.price ? `$${product.price}` : '-')
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input 
                              value={product.position || ''} 
                              onChange={(e) => handleFieldChange(index, 'position', e.target.value)}
                              placeholder="e.g. Shelf 3"
                            />
                          ) : (
                            product.position || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {editingIndex === index ? (
                              <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEditRow(index)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDeleteRow(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
              
              <div className="p-4 flex justify-end">
                <Button 
                  onClick={handleAddToInventory}
                  disabled={products.length === 0}
                >
                  Add All to Inventory
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceProductTable;
