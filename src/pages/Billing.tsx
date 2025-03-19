
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventory, BillItem } from '@/context/InventoryContext';
import SearchBar from '@/components/ui-custom/SearchBar';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import QuickBillDialog from '@/components/ui-custom/QuickBillDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  CreditCard,
  MinusCircle,
  Plus,
  PlusCircle,
  PrinterIcon,
  ShoppingCart,
  Trash2,
  Receipt,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductCard from '@/components/ui-custom/ProductCard';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';

const Billing: React.FC = () => {
  const { products, currentBill, startNewBill, addToBill, removeFromBill, completeBill, cancelBill, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [quickBillTranscript, setQuickBillTranscript] = useState('');
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    const recognizedCommand = detectCommandType(command);
    
    if (recognizedCommand.type === VOICE_COMMAND_TYPES.CREATE_BILL) {
      // For Hindi commands like "bill banao" or any bill creation command
      if (!currentBill) {
        startNewBill();
      }
      setQuickBillTranscript(command);
      setIsQuickBillOpen(true);
      return;
    }
    
    if (lowerCommand.includes('prepare a bill') || lowerCommand.includes('start bill')) {
      if (!currentBill) {
        startNewBill();
        toast.success('New bill started');
      } else {
        toast.info('A bill is already in progress');
      }
    } 
    else if (lowerCommand.includes('add')) {
      if (!currentBill) {
        startNewBill();
      }
      
      // Try to parse product quantity and name
      const addPattern = /add\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|packet|box)?\s+(?:of\s+)?(.+)/i;
      const match = lowerCommand.match(addPattern);
      
      if (match) {
        const quantity = parseFloat(match[1]);
        const productName = match[3].trim();
        
        // Find product by name (case insensitive)
        const product = products.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        
        if (product) {
          addToBill(product.id, quantity);
        } else {
          toast.error(`Product "${productName}" not found`);
        }
      } else {
        // Open quick bill dialog with the transcript
        setQuickBillTranscript(command);
        setIsQuickBillOpen(true);
      }
    }
    else if (lowerCommand.includes('complete') || lowerCommand.includes('finish')) {
      if (currentBill && currentBill.items.length > 0) {
        completeBill();
        toast.success('Bill completed');
      } else {
        toast.error('No items in the current bill');
      }
    }
    else if (lowerCommand.includes('cancel')) {
      if (currentBill) {
        cancelBill();
        toast.success('Bill cancelled');
      } else {
        toast.error('No active bill to cancel');
      }
    }
    else if (lowerCommand.includes('print') || lowerCommand.includes('share')) {
      if (currentBill && currentBill.items.length > 0) {
        setIsPrintPreviewOpen(true);
      } else {
        toast.error('No items in the current bill');
      }
    }
    else {
      // If no specific command recognized, but contains product-related words,
      // open quick bill dialog
      const containsProductWords = lowerCommand.split(' ').some(word => 
        products.some(product => product.name.toLowerCase().includes(word))
      );
      
      if (containsProductWords) {
        setQuickBillTranscript(command);
        setIsQuickBillOpen(true);
      } else {
        toast.info(`Command not recognized: "${command}"`);
      }
    }
  };
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Create and manage bills
          </p>
        </div>
        <div className="flex space-x-2">
          <VoiceCommandButton 
            onVoiceCommand={handleVoiceCommand}
            label="Voice Bill"
            pulseColor="bg-green-500"
            listenMessage="Try saying 'bill banao' or list items for a bill"
          />
          
          {!currentBill ? (
            <Button onClick={startNewBill}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Bill
            </Button>
          ) : (
            <Button variant="outline" onClick={cancelBill}>
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Bill
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SearchBar
            placeholder="Search products..."
            onSearch={handleSearch}
            className="w-full"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToBill={(id, quantity) => addToBill(id, quantity)}
                  className="h-full"
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                <CreditCard className="h-12 w-12 text-muted-foreground opacity-20" />
                <div>
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? `No products matching "${searchQuery}"`
                      : "Add products to your inventory first"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Bill</span>
                {currentBill && (
                  <span className="text-sm font-normal text-muted-foreground">
                    #{currentBill.id.slice(-4)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!currentBill ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-20" />
                  <div>
                    <h3 className="text-lg font-medium">No active bill</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start a new bill to add products
                    </p>
                  </div>
                  <Button onClick={startNewBill}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Bill
                  </Button>
                </div>
              ) : (
                <>
                  {currentBill.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
                      <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-20" />
                      <div>
                        <h3 className="text-base font-medium">Empty bill</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add products to this bill
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
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
                            {currentBill.items.map((item) => (
                              <TableRow key={item.productId}>
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
                                    onClick={() => removeFromBill(item.productId)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-base font-medium">
                          <span>Total</span>
                          <span>{formatter.format(currentBill.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            {currentBill && (
              <CardFooter className="flex flex-col space-y-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    disabled={!currentBill || currentBill.items.length === 0}
                    onClick={() => setIsPrintPreviewOpen(true)}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button 
                    disabled={!currentBill || currentBill.items.length === 0}
                    onClick={completeBill}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Print/Share Preview Sheet */}
      <Sheet open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
          <SheetHeader>
            <SheetTitle>Bill Preview</SheetTitle>
            <SheetDescription>
              Review and share the bill with customer
            </SheetDescription>
          </SheetHeader>
          
          {currentBill && (
            <div className="py-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Inventory Pro Shop</h2>
                <p className="text-sm text-muted-foreground">
                  123 Main Street, City, Country
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: +1 (123) 456-7890
                </p>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p>Bill #: <span className="font-medium">{currentBill.id.slice(-8)}</span></p>
                  <p>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
                </div>
                <div>
                  <p>Time: <span className="font-medium">{new Date().toLocaleTimeString()}</span></p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBill.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-right">{formatter.format(item.price)}</TableCell>
                      <TableCell className="text-right">{formatter.format(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatter.format(currentBill.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tax (0%):</span>
                  <span>{formatter.format(0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatter.format(currentBill.total)}</span>
                </div>
              </div>
              
              <div className="mt-10 text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p>Please visit again</p>
              </div>
            </div>
          )}
          
          <SheetFooter className="mt-6 flex-row space-x-2">
            <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Bill ready to share');
              setIsPrintPreviewOpen(false);
            }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button onClick={() => {
              toast.success('Bill sent to printer');
              setIsPrintPreviewOpen(false);
            }}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Quick Bill Dialog with enhanced voice commands */}
      <QuickBillDialog 
        open={isQuickBillOpen} 
        onOpenChange={setIsQuickBillOpen} 
        initialTranscript={quickBillTranscript}
      />
    </div>
  );
};

export default Billing;
