
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Menu, 
  Moon, 
  Sun,
  Mic,
  MicOff, 
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { updateProductDetails } from '@/utils/voiceCommandUtils';
import { useInventory } from '@/context/InventoryContext';
import { fetchProductImage } from '@/utils/fetchImage';
import AppLogo from '@/components/ui-custom/AppLogo';

// Define command types and detection function
const VOICE_COMMAND_TYPES = {
  ADD_PRODUCT: 'add_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  CREATE_BILL: 'create_bill',
  SEARCH_PRODUCT: 'search_product',
  FIND_SHOPS: 'find_shops',
  UNKNOWN: 'unknown'
};

const detectCommandType = (text: string) => {
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes('create bill') ||
    lowerText.includes('new bill') ||
    lowerText.includes('make bill')
  ) {
    return { type: VOICE_COMMAND_TYPES.CREATE_BILL };
  }
  
  if (
    lowerText.includes('add ') && 
    !lowerText.includes('bill')
  ) {
    return { type: VOICE_COMMAND_TYPES.ADD_PRODUCT };
  }
  
  if (
    lowerText.includes('search') || 
    lowerText.includes('find ')
  ) {
    let searchTerm = null;
    const searchMatches = lowerText.match(/(?:search|find|look for)\s+(?:for\s+)?(.+?)(?:\s+in|\s+on|\s+at|$)/i);
    
    if (searchMatches && searchMatches[1]) {
      searchTerm = searchMatches[1].trim();
    }
    
    if (lowerText.includes('shop') || lowerText.includes('store')) {
      return {
        type: VOICE_COMMAND_TYPES.FIND_SHOPS,
        data: { searchTerm }
      };
    }
    
    return {
      type: VOICE_COMMAND_TYPES.SEARCH_PRODUCT,
      data: { searchTerm }
    };
  }
  
  return { type: VOICE_COMMAND_TYPES.UNKNOWN };
};

// Extract product details from voice command
const extractProductDetails = async (command: string) => {
  // Simple extraction logic
  const productMatch = command.match(/add\s+(.+?)(?=\s+to|\s+at|\s+in|\s+on|\s+price|\s+₹|$)/i);
  const quantityMatch = command.match(/(\d+)\s*(kg|g|ml|l|pieces?|pcs)/i);
  const positionMatch = command.match(/(rack|shelf)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  const priceMatch = command.match(/(?:price|cost|₹|Rs|rupees)\s*(\d+)/i);
  
  // Convert words to numbers if needed
  const numberWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  
  let position;
  if (positionMatch) {
    if (positionMatch[2] in numberWords) {
      position = numberWords[positionMatch[2]].toString();
    } else {
      position = positionMatch[2];
    }
  }
  
  return {
    name: productMatch ? productMatch[1].trim() : '',
    quantity: quantityMatch ? parseFloat(quantityMatch[1]) : 1,
    unit: quantityMatch ? quantityMatch[2].toLowerCase() : 'kg',
    position: position || '',
    price: priceMatch ? parseFloat(priceMatch[1]) : 0,
  };
};

// Product image search function
const searchProductImage = async (productName: string) => {
  try {
    return await fetchProductImage(productName);
  } catch (error) {
    console.error("Error searching for product image:", error);
    return `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
  }
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { setTheme, theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addProduct } = useInventory();
  
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingCommand, setProcessingCommand] = useState(false);
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const initializeRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = language === 'hi-IN' ? 'hi-IN' : 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            processCommand(finalTranscript);
          } else if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Speech recognition error: ' + event.error);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
        return recognitionInstance;
      }
    }
    return null;
  };
  
  const toggleListening = () => {
    if (isListening) {
      if (recognition) {
        recognition.stop();
      }
      setIsListening(false);
      return;
    }
    
    try {
      const recognitionInstance = recognition || initializeRecognition();
      
      if (recognitionInstance) {
        recognitionInstance.start();
        setIsListening(true);
        setIsDialogOpen(true);
        toast.info('Listening for commands...');
      } else {
        toast.error('Speech recognition is not supported in your browser');
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start speech recognition');
    }
  };
  
  const processCommand = async (command: string) => {
    setProcessingCommand(true);
    
    try {
      const commandInfo = detectCommandType(command);
      console.log("Command type detected:", commandInfo.type);
      
      switch (commandInfo.type) {
        case VOICE_COMMAND_TYPES.ADD_PRODUCT:
          const productDetails = await extractProductDetails(command);
          if (productDetails.name) {
            if (!productDetails.image) {
              try {
                const imageUrl = await searchProductImage(productDetails.name);
                if (imageUrl) {
                  productDetails.image = imageUrl;
                }
              } catch (error) {
                console.error('Error getting product image:', error);
              }
            }
            
            addProduct({
              name: productDetails.name,
              quantity: productDetails.quantity || 1,
              unit: productDetails.unit || 'kg',
              position: productDetails.position || '',
              price: productDetails.price || 0,
              image: productDetails.image || ''
            });
            
            toast.success(`Added ${productDetails.name} to inventory`);
          } else {
            navigate('/products/add');
          }
          break;
          
        case VOICE_COMMAND_TYPES.CREATE_BILL:
          navigate('/billing');
          toast.success('Opening billing page');
          break;
          
        case VOICE_COMMAND_TYPES.SEARCH_PRODUCT:
          if (commandInfo.data?.searchTerm) {
            navigate('/products');
            toast.info(`Searching for "${commandInfo.data.searchTerm}"`);
          }
          break;
          
        case VOICE_COMMAND_TYPES.FIND_SHOPS:
          navigate('/shop-finder');
          toast.success('Opening shop finder');
          break;
          
        default:
          const pages = [
            { keywords: ['home', 'dashboard', 'main'], path: '/' },
            { keywords: ['product', 'inventory'], path: '/products' },
            { keywords: ['bill', 'invoice', 'billing'], path: '/billing' },
            { keywords: ['report', 'reports', 'sales'], path: '/reports' },
            { keywords: ['setting', 'settings', 'configuration'], path: '/settings' },
            { keywords: ['shop', 'finder', 'store'], path: '/shop-finder' }
          ];
          
          const lowerCommand = command.toLowerCase();
          for (const page of pages) {
            if (page.keywords.some(keyword => lowerCommand.includes(keyword))) {
              navigate(page.path);
              toast.success(`Navigating to ${page.path}`);
              return;
            }
          }
          
          toast.info(`Command not recognized: "${command}"`);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      toast.error('Failed to process command');
    } finally {
      setProcessingCommand(false);
    }
  };
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <AppLogo size={32} />
            <h1 className="text-xl font-semibold">समान Salman</h1>
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleListening}
            className={isListening ? "bg-red-500 text-white hover:bg-red-600" : ""}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col p-4 space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-gray-500">You don't have any notifications yet.</p>
              </div>
            </SheetContent>
          </Sheet>
          
          <Avatar>
            <AvatarImage src={user?.image || ''} />
            <AvatarFallback>{user?.email?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Voice Command
            </DialogTitle>
            <DialogDescription>
              {isListening ? "Listening..." : processingCommand ? "Processing..." : "Command received"}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium mb-1">Transcript:</p>
            <p>{transcript}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Header;
