
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { convertProduct } from '@/utils/productUtils';
import type { Product } from '@/types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // This is a placeholder function for adding products that uses the correct type conversion
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    // Convert the product data using the utility function to ensure proper type handling
    const convertedProduct = convertProduct({
      ...productData,
      id: '',
      created_at: '',
      user_id: user?.id || ''
    });
    
    // Here you would normally make an API call or dispatch an action
    console.log('Adding product:', convertedProduct);
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">Inventory Pro</Link>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Welcome, {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="default" size="sm">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
