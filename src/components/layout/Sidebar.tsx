import React, { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Settings2,
  SquareStack,
  Package,
  ShoppingBasket,
  BarChart,
  Receipt,
  Tag as TagIcon,
  LogOut,
  UploadCloud,
} from "lucide-react"
import { NavItem } from "@/components/layout/NavItem"
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigateTabs } from '@/hooks/useNavigateTabs';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const { userTabs, setUserTabs, allTabs } = useNavigateTabs();

  useEffect(() => {
    if (!user) {
      setUserTabs([]);
    } else if (user && userTabs.length === 0) {
      setUserTabs(allTabs);
    }
  }, [user, setUserTabs, userTabs.length, allTabs]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 border-r">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center justify-between">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t('inventoryPro')}
              </span>
              <Badge variant="outline">{t('beta')}</Badge>
            </SheetTitle>
            <SheetDescription>
              {t('manageInventory')}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <nav className="p-6 space-y-6 text-sm">
              <div className="space-y-1">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('main')}
                </h3>
                <ul className="space-y-1">
                  <NavItem
                    icon={<SquareStack className="h-4 w-4 mr-3" />}
                    href="/"
                    text={t('dashboard')}
                    isActive={pathname === '/'}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<Package className="h-4 w-4 mr-3" />}
                    href="/products"
                    text={t('products')}
                    isActive={pathname.startsWith('/products')}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<ShoppingBasket className="h-4 w-4 mr-3" />}
                    href="/inventory"
                    text={t('inventory')}
                    isActive={pathname === '/inventory'}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<UploadCloud className="h-4 w-4 mr-3" />}
                    href="/bulk-inventory"
                    text="Bulk Inventory"
                    isActive={pathname === '/bulk-inventory'}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<BarChart className="h-4 w-4 mr-3" />}
                    href="/reports"
                    text={t('reports')}
                    isActive={pathname === '/reports'}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<Receipt className="h-4 w-4 mr-3" />}
                    href="/billing"
                    text={t('billing')}
                    isActive={pathname === '/billing'}
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    icon={<TagIcon className="h-4 w-4 mr-3" />}
                    href="/pos"
                    text="POS"
                    isActive={pathname === '/pos'}
                    onClick={() => setOpen(false)}
                  />
                </ul>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('settings')}
                </h3>
                <ul className="space-y-1">
                  <NavItem
                    icon={<Settings2 className="h-4 w-4 mr-3" />}
                    href="/settings"
                    text={t('settings')}
                    isActive={pathname === '/settings'}
                    onClick={() => setOpen(false)}
                  />
                </ul>
              </div>

              {userTabs.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('yourTabs')}
                  </h3>
                  <ul className="space-y-1">
                    {userTabs.map((tab) => (
                      <NavItem
                        key={tab.href}
                        icon={tab.icon}
                        href={tab.href}
                        text={tab.text}
                        isActive={pathname === tab.href}
                        onClick={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {user && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('account')}
                  </h3>
                  <ul className="space-y-1">
                    <li>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          {t('logout')}
                        </Button>
                      </SheetClose>
                    </li>
                  </ul>
                </div>
              )}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  href: string;
  text: string;
  isActive: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, href, text, isActive, onClick }) => {
  return (
    <li>
      <SheetClose asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}
          onClick={onClick}
          asChild
        >
          <a href={href} className="flex items-center w-full">
            {icon}
            {text}
          </a>
        </Button>
      </SheetClose>
    </li>
  );
};

export default Sidebar;
