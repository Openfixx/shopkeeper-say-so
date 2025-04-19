import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Product } from '@/context/InventoryContext';
import { convertProduct } from '@/utils/productUtils';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct } = useInventory();
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    unit: '',
    position: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id && products.length > 0) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        const convertedProduct = foundProduct;
        setProduct(convertedProduct);
        setFormData({
          name: foundProduct.name || '',
          description: '',
          price: String(foundProduct.price || 0),
          quantity: String(foundProduct.quantity || 0),
          unit: foundProduct.unit || '',
          position: foundProduct.position || '',
          image: foundProduct.image || ''
        });
      }
    }
  }, [id, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !id) return;
    
    try {
      const updatedProduct: Product = {
        ...product,
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        position: formData.position,
        image: formData.image
      };
      
      updateProduct(id, updatedProduct);
      toast.success('Product updated successfully');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to update product');
      console.error(error);
    }
  };

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const product = products.find(p => p.id === id);
      
      if (product) {
        setFormData({
          name: product.name,
          description: '',
          quantity: String(product.quantity),
          unit: product.unit,
          position: product.position || '',
          price: String(product.price),
          image: product.image || ''
        });
        setProduct(product);
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (!product) {
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/products')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Product Not Found</h1>
        </div>
        
        <Card className="p-6 border-none shadow-md rounded-2xl">
          <p>The product you are looking for does not exist.</p>
          <Button 
            onClick={() => navigate('/products')}
            className="mt-4"
          >
            Back to Products
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/products')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
      </div>
      
      <Card className="border-none shadow-md rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{product?.name}</CardTitle>
            <CardDescription>Update product information</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2 md:col-span-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </motion.div>
            </div>
            
            {formData.image && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Label>Image Preview</Label>
                <div className="mt-2 border rounded-xl overflow-hidden aspect-video flex items-center justify-center bg-muted">
                  <img 
                    src={formData.image} 
                    alt={formData.name} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </motion.div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/products')}
              className="rounded-xl"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              className="rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default EditProduct;
