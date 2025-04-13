import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types';
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
  QrCode,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';

const BillingPage: React.FC = () => {
  const { products, currentBill, startNewBill, addToBill, removeFromBill, completeBill, cancelBill, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [quickBillTranscript, setQuickBillTranscript] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  
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
      const match = lowerCommand.match(/add\s+(\d+)\s+(.*)/i);
      if (match && match[2]) {
        const quantity = parseInt(match[1]);
        const productName = match[2].trim();
        
        const product = products.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        
        if (product) {
          addToBill(product.id, quantity);
          toast.success(`Added ${quantity} ${product.name} to bill`);
        } else {
          toast.error(`Product "${productName}" not found`);
        }
      } else {
        toast.error('Could not understand the product to add');
      }
    }
    else if (lowerCommand.includes('complete bill') || lowerCommand.includes('checkout')) {
      if (currentBill && currentBill.items.length > 0) {
        completeBill();
        toast.success('Bill completed');
      } else {
        toast.error('Cannot complete an empty bill');
      }
    }
    else if (lowerCommand.includes('cancel bill')) {
      if (currentBill) {
        cancelBill();
        toast.success('Bill cancelled');
      } else {
        toast.error('No active bill to cancel');
      }
    }
    else {
      toast.info(`Command not recognized: "${command}"`);
    }
  };
  
  const convertProduct = (product: any): Product => {
    return {
      ...product,
      image_url: product.image || '',
      user_id: product.userId || '',
    };
  };
  
  const handleAddToBill = (product: any) => {
    if (!currentBill) {
      startNewBill();
    }
    addToBill(product.id, 1);
    toast.success(`Added ${product.name} to bill`);
  };
  
  const handleRemoveFromBill = (index: number) => {
    removeFromBill(index.toString());
    toast.success('Item removed from bill');
  };
  
  const handleCompleteBill = () => {
    if (!currentBill || currentBill.items.length === 0) {
      toast.error('Cannot complete an empty bill');
      return;
    }
    
    completeBill();
    toast.success('Bill completed successfully');
  };
  
  const handlePrintBill = () => {
    setIsPrintPreviewOpen(true);
    toast.success('Preparing print preview');
  };
  
  const calculateTotal = () => {
    if (!currentBill) return 0;
    return currentBill.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient-blue">Billing</h2>
          <p className="text-muted-foreground">
            Create and manage customer bills
          </p>
        </div>
        <div className="flex space-x-2">
          <VoiceCommandButton 
            onVoiceCommand={handleVoiceCommand}
            showDialog={true}
            label="Voice Command"
            variant="outline"
          />
          
          <Button onClick={() => startNewBill()}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div 
          className="lg:col-span-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="border-none shadow-md rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40">
            <CardHeader className="pb-2">
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchBar
                placeholder="Search products..."
                onSearch={handleSearch}
                className="mb-4"
              />
              
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                variants={containerVariants}
              >
                {isLoading ? (
                  Array(9).fill(0).map((_, i) => (
                    <motion.div key={i} variants={itemVariants}>
                      <Card className="h-[180px] relative">
                        <CardContent className="p-0">
                          <Skeleton className="w-full h-24" />
                          <div className="p-4">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const typedProduct = convertProduct(product);
                    return (
                      <motion.div key={typedProduct.id} variants={itemVariants}>
                        <Card 
                          className="h-[180px] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleAddToBill(product)}
                        >
                          <CardContent className="p-0">
                            <div className="h-24 bg-muted flex items-center justify-center overflow-hidden">
                              {typedProduct.image_url ? (
                                <img 
                                  src={typedProduct.image_url} 
                                  alt={typedProduct.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-20" />
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-sm line-clamp-1">{typedProduct.name}</h3>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-muted-foreground text-sm">{typedProduct.quantity} {typedProduct.unit}</p>
                                <p className="font-semibold">{formatter.format(typedProduct.price)}</p>
                              </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToBill(typedProduct);
                                }}
                              >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
                    <p className="text-muted-foreground">No products found</p>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-4"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          className="lg:col-span-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="billing-card border-none shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Current Bill</span>
                {currentBill && (
                  <span className="text-sm font-normal text-muted-foreground">
                    #{currentBill.id.slice(-5)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] overflow-hidden flex flex-col">
              {!currentBill ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Receipt className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
                  <p className="text-muted-foreground">No active bill</p>
                  <Button 
                    className="mt-4"
                    onClick={() => startNewBill()}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start a New Bill
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {currentBill.items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                        <p className="text-muted-foreground">No items in bill</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add products from the left panel
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[30px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBill.items.map((item, index) => (
                            <TableRow key={index} className="group">
                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatter.format(item.price)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatter.format(item.price * item.quantity)}
                              </TableCell>
                              <TableCell className="p-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveFromBill(index)}
                                >
                                  <MinusCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                
                  <div className="mt-6 pt-6 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatter.format(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span>{formatter.format(calculateTotal() * 0.08)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatter.format(calculateTotal() * 1.08)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                          className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setPaymentMethod('cash')}
                        >
                          <DollarSign className="h-5 w-5" />
                          <span className="text-xs">Cash</span>
                        </Button>
                        <Button 
                          variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                          className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setPaymentMethod('card')}
                        >
                          <CreditCard className="h-5 w-5" />
                          <span className="text-xs">Card</span>
                        </Button>
                        <Button 
                          variant={paymentMethod === 'wallet' ? 'default' : 'outline'} 
                          className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${paymentMethod === 'wallet' ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setPaymentMethod('wallet')}
                        >
                          <Wallet className="h-5 w-5" />
                          <span className="text-xs">Wallet</span>
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className="gap-1"
                          onClick={handlePrintBill}
                        >
                          <PrinterIcon className="h-4 w-4" />
                          Print
                        </Button>
                        <Button 
                          variant="outline" 
                          className="gap-1"
                        >
                          <QrCode className="h-4 w-4" />
                          QR Code
                        </Button>
                      </div>
                      
                      <Button 
                        className="w-full h-12 rounded-xl gap-1"
                        onClick={handleCompleteBill}
                        disabled={currentBill.items.length === 0}
                      >
                        Complete Payment
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full gap-1 text-destructive hover:text-destructive"
                        onClick={() => cancelBill()}
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel Bill
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <Sheet open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Print Preview</SheetTitle>
            <SheetDescription>
              Review the bill before printing or sharing
            </SheetDescription>
          </SheetHeader>
          
          {currentBill && (
            <div className="mt-6 space-y-6">
              <div className="text-center">
                <h3 className="font-bold text-xl">InventoryPro</h3>
                <p className="text-sm text-muted-foreground">Bill #{currentBill.id.slice(-5)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBill.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatter.format(item.price)}</TableCell>
                      <TableCell className="text-right">{formatter.format(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatter.format(calculateTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>{formatter.format(calculateTotal() * 0.08)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatter.format(calculateTotal() * 1.08)}</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p>Payment method: {paymentMethod === 'card' ? 'Credit Card' : paymentMethod === 'wallet' ? 'Digital Wallet' : 'Cash'}</p>
              </div>
              
              <SheetFooter>
                <Button className="w-full gap-1" onClick={() => setIsPrintPreviewOpen(false)}>
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" className="w-full gap-1">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <QuickBillDialog
        open={isQuickBillOpen}
        onOpenChange={setIsQuickBillOpen}
        transcript={quickBillTranscript}
      />
    </div>
  );
};

export default BillingPage;
