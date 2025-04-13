
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Moon, 
  Sun,
  Search,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavbarProps {
  className?: string;
  onToggleTheme: () => void;
  isDarkTheme: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  className, 
  onToggleTheme,
  isDarkTheme
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("sticky top-0 z-40 w-full", className)}
    >
      <header className="bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="md:hidden mr-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 rounded-r-2xl border-none">
                <div className="py-6 px-4">
                  <h2 className="text-lg font-medium text-gradient">Inventory Pro</h2>
                </div>
                <nav className="flex flex-col space-y-1">
                  <Button variant="ghost" className="justify-start px-4 py-6" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>Dashboard</Button>
                  <Button variant="ghost" className="justify-start px-4 py-6" onClick={() => { navigate('/products'); setIsMobileMenuOpen(false); }}>Products</Button>
                  <Button variant="ghost" className="justify-start px-4 py-6" onClick={() => { navigate('/inventory'); setIsMobileMenuOpen(false); }}>Inventory</Button>
                  <Button variant="ghost" className="justify-start px-4 py-6" onClick={() => { navigate('/billing'); setIsMobileMenuOpen(false); }}>Billing</Button>
                  <Button variant="ghost" className="justify-start px-4 py-6" onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}>Settings</Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex-1">
            <div className="ml-14 md:ml-0 font-semibold text-lg">
              <h1 className="text-gradient font-medium">Inventory Pro</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-full bg-muted/50 border-none focus:outline-none focus:ring-2 focus:ring-primary/30 w-[200px]"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleTheme}>
              {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p>{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'guest@example.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </motion.div>
  );
};

export default Navbar;
