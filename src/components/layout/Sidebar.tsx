
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import {
  LayoutDashboard,
  PackageSearch,
  Package,
  BarChart3,
  Receipt,
  Settings,
  Store,
  Navigation,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const isMobile = useMobile();
  
  const links = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Inventory',
      href: '/inventory',
      icon: <PackageSearch className="h-5 w-5" />,
    },
    {
      title: 'Products',
      href: '/products',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: 'Billing',
      href: '/billing',
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      title: 'Shop Finder',
      href: '/shop-finder',
      icon: <Navigation className="h-5 w-5" />,
    },
    {
      title: 'Nearby Shops',
      href: '/nearby-shops',
      icon: <Store className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className={cn('pb-12 h-full', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 px-4"
          >
            <h2 className="text-xl font-semibold tracking-tight text-gradient">
              InventoryPro
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your stock effortlessly
            </p>
          </motion.div>
          
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-1">
              {links.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Button
                    variant={location.pathname === link.href ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 font-medium rounded-xl text-base',
                      location.pathname === link.href
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : ''
                    )}
                    asChild
                  >
                    <Link to={link.href}>
                      {link.icon}
                      {link.title}
                    </Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
