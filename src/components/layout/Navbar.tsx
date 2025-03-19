
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Moon, 
  Sun 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Simple navigation commands
    if (lowerCommand.includes('go to') || lowerCommand.includes('open')) {
      if (lowerCommand.includes('dashboard') || lowerCommand.includes('home')) {
        navigate('/');
      } else if (lowerCommand.includes('product')) {
        navigate('/products');
      } else if (lowerCommand.includes('inventory')) {
        navigate('/inventory');
      } else if (lowerCommand.includes('billing') || lowerCommand.includes('bill')) {
        navigate('/billing');
      } else if (lowerCommand.includes('settings')) {
        navigate('/settings');
      }
    } 
    // Billing commands
    else if (lowerCommand.includes('prepare a bill') || lowerCommand.includes('start bill')) {
      navigate('/billing');
      // Additional logic to start a bill would be handled in the Billing component
    }
    // Search commands
    else if (lowerCommand.includes('find') || lowerCommand.includes('where is')) {
      const productName = lowerCommand.replace(/find|where is/gi, '').trim();
      navigate(`/inventory?search=${encodeURIComponent(productName)}`);
    }
    // Add product command - complex, would need to be handled by a dedicated modal/form
    else if (lowerCommand.includes('add')) {
      navigate('/products/add');
    }
    // Toggle theme
    else if (lowerCommand.includes('dark mode') || lowerCommand.includes('light mode')) {
      onToggleTheme();
    }
    // Fallback for unrecognized commands
    else {
      toast.info(`Command not recognized: "${command}"`);
    }
  };
  
  return (
    <div className={cn("sticky top-0 z-40 w-full", className)}>
      <header className="bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="md:hidden mr-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="py-6 px-4">
                  <h2 className="text-lg font-medium">Inventory App</h2>
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
              <h1 className="text-gradient font-display">Inventory Pro</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <VoiceCommandButton 
              onVoiceCommand={handleVoiceCommand}
              className="hidden sm:flex" 
            />
            
            <Button variant="ghost" size="icon" onClick={onToggleTheme}>
              {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="hidden md:block">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  {user?.name || 'Guest'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
