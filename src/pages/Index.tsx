
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Barcode, Plus, Search, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import SiriStyleVoiceUI from '@/components/ui-custom/SiriStyleVoiceUI';
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import MultiProductAddToast from '@/components/ui-custom/MultiProductAddToast';

const Index = () => {
  const { user } = useAuth();
  const { products, addProduct } = useInventory();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [multiProducts, setMultiProducts] = useState<MultiProduct[]>([]);
  const [showMultiProductToast, setShowMultiProductToast] = useState(false);
  
  const handleVoiceCommand = (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => {
    console.log("Voice command:", command);
    console.log("Processed product:", processedProduct);
    
    // Check if it's a multi-product command by looking for commas or "and"
    if (command.includes(',') || /\band\b/i.test(command)) {
      // Use our multi-product parser
      const productNames = products.map(p => ({ name: p.name }));
      const parsedProducts = parseMultiProductCommand(command, productNames);
      
      if (parsedProducts.length > 0) {
        setMultiProducts(parsedProducts);
        setShowMultiProductToast(true);
        
        // Add all products with a delay
        parsedProducts.forEach((product, index) => {
          setTimeout(() => {
            addProduct({
              name: product.name,
              quantity: product.quantity || 1,
              unit: product.unit || 'unit',
              price: product.price || 0,
              position: 'Default', 
              image_url: ''
            });
          }, index * 800);
        });
        
        return;
      }
    }
    
    // Handle single product command
    if (command.toLowerCase().includes('add') && processedProduct.name) {
      // Show toast notification about what we recognized
      toast.success(`Adding product: ${processedProduct.name}`);
      
      // Navigate to add product page or add the product directly
      if (processedProduct.quantity && processedProduct.unit) {
        // Add product with detected quantity and unit
        addProduct({
          name: processedProduct.name,
          quantity: processedProduct.quantity,
          unit: processedProduct.unit,
          price: 0, // Default price
          position: 'Default', // Default position
          image_url: ''
        });
      } else {
        // Navigate to add product page with pre-filled name
        navigate('/products/add', { state: { productName: processedProduct.name } });
      }
    } else if (command.toLowerCase().includes('search') || command.toLowerCase().includes('find')) {
      // Handle search command
      navigate('/products', { state: { searchQuery: processedProduct.name } });
    }
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <motion.div 
        className="mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">
          {user?.email ? `Welcome ${user.email.split('@')[0]}!` : `Welcome!`}
        </h1>
        <p className="text-muted-foreground">
          {t('manageInventory')} {new Date().toLocaleDateString()}
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SiriStyleVoiceUI 
          onCommand={handleVoiceCommand}
          className="mb-6"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                <Package2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="font-medium">{t('totalProducts')}</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium">{t('totalValue')}</p>
              <p className="text-2xl font-bold">{formatCurrency(products.reduce((acc, product) => acc + product.price * product.quantity, 0))}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-teal-500/5 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium">{t('addProduct')}</p>
              <Button 
                onClick={() => navigate('/products/add')} 
                variant="outline" 
                className="mt-3"
              >
                Add New
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                <Barcode className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-medium">{t('billing')}</p>
              <Button 
                onClick={() => navigate('/billing')} 
                variant="outline" 
                className="mt-3"
              >
                Create Bill
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
      
      {showMultiProductToast && (
        <MultiProductAddToast 
          products={multiProducts} 
          onClose={() => setShowMultiProductToast(false)}
          onComplete={() => {
            toast.success(`Added ${multiProducts.length} products to inventory`);
            navigate('/products');
          }}
        />
      )}
    </div>
  );
};

export default Index;
