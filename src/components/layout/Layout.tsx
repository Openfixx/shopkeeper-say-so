
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);
  
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };
  
  // Don't show layout for auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        className="md:ml-16" 
        onToggleTheme={toggleTheme} 
        isDarkTheme={isDarkTheme} 
      />
      <Sidebar className="hidden md:flex" />
      
      <main className={cn(
        "pt-16 transition-all duration-200 ease-in-out min-h-screen md:ml-16",
      )}>
        <div className="container px-4 py-6 mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
