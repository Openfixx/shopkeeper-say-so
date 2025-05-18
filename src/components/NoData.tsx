
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NoDataProps {
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

const NoData: React.FC<NoDataProps> = ({ 
  title, 
  message, 
  action,
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8 text-muted-foreground" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {message && <p className="text-muted-foreground text-center max-w-sm mb-4">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default NoData;
