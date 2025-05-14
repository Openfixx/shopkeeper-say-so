
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useInventory } from '@/context/InventoryContext';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct } = useInventory();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && products.length > 0) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
      setLoading(false);
    }
  }, [id, products, navigate]);

  const handleDelete = () => {
    if (id) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
      navigate('/products');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Product not found</h3>
              <p className="text-sm text-gray-500 mt-2">
                The product you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/products')} className="mt-4">
                Go back to products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate('/products')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pt-6">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full max-w-[300px] rounded-md object-cover"
                />
              ) : (
                <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500">No image available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {product.category || 'No category'}
                  </CardDescription>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigate(`/products/edit/${id}`)}
                    className="mr-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="mt-1">{product.description || 'No description provided.'}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                    <p className="mt-1 text-lg font-medium">
                      {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</h3>
                    <p className="mt-1 text-lg font-medium">
                      {product.quantity} {product.unit || 'units'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</h3>
                    <p className="mt-1">{product.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</h3>
                    <p className="mt-1">{product.barcode || 'N/A'}</p>
                  </div>
                </div>
                
                {product.location && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                      <p className="mt-1">{product.location}</p>
                    </div>
                  </>
                )}
                
                {product.expiryDate && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</h3>
                      <p className="mt-1">{new Date(product.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'Unknown'}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
