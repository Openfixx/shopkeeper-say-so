
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { convertProduct } from '@/utils/productUtils';
import { Mic, Search, Menu } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout, shopName } = useAuth();
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
    <header className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-md px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        {toggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-white hover:bg-white/10" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link to="/" className="flex flex-col">
          <span className="text-xl font-bold text-white">
            {shopName || "Apni Dukaan"}
          </span>
          <span className="text-xs text-white/80">
            {user?.name ? `${user.name} ki Apni Dukaan` : "Apni Dukaan"}
          </span>
        </Link>
      </div>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative flex w-full">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-l-md border-0 bg-white/10 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/30 focus:border-0"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="rounded-none bg-white/10 border-0 text-white hover:bg-white/20"
            disabled={isVoiceListening}
            onClick={startVoiceSearch}
          >
            <Mic className="h-4 w-4" />
            <span className="sr-only">Search with voice</span>
          </Button>
          <Button type="submit" className="rounded-r-md rounded-l-none bg-white/20 hover:bg-white/30 text-white border-0">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>
      
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-sm text-white hidden md:inline-block">
              {user.name}
            </span>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 border border-white/20" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 border border-white/20">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
