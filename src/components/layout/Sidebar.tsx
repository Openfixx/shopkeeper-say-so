
import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Package2, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  MapPin,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Package2, label: 'Products', path: '/products' },
  { icon: ShoppingCart, label: 'Inventory', path: '/inventory' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: ShoppingCart, label: 'Billing', path: '/billing' },
  { icon: MapPin, label: 'Shop Finder', path: '/shop-finder' },
  // Voice Features item removed
];

interface SidebarProps {
  className?: string;
  open?: boolean; // Add open prop to interface
}

const Sidebar: React.FC<SidebarProps> = ({ className, open }) => {
  const location = useLocation();
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div 
      className={cn(
        "py-4 flex flex-col h-full bg-sidebar-background border-r border-sidebar-border",
        open === false ? "hidden md:flex" : "flex", // Handle open state
        className
      )}
    >
      <div className="px-4 py-2 mb-6">
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
      
      <div className="px-3 mb-6">
        <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
          Menu
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
              
            return (
              <Link 
                key={item.label} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-tab"
                    className="ml-auto"
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="px-3 mb-6">
        <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
          Admin
        </div>
        <Link 
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
            location.pathname === '/settings'
              ? "bg-primary text-primary-foreground" 
              : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          <Settings size={18} />
          <span>Settings</span>
          {location.pathname === '/settings' && (
            <motion.div
              layoutId="sidebar-active-tab"
              className="ml-auto"
              transition={{ type: "spring", duration: 0.6 }}
            >
              <ChevronRight size={16} />
            </motion.div>
          )}
        </Link>
      </div>
      
      <div className="mt-auto px-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
      
      <div className="mt-6 px-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Package2 size={14} className="text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold">Need help?</div>
              <div className="text-xs text-muted-foreground">Support center</div>
            </div>
          </div>
          <Link 
            to="/settings" 
            className="text-xs text-primary font-medium flex justify-center items-center w-full py-1.5 bg-background/70 rounded-lg hover:bg-background transition-colors"
          >
            Go to support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
