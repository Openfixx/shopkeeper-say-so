
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { Package2, Barcode, Plus, Search, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import SiriStyleVoiceUI from '@/components/ui-custom/SiriStyleVoiceUI';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';
import MultiProductAddToast from '@/components/ui-custom/MultiProductAddToast';
import VoiceCommandPopup from '@/components/ui-custom/VoiceCommandPopup';
import { CommandResult, VoiceProduct } from '@/types/voice';
import { validateProductDetails } from '@/utils/voiceCommandUtils';

const Index = () => {
  const { user } = useAuth();
  const { products, addProduct } = useInventory();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [multiProducts, setMultiProducts] = useState<VoiceProduct[]>([]);
  const [showMultiProductToast, setShowMultiProductToast] = useState(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  
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
              position: product.position || 'unspecified', 
              image_url: ''
            });
          }, index * 800);
        });
        
        return;
      }
    }
    
    // Handle single product command
    if (command.toLowerCase().includes('add') && processedProduct.name) {
      // For single product, show the confirmation popup
      setCommandResult({
        productName: processedProduct.name,
        quantity: {
          value: processedProduct.quantity || 1,
          unit: processedProduct.unit || 'unit'
        },
        rawText: command
      });
    } else if (command.toLowerCase().includes('search') || command.toLowerCase().includes('find')) {
      // Handle search command
      navigate('/products', { state: { searchQuery: processedProduct.name } });
    } else if (command.toLowerCase().includes('bill')) {
      // Handle bill command
      navigate('/billing');
    }
  };
  
  const handleConfirmProduct = (location?: string) => {
    if (!commandResult) return;
    
    setIsProcessingCommand(true);
    
    // Validate product details
    const productDetails = {
      name: commandResult.productName,
      quantity: commandResult.quantity?.value || 1,
      unit: commandResult.quantity?.unit || 'unit',
      position: location || commandResult.position || 'unspecified',
      price: commandResult.price || 0,
      expiry: commandResult.expiry
    };
    
    const validation = validateProductDetails(productDetails);
    
    if (!validation.isValid) {
      toast({
        title: "Missing Information",
        description: `Please provide: ${validation.missingFields.join(', ')}`,
        variant: "destructive"
      });
      setIsProcessingCommand(false);
      return;
    }
    
    addProduct({
      name: productDetails.name,
      quantity: productDetails.quantity,
      unit: productDetails.unit,
      price: productDetails.price || 0,
      position: productDetails.position,
      image_url: commandResult.imageUrl || ''
    });
    
    toast({
      title: "Product Added",
      description: `Added ${productDetails.quantity} ${productDetails.unit} of ${productDetails.name} to ${productDetails.position}`
    });
    
    setIsProcessingCommand(false);
    setCommandResult(null);
  };
  
  const handleCancelCommand = () => {
    setCommandResult(null);
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
      
      {/* Keep the original SiriStyleVoiceUI on the dashboard */}
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
            toast({
              title: "Products Added",
              description: `Added ${multiProducts.length} products to inventory`
            });
            navigate('/products');
          }}
        />
      )}
      
      {/* Voice Command Popup */}
      {commandResult && (
        <VoiceCommandPopup
          result={commandResult}
          onConfirm={handleConfirmProduct}
          onCancel={handleCancelCommand}
          loading={isProcessingCommand}
        />
      )}
    </div>
  );
};

export default Index;
