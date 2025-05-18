
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/inventory';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="pt-[56.25%] relative bg-muted">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover p-2"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          <Badge variant="outline" className="ml-2 whitespace-nowrap">
            {product.category || t('uncategorized')}
          </Badge>
        </div>
        
        <div className="mt-2 space-y-1">
          <p className="text-2xl font-semibold text-primary">
            {formatCurrency(product.price)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('quantity')}: {product.quantity} {product.unit}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          variant="ghost" 
          className="w-full justify-between"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          {t('viewDetails')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
