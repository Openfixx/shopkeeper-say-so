
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Barcode, Plus, Search, Settings, Store, BarChart3, Users, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import SiriStyleVoiceUI from '@/components/ui-custom/SiriStyleVoiceUI';
import ModernDashboardCard from '@/components/ui-custom/ModernDashboardCard';
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import MultiProductAddToast from '@/components/ui-custom/MultiProductAddToast';

const Index = () => {
  const { user } = useAuth();
  const { products, addProduct } = useInventory();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);
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
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          {user?.email ? t('welcome') + " " + user.email.split('@')[0] + "!" : t('welcome') + " " + t('user') + "!"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          <SiriStyleVoiceUI 
            onCommand={handleVoiceCommand}
            className="md:col-span-2 xl:col-span-3"
          />
        
          <ModernDashboardCard
            title={t('totalProducts')}
            value={products.length}
            description={t('manageInventory')}
            icon={<Package2 className="h-4 w-4 text-white" />}
            gradientFrom="from-violet-600"
            gradientTo="to-indigo-600"
            delay={1}
          />
          
          <ModernDashboardCard
            title={t('totalValue')}
            value={formatCurrency(products.reduce((acc, product) => acc + product.price * product.quantity, 0))}
            description={t('currentInventoryValue')}
            icon={<BarChart3 className="h-4 w-4 text-white" />}
            gradientFrom="from-blue-600"
            gradientTo="to-cyan-600"
            delay={2}
          />
          
          <ModernDashboardCard
            title={t('customers')}
            value="0"
            description={t('manageCustomers')}
            icon={<Users className="h-4 w-4 text-white" />}
            gradientFrom="from-emerald-600"
            gradientTo="to-teal-600"
            delay={3}
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 md:mt-8"
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 backdrop-blur-sm shadow-lg">
          <CardHeader className="p-4 border-b border-violet-500/10">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-y divide-violet-500/10">
              <Button 
                onClick={() => navigate('/products/add')} 
                className="py-6 h-auto flex flex-col items-center justify-center rounded-none bg-transparent hover:bg-violet-500/10 transition-colors border-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span>{t('addProduct')}</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/products')} 
                className="py-6 h-auto flex flex-col items-center justify-center rounded-none bg-transparent hover:bg-blue-500/10 transition-colors border-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center mb-2">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span>{t('searchProducts')}</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/billing')} 
                className="py-6 h-auto flex flex-col items-center justify-center rounded-none bg-transparent hover:bg-amber-500/10 transition-colors border-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-2">
                  <Barcode className="h-5 w-5 text-white" />
                </div>
                <span>{t('billing')}</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/settings')} 
                className="py-6 h-auto flex flex-col items-center justify-center rounded-none bg-transparent hover:bg-slate-500/10 transition-colors border-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-600 to-gray-600 flex items-center justify-center mb-2">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span>{t('settings')}</span>
              </Button>
              
              <Button 
                onClick={() => setIsVoiceCommandActive(true)}
                className="py-6 h-auto flex flex-col items-center justify-center rounded-none bg-transparent hover:bg-purple-500/10 transition-colors border-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-2">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <span>Voice Command</span>
              </Button>
            </div>
          </CardContent>
        </Card>
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
