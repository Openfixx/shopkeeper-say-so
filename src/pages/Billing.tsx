
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types';
import SearchBar from '@/components/ui-custom/SearchBar';
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

const BillingPage: React.FC = () => {
  const { products, currentBill, startNewBill, addToBill, removeFromBill, completeBill, cancelBill, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  
  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
            <CardContent className="h-[580px] overflow-hidden flex flex-col">
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
                      <div className="p-4 mb-4 rounded-xl bg-card/50">
                        <Table className="border-collapse">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentBill.items.map((item, index) => (
                              <TableRow key={index} className="hover:bg-transparent">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                  {formatter.format(item.price * item.quantity)}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleRemoveFromBill(index)}
                                  >
                                    <MinusCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    <div className="px-4 py-2 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatter.format(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tax (0%)</span>
                        <span>{formatter.format(0)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span className="text-xl">{formatter.format(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Payment Method</p>
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${paymentMethod === 'cash' ? '' : 'border-dashed'}`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        Cash
                      </Button>
                      <Button 
                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${paymentMethod === 'card' ? '' : 'border-dashed'}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard className="mr-1 h-4 w-4" />
                        Card
                      </Button>
                      <Button 
                        variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${paymentMethod === 'wallet' ? '' : 'border-dashed'}`}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <Wallet className="mr-1 h-4 w-4" />
                        UPI
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="destructive"
                        className="w-full"
                        onClick={() => cancelBill()}
                        disabled={!currentBill || currentBill.items.length === 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Bill
                      </Button>
                      <Button 
                        variant="default"
                        className="w-full"
                        onClick={handleCompleteBill}
                        disabled={!currentBill || currentBill.items.length === 0}
                      >
                        <PrinterIcon className="mr-2 h-4 w-4" />
                        Complete & Print
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Print Preview Sheet */}
      <Sheet 
        open={isPrintPreviewOpen} 
        onOpenChange={setIsPrintPreviewOpen}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Bill Preview</SheetTitle>
            <SheetDescription>
              Review the bill before printing or sharing.
            </SheetDescription>
          </SheetHeader>
          
          {currentBill && (
            <div className="mt-6 space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-xl mb-1">Shopkeeper Say So</h3>
                <p className="text-muted-foreground text-sm">
                  Receipt #{currentBill.id.slice(-8)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {new Date().toLocaleString()}
                </p>
              </div>
              
              <div className="border-t border-b py-4 space-y-2">
                {currentBill.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <span>{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span>{formatter.format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatter.format(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatter.format(0)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2">
                  <span>Total</span>
                  <span>{formatter.format(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>
                    {paymentMethod === 'cash' && 'Cash'}
                    {paymentMethod === 'card' && 'Card Payment'}
                    {paymentMethod === 'wallet' && 'UPI / Wallet'}
                  </span>
                </div>
              </div>
              
              <div className="text-center border-t pt-4 pb-2 text-xs text-muted-foreground">
                <p>Thank you for your purchase!</p>
                <p>Visit us again soon.</p>
              </div>
            </div>
          )}
          
          <SheetFooter className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handlePrintBill}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BillingPage;
