
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Package2, 
  Receipt, 
  Settings, 
  Home,
  PlusCircle,
  Moon,
  Sun,
  Globe,
  Mic
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const { user } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return null;
  }

  const handleClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <aside className="h-full flex flex-col bg-card border-r">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-6">{t('inventory')}</h2>
        
        <nav className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <Home className="h-4 w-4 mr-3" />
            {t('dashboard')}
          </NavLink>
          
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <Package2 className="h-4 w-4 mr-3" />
            {t('products')}
          </NavLink>
          
          <NavLink
            to="/products/add"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <PlusCircle className="h-4 w-4 mr-3" />
            {t('addProduct')}
          </NavLink>
          
          <NavLink
            to="/billing"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <Receipt className="h-4 w-4 mr-3" />
            {t('billing')}
          </NavLink>

          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <Mic className="h-4 w-4 mr-3" />
            Voice Features
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
            onClick={handleClick}
          >
            <Settings className="h-4 w-4 mr-3" />
            {t('settings')}
          </NavLink>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={toggleLanguage}>
          <Globe className="h-4 w-4" />
          <span className="ml-2">{language === 'en' ? 'हिन्दी' : 'English'}</span>
        </Button>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
