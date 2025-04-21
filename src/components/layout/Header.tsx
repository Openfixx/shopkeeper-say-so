
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { convertProduct } from '@/utils/productUtils';
import { Mic, Search } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { products } = useInventory();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Filter products by search term
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredProducts.length > 0) {
      navigate('/products', { state: { searchQuery: searchTerm } });
    } else {
      toast.info(`No products found matching "${searchTerm}"`);
    }
  };

  const startVoiceSearch = () => {
    setIsVoiceListening(true);
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in this browser");
      setIsVoiceListening(false);
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      
      // Auto search when voice input completes
      const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(transcript.toLowerCase())
      );
      
      navigate('/products', { state: { searchQuery: transcript } });
      toast.success(`Searching for: "${transcript}"`);
    };
    
    recognition.onend = () => {
      setIsVoiceListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsVoiceListening(false);
      toast.error("Failed to recognize speech");
    };
    
    recognition.start();
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        {toggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden" 
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </Button>
        )}
        <Link to="/" className="text-xl font-bold text-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Inventory Pro</Link>
      </div>
      
      <form onSubmit={handleSearch} className="max-w-md w-full px-4 hidden md:flex">
        <div className="relative flex w-full">
          <input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-l-md border border-r-0 border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="rounded-none border-y border-input"
            disabled={isVoiceListening}
            onClick={startVoiceSearch}
          >
            <Mic className="h-4 w-4" />
            <span className="sr-only">Search with voice</span>
          </Button>
          <Button type="submit" className="rounded-r-md rounded-l-none">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Welcome, {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="default" size="sm">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
