import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Settings, 
  Mic, 
  Menu, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const routes = [
    {
      path: '/',
      name: 'Dashboard',
      icon: Home,
    },
    {
      path: '/products',
      name: 'Products',
      icon: Package,
    },
    {
      path: '/billing',
      name: 'Billing',
      icon: ShoppingCart,
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
    },
    {
      path: '/voice',
      name: 'Voice',
      icon: Mic,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <ScrollArea className="h-screen">
            <div className="py-4 text-center">
              <h1 className="font-bold text-2xl">Inventory App</h1>
              <p className="text-sm text-muted-foreground">
                {user?.email || 'Guest'}
              </p>
            </div>
            <div className="py-4">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-secondary',
                    location.pathname === route.path
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <route.icon className="h-4 w-4" />
                  <span>{route.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-auto py-4 px-4">
              <Button variant="outline" className="w-full mb-2" onClick={toggleTheme}>
                {theme === 'light' ? 'Dark' : 'Light'} Mode
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <div
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800',
          open ? 'md:block' : 'md:hidden'
        )}
      >
        <ScrollArea className="h-screen">
          <div className="py-4 text-center">
            <h1 className="font-bold text-2xl">Inventory App</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email || 'Guest'}
            </p>
          </div>
          <div className="py-4">
            {routes.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-secondary',
                  location.pathname === route.path
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <route.icon className="h-4 w-4" />
                <span>{route.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-auto py-4 px-4">
            <Button variant="outline" className="w-full mb-2" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;
