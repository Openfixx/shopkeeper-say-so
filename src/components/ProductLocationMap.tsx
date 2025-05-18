
import React from 'react';
import { cn } from '@/lib/utils';

interface ProductLocationMapProps {
  position?: string;
  className?: string;
}

const ProductLocationMap: React.FC<ProductLocationMapProps> = ({ 
  position,
  className 
}) => {
  // Simple placeholder component for product location visualization
  return (
    <div className={cn("h-20 bg-secondary/20 rounded-md relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {position || 'Location not specified'}
        </p>
      </div>
      {position && (
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default ProductLocationMap;
