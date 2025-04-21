import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AppLogo from '../ui-custom/AppLogo';
import { useLocation } from 'react-router-dom';
import { useMobile } from '@/hooks/useMobile';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'AD'; // Default to "Apni Dukaan" initials
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    // Try to get name from user object (might be null)
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    return userName;
  };

  // In auth pages, we show a simplified header
  if (isAuthPage) {
    return (
      <header className="bg-transparent border-b border-transparent py-3 px-4">
        <div className="container mx-auto flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <AppLogo size={32} />
            <span className="text-xl font-bold text-primary">Apni Dukaan</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden" 
              onClick={onMenuToggle}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            
            <Link to="/" className="flex items-center space-x-2">
              <AppLogo size={32} />
              <span className="text-xl font-bold text-primary hidden md:inline-block">
                Apni Dukaan
              </span>
            </Link>
          </div>
          
          <div className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isMobile && !isAuthenticated ? "hidden" : "flex justify-center mx-4"
          )}>
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products, categories..."
                  className="w-full bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {isAuthenticated ? (
                <>
                  <div className="mr-2 text-sm text-right hidden md:block">
                    <p className="font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={getUserDisplayName()} />
                      <AvatarFallback>{getInitials(getUserDisplayName())}</AvatarFallback>
                    </Avatar>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogout} 
                      className="hidden md:flex"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <Button asChild variant="default" className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Link to="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
