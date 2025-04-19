
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { convertProduct } from '@/utils/productUtils';
import type { Product } from '@/types';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
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
      <div className="flex items-center">
        {toggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden" 
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </Button>
        )}
        <Link to="/" className="text-xl font-bold text-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Inventory Pro</Link>
      </div>
      
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
