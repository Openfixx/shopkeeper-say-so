import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Barcode, Plus, Search, Settings, Shop, FileBarGraph, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/formatters';

const Index = () => {
  const { user } = useAuth();
  const { products } = useInventory();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  return (
    <motion.div 
      className="container mx-auto p-6 space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.2
          }
        }
      }}
    >
      <motion.div variants={cardVariants}>
        <Card className="bg-white dark:bg-neutral-950 shadow-md rounded-lg overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold">{t('dashboard')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>
              {t('welcome')} {user?.displayName || user?.email || t('user')}!
            </p>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants}>
          <Card className="bg-white dark:bg-neutral-950 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalProducts')}</CardTitle>
              <Package2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('manageInventory')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className="bg-white dark:bg-neutral-950 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
              <FileBarGraph className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(products.reduce((acc, product) => acc + product.price * product.quantity, 0))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('currentInventoryValue')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className="bg-white dark:bg-neutral-950 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('customers')}</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('manageCustomers')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div variants={cardVariants}>
        <Card className="bg-white dark:bg-neutral-950 shadow-md rounded-lg overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold">{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6">
            <Button onClick={() => navigate('/products/add')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('addProduct')}
            </Button>
            <Button onClick={() => navigate('/products')} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {t('searchProducts')}
            </Button>
            <Button onClick={() => navigate('/billing')} className="w-full">
              <Barcode className="h-4 w-4 mr-2" />
              {t('billing')}
            </Button>
            <Button onClick={() => navigate('/settings')} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
            <Button onClick={() => navigate('/shop-finder')} className="w-full">
              <Shop className="h-4 w-4 mr-2" />
              {t('shopFinder')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Index;
