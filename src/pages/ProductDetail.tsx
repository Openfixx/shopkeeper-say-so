import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Clock, 
  Package2,
  MapPin
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductImage from '@/components/ProductImage';
import ProductLocationMap from '@/components/ProductLocationMap';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct, updateProduct } = useInventory();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      if (id) {
        const foundProduct = products.find(p => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
        }
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id, products]);

  const handleDelete = () => {
    if (id) {
      deleteProduct(id);
      toast.success(`${product?.name || 'Product'} deleted`);
      navigate('/products');
    }
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-40 ml-4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show not found message if product doesn't exist
  if (!product) {
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center py-16">
        <h1 className="text-2xl font-bold mb-4">{t('productNotFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('productMayHaveBeenDeleted')}</p>
        <Button onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToProducts')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="hover:bg-transparent p-0"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t('backToProducts')}
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/products/edit/${id}`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {t('edit')}
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Product image and details */}
        <motion.div 
          className="md:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="relative pt-[56.25%] bg-muted">
              <ProductImage
                src={product?.image_url}
                alt={product?.name}
                className="absolute top-0 left-0 w-full h-full object-contain p-4"
              />
            </div>
            
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-2xl font-bold">{product?.name}</span>
                <Badge className="ml-2">{product?.category || t('uncategorized')}</Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-4 rounded-md flex items-center">
                  <Package2 className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('quantity')}</p>
                    <p className="font-medium">
                      {product?.quantity} {product?.unit}
                    </p>
                  </div>
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-md flex items-center">
                  <Clock className="mr-3 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('expiry')}</p>
                    <p className="font-medium">
                      {product?.expiry || t('notSpecified')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="flex items-center mb-3">
                  <MapPin className="mr-2 h-5 w-5 text-rose-500" />
                  <h3 className="font-medium">{t('location')}: {product?.position || t('notSpecified')}</h3>
                </div>
                
                <ProductLocationMap position={product?.position} />
              </div>
              
              {product?.notes && (
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">{t('notes')}:</h3>
                  <p className="text-muted-foreground">{product.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Product sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('productDetails')}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('price')}</p>
                <p className="text-3xl font-bold">{formatCurrency(product?.price || 0)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
                <p className="text-xl font-semibold">{formatCurrency((product?.price || 0) * (product?.quantity || 0))}</p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t('productId')}</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {product?.id}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('lastUpdated')}</p>
                <p className="text-sm">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full" 
                onClick={() => navigate(`/products/edit/${id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('editProduct')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/products')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('allProducts')}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProduct')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteProductConfirmation', { name: product?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetail;
