
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ui/theme-provider';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Don't show layout for auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <>{children || <Outlet />}</>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        className="md:ml-64" 
        onToggleTheme={toggleTheme} 
        isDarkTheme={theme === 'dark'} 
      />
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 border-r">
        <Sidebar className="flex flex-col h-full" />
      </div>
      
      <main className={cn(
        "pt-16 transition-all duration-200 ease-in-out min-h-screen md:ml-64",
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="container px-4 py-6 mx-auto"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
