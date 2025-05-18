
import React from 'react';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className 
}) => {
  return (
    <img 
      src={src || '/placeholder.svg'} 
      alt={alt} 
      className={cn('object-contain', className)}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder.svg';
      }}
    />
  );
};

export default ProductImage;
