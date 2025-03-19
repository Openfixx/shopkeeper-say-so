
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
import BillingDialog from '@/components/ui-custom/BillingDialog';
import { toast } from 'sonner';
import { detectCommandType, VOICE_COMMAND_TYPES } from '@/utils/voiceCommandUtils';

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
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  
  const handleVoiceCommand = (command: string) => {
    const recognizedCommand = detectCommandType(command);
    
    switch (recognizedCommand.type) {
      case VOICE_COMMAND_TYPES.ADD_PRODUCT:
        navigate('/products/add');
        break;
      case VOICE_COMMAND_TYPES.CREATE_BILL:
        setIsBillingDialogOpen(true);
        break;
      case VOICE_COMMAND_TYPES.SEARCH_PRODUCT:
        if (recognizedCommand.data?.searchTerm) {
          navigate(`/inventory?search=${encodeURIComponent(recognizedCommand.data.searchTerm)}`);
        } else {
          toast.warning('Please specify what to search for');
        }
        break;
      default:
        // Basic navigation commands
        const lowerCommand = command.toLowerCase();
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
          } else {
            toast.info(`Command not recognized: "${command}"`);
          }
        } else if (lowerCommand.includes('dark mode') || lowerCommand.includes('light mode')) {
          onToggleTheme();
        } else {
          toast.info(`Command not recognized: "${command}"`);
        }
        break;
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
              variant="ghost"
              label="Voice"
              listenMessage="Listening for command... Try 'Add product', 'Create bill', or 'Find [product]'"
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
      
      <BillingDialog
        open={isBillingDialogOpen}
        onOpenChange={setIsBillingDialogOpen}
      />
    </div>
  );
};

export default Navbar;
