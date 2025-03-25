
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
  Mic,
  FileText
} from 'lucide-react';

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
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Inventory',
      href: '/inventory',
      icon: <PackageSearch className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Products',
      href: '/products',
      icon: <Package className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Billing',
      href: '/billing',
      icon: <Receipt className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Shop Finder',
      href: '/shop-finder',
      icon: <Navigation className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Nearby Shops',
      href: '/nearby-shops',
      icon: <Store className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Voice & NLP',
      href: '/voice',
      icon: <Mic className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  return (
    <div className={cn('pb-12 h-full', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-1">
              {links.map((link) => (
                <Button
                  key={link.href}
                  variant={location.pathname === link.href ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
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
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
