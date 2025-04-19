
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Barcode, Plus, Search, Settings, Store, BarChart3, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import SiriStyleVoiceUI from '@/components/ui-custom/SiriStyleVoiceUI';
import ModernDashboardCard from '@/components/ui-custom/ModernDashboardCard';

const Index = () => {
  const { user } = useAuth();
  const { products, addProduct } = useInventory();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);
  
  const handleVoiceCommand = (command: string, processedProduct: { name: string, quantity?: number, unit?: string }) => {
    console.log("Voice command:", command);
    console.log("Processed product:", processedProduct);
    
    // If it looks like an add product command
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
          description: '',
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
    <div className="container mx-auto p-6 space-y-6">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          {t('welcome')} {user?.email || t('user')}!
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SiriStyleVoiceUI 
            onCommand={handleVoiceCommand}
            className="md:col-span-2 xl:col-span-3"
          />
        
          <ModernDashboardCard
            title={t('totalProducts')}
            value={products.length}
            description={t('manageInventory')}
            icon={<Package2 className="h-4 w-4 text-white" />}
            gradientFrom="from-violet-500"
            gradientTo="to-fuchsia-500"
            delay={1}
          />
          
          <ModernDashboardCard
            title={t('totalValue')}
            value={formatCurrency(products.reduce((acc, product) => acc + product.price * product.quantity, 0))}
            description={t('currentInventoryValue')}
            icon={<BarChart3 className="h-4 w-4 text-white" />}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
            delay={2}
          />
          
          <ModernDashboardCard
            title={t('customers')}
            value="0"
            description={t('manageCustomers')}
            icon={<Users className="h-4 w-4 text-white" />}
            gradientFrom="from-green-500"
            gradientTo="to-emerald-500"
            delay={3}
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm">
          <CardHeader className="p-4 border-b border-purple-500/10">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6">
            <Button 
              onClick={() => navigate('/products/add')} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addProduct')}
            </Button>
            <Button 
              onClick={() => navigate('/products')} 
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 transition-opacity"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('searchProducts')}
            </Button>
            <Button 
              onClick={() => navigate('/billing')} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity"
            >
              <Barcode className="h-4 w-4 mr-2" />
              {t('billing')}
            </Button>
            <Button 
              onClick={() => navigate('/settings')} 
              className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:opacity-90 transition-opacity"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
            <Button 
              onClick={() => navigate('/shop-finder')} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 transition-opacity"
            >
              <Store className="h-4 w-4 mr-2" />
              {t('shopFinder')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;
