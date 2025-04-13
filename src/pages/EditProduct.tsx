
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useInventory();
  
  // Find the product by ID
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return (
      <div className="space-y-4">
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
        
        <Card className="p-6">
          <p>The product you are looking for does not exist.</p>
          <Button 
            onClick={() => navigate('/products')}
            className="mt-4"
          >
            Back to Products
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
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
        <h1 className="text-2xl font-bold">Edit Product: {product.name}</h1>
      </div>
      
      <Card className="p-6">
        <p className="mb-4">Edit product functionality will be implemented here.</p>
        <Button 
          onClick={() => {
            toast.success('This is a placeholder for the edit functionality');
            navigate('/products');
          }}
        >
          Save Changes
        </Button>
      </Card>
    </div>
  );
};

export default EditProduct;
