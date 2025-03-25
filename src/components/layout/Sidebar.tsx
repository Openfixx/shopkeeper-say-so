import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package2,
  PackageSearch,
  Receipt,
  BarChart3,
  Settings,
  Store,
  Package as PackageIcon,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/ui-custom/LanguageSelector';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const Sidebar = ({ collapsed, onToggle, className }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const { language, setLanguage, t } = useLanguage();
  const shopType = localStorage.getItem('shop_niche') || 'General Store';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const classNames = {
    item: `
      group relative flex w-full items-center rounded-sm py-2 px-3 text-sm font-medium
      transition-colors hover:bg-accent hover:text-accent-foreground
    `,
    active: "bg-accent text-accent-foreground",
    collapsed: "flex h-9 w-9 items-center justify-center p-0",
    label: `
      relative flex items-center rounded-sm py-2 px-3 text-sm font-medium
      transition-colors hover:bg-accent hover:text-accent-foreground
    `,
  };

  const animation = {
    in: {
      opacity: 1,
      x: 0,
    },
    out: {
      opacity: 0,
      x: -100,
    },
    initial: {
      opacity: 0,
      x: -100,
    },
  };

  const links = [
    { icon: LayoutDashboard, label: t('dashboard'), href: '/' },
    { icon: Package2, label: t('products'), href: '/products' },
    { icon: PackageSearch, label: t('inventory'), href: '/inventory' },
    { icon: Receipt, label: t('billing'), href: '/billing' },
    { icon: BarChart3, label: t('reports'), href: '/reports' },
    { icon: Store, label: t('shop_finder'), href: '/shop-finder' },
    { icon: MapPin, label: language === 'hi-IN' ? 'आसपास की दुकानें' : 'Nearby Shops', href: '/nearby-shops' },
    { icon: Settings, label: t('settings'), href: '/settings' }
  ];

  return (
    <div
      className={cn(
        "group flex flex-col justify-between border-r bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="space-y-4 py-4">
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <PackageIcon className="h-6 w-6 text-primary" />
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg overflow-hidden whitespace-nowrap"
              >
                Inventory Pro
              </motion.span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className={cn("hidden md:flex", collapsed && "group-hover:opacity-100 opacity-0")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Shop type badge */}
        {!collapsed ? (
          <div className="mx-4 rounded-md bg-primary/10 p-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium truncate">
              {shopType}
            </span>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-4 w-4 text-primary" />
          </div>
        )}
        
        {/* Navigation links */}
        <div className="space-y-1 px-3">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center py-3"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="truncate overflow-hidden whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {/* Language selector */}
        <div className={cn("flex", collapsed ? "justify-center" : "")}>
          <LanguageSelector 
            currentLanguage={language}
            onLanguageChange={setLanguage}
            variant="ghost"
            size={collapsed ? "icon" : "default"}
          />
        </div>
        
        {/* Logout button */}
        <Button 
          variant="outline" 
          className={cn("w-full", collapsed && "w-auto aspect-square p-2")}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              {t('logout')}
            </motion.span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
