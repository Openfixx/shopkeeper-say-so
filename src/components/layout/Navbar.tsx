
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ui/theme-provider';
import { 
  Bell, 
  Menu, 
  Moon, 
  Search, 
  Settings, 
  Sun, 
  User,
  X,
  Package2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Reports', path: '/reports' },
  { label: 'Billing', path: '/billing' },
];

interface NavbarProps {
  className?: string;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  className,
  onToggleTheme,
  isDarkTheme,
}) => {
  const { setTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-lg border-b border-border",
        className
      )}
    >
      <div className="container flex items-center justify-between h-full px-4">
        {/* Mobile Menu */}
        <div className="flex md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <div className="p-6">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl">
                    IP
                  </div>
                  <div className="font-bold text-xl tracking-tight">
                    <span className="text-foreground">Inventory</span>
                    <span className="text-primary">Pro</span>
                  </div>
                </Link>
              </div>
              
              <div className="px-2">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
                
                <div className="border-t border-border my-4"></div>
                
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Logo (mobile only) */}
        <Link to="/" className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
            IP
          </div>
        </Link>
        
        {/* Search */}
        <div className="hidden md:flex relative w-full max-w-md mx-4">
          <div className={cn(
            "flex items-center w-full transition-all duration-300 relative",
            isSearchOpen ? "w-full" : "w-56"
          )}>
            <div className="relative flex-1">
              <Search 
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                  isSearchOpen ? "opacity-100" : "opacity-70"
                )} 
                size={16}
              />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  "h-9 w-full rounded-xl pl-10 pr-4 bg-muted/60 border-none text-sm transition-all focus:ring-1 focus:ring-primary",
                  isSearchOpen ? "bg-background border-muted" : "bg-muted/60"
                )}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
            <div className={cn(
              "flex gap-1 ml-2 text-xs font-medium text-muted-foreground transition-all duration-300",
              isSearchOpen ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}>
              <kbd className="rounded bg-muted px-2 py-0.5">⌘</kbd>
              <kbd className="rounded bg-muted px-2 py-0.5">K</kbd>
            </div>
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme(isDarkTheme ? "light" : "dark");
              onToggleTheme && onToggleTheme();
            }}
            className="rounded-full"
          >
            {isDarkTheme ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </Button>
          
          {/* Mobile Search */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden rounded-full"
          >
            <Search size={18} />
          </Button>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full relative"
              >
                <Bell size={18} />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-normal">
                  Mark all as read
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="max-h-[300px] overflow-y-auto">
                {[1, 2].map((notif) => (
                  <DropdownMenuItem key={notif} className="cursor-pointer flex items-start p-3 gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Package2 size={14} className="text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">New product added</p>
                      <p className="text-xs text-muted-foreground">Sugar stock has been updated</p>
                      <p className="text-xs text-muted-foreground/70">2 minutes ago</p>
                    </div>
                    <Badge className="shrink-0 mt-1" variant="outline">New</Badge>
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              <Button variant="ghost" className="w-full justify-center text-sm" size="sm">
                View all notifications
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 overflow-hidden"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
