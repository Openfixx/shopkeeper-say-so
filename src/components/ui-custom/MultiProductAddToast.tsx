
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiProduct } from '@/utils/multiVoiceParse';

interface MultiProductAddToastProps {
  products: MultiProduct[];
  onClose: () => void;
  onComplete?: () => void;
}

const MultiProductAddToast: React.FC<MultiProductAddToastProps> = ({
  products,
  onClose,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(Array(products.length).fill(false));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (products.length === 0) return;
    
    // Process each product sequentially with a delay
    const timer = setTimeout(() => {
      if (currentIndex < products.length) {
        setCompleted(prev => {
          const updated = [...prev];
          updated[currentIndex] = true;
          return updated;
        });
        
        if (currentIndex < products.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1500);
        }
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [currentIndex, products.length, onComplete]);

  // Handle closing the toast
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <Card className="border shadow-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-violet-500" />
                  <h3 className="text-base font-medium">Adding Products</h3>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {products.map((product, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                      index === currentIndex ? 'bg-violet-500/20 dark:bg-violet-800/40' : 
                      completed[index] ? 'bg-green-500/10 dark:bg-green-900/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center">
                        {completed[index] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : index === currentIndex ? (
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                            {product.quantity} {product.unit}
                          </Badge>
                          {product.price && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                              ₹{product.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {completed.filter(Boolean).length}/{products.length} products added
                </div>
                <Button 
                  size="sm" 
                  variant="default"
                  className="bg-gradient-to-r from-violet-500 to-indigo-600"
                  onClick={handleClose}
                >
                  {completed.every(Boolean) ? 'Done' : 'Processing...'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MultiProductAddToast;
