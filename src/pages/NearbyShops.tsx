
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Search,
  ShoppingBag,
  Store,
  Building,
  Package,
  Building2,
  ArrowRightIcon,
  Star,
  Clock,
  Phone,
  LocateFixed,
  Filter
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { ShopTypeChanger, SHOP_TYPES } from '@/components/ui-custom/ShopTypeChanger';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { DbShop } from '@/lib/supabase';

// Mock shop data with locations
const MOCK_SHOPS: (DbShop & { 
  distance: number;
  products: string[];
  rating: number;
  isOpen: boolean;
  phone?: string;
  openTime?: string;
  closeTime?: string;
})[] = [
  {
    id: '1',
    name: 'Sharma Grocery Store',
    type: 'grocery',
    location: 'Sector 12, Noida',
    distance: 0.8,
    products: ['Rice', 'Sugar', 'Flour', 'Oil', 'Salt'],
    rating: 4.5,
    isOpen: true,
    phone: '+91 9876543210',
    openTime: '8:00 AM',
    closeTime: '9:00 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
  {
    id: '2',
    name: 'Patel Electronics',
    type: 'electronics',
    location: 'Sector 18, Noida',
    distance: 1.5,
    products: ['Mobile Phones', 'Laptops', 'Headphones', 'Chargers'],
    rating: 4.2,
    isOpen: true,
    phone: '+91 9876543211',
    openTime: '10:00 AM',
    closeTime: '8:00 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
  {
    id: '3',
    name: 'Aggarwal General Store',
    type: 'general',
    location: 'Sector 15, Noida',
    distance: 2.1,
    products: ['Groceries', 'Stationery', 'Household Items'],
    rating: 3.9,
    isOpen: false,
    phone: '+91 9876543212',
    openTime: '9:00 AM',
    closeTime: '7:00 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
  {
    id: '4',
    name: 'Kumar Pharmacy',
    type: 'pharmacy',
    location: 'Sector 10, Noida',
    distance: 1.2,
    products: ['Medicines', 'Health Supplements', 'Personal Care'],
    rating: 4.8,
    isOpen: true,
    phone: '+91 9876543213',
    openTime: '7:00 AM',
    closeTime: '10:00 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
  {
    id: '5',
    name: 'Fashion Hub',
    type: 'clothing',
    location: 'Sector 16, Noida',
    distance: 3.4,
    products: ['Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear'],
    rating: 4.1,
    isOpen: true,
    phone: '+91 9876543214',
    openTime: '11:00 AM',
    closeTime: '9:00 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
  {
    id: '6',
    name: 'Gupta Kirana Store',
    type: 'grocery',
    location: 'Sector 14, Noida',
    distance: 1.7,
    products: ['Rice', 'Sugar', 'Flour', 'Oil', 'Spices'],
    rating: 4.3,
    isOpen: true,
    phone: '+91 9876543215',
    openTime: '7:30 AM',
    closeTime: '9:30 PM',
    created_at: '',
    updated_at: '',
    user_id: ''
  },
];

const getShopIcon = (type: string) => {
  switch (type) {
    case 'grocery':
      return ShoppingBag;
    case 'electronics':
      return Package;
    case 'clothing':
      return Building;
    case 'pharmacy':
      return Building2;
    default:
      return Store;
  }
};

const NearbyShops: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState(10); // 10 km max distance
  const [isLoading, setIsLoading] = useState(false);
  const [activeShop, setActiveShop] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [shops, setShops] = useState(MOCK_SHOPS);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Location found successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get your location. Using default location.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  }, []);
  
  // Fetch shops data (mock for now, would be real API call)
  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would be an API call with filters
        // For this demo, we'll just filter the mock data
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching shops:', error);
        toast.error('Failed to fetch nearby shops');
        setIsLoading(false);
      }
    };
    
    fetchShops();
  }, [searchTerm, selectedType, maxDistance]);
  
  // Filter shops based on search term, type, and distance
  const filteredShops = shops.filter(shop => {
    // Filter by search term (product or shop name)
    const matchesSearch = searchTerm === '' || 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.products.some(product => product.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by shop type
    const matchesType = selectedType === null || shop.type === selectedType;
    
    // Filter by distance
    const matchesDistance = shop.distance <= maxDistance;
    
    return matchesSearch && matchesType && matchesDistance;
  });
  
  // Handle voice command
  const handleVoiceCommand = (command: string) => {
    if (command.toLowerCase().includes('find') || command.toLowerCase().includes('search')) {
      // Extract search term
      const searchPattern = /(?:find|search|look for)\s+([a-zA-Z0-9 ]+)(?:\s+(?:shop|store|nearby|near me))?/i;
      const match = command.match(searchPattern);
      
      if (match && match[1]) {
        setSearchTerm(match[1].trim());
        toast.success(`Searching for "${match[1].trim()}"`);
      }
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'hi-IN' ? 'आसपास की दुकानें' : 'Nearby Shops'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'hi-IN' 
              ? 'अपने स्थान के पास दुकानें और उत्पाद खोजें'
              : 'Find shops and products near your location'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (navigator.geolocation) {
                setIsLoading(true);
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                    toast.success('Location updated');
                    setIsLoading(false);
                  },
                  (error) => {
                    console.error('Error getting location:', error);
                    toast.error('Failed to get your location');
                    setIsLoading(false);
                  }
                );
              } else {
                toast.error('Geolocation is not supported by your browser');
              }
            }}
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {language === 'hi-IN' ? 'मेरा स्थान' : 'My Location'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {language === 'hi-IN' ? 'फिल्टर' : 'Filters'}
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === 'hi-IN' ? 'उत्पाद या दुकान खोजें...' : 'Search products or shops...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <VoiceCommandButton
            onVoiceCommand={handleVoiceCommand}
            variant="outline"
            size="default"
            label={language === 'hi-IN' ? 'बोलकर खोजें' : 'Search by voice'}
            listenMessage={language === 'hi-IN' ? 'बोलें...' : 'Listening...'}
          />
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-type">{language === 'hi-IN' ? 'दुकान का प्रकार' : 'Shop Type'}</Label>
                <Select 
                  value={selectedType || ''}
                  onValueChange={(value) => setSelectedType(value === '' ? null : value)}
                >
                  <SelectTrigger id="shop-type">
                    <SelectValue placeholder={language === 'hi-IN' ? 'सभी प्रकार' : 'All Types'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {language === 'hi-IN' ? 'सभी प्रकार' : 'All Types'}
                    </SelectItem>
                    {SHOP_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="distance">
                    {language === 'hi-IN' ? 'अधिकतम दूरी' : 'Maximum Distance'}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {maxDistance} km
                  </span>
                </div>
                <Slider
                  id="distance"
                  min={1}
                  max={10}
                  step={0.5}
                  value={[maxDistance]}
                  onValueChange={(vals) => setMaxDistance(vals[0])}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedType(null);
                  setMaxDistance(10);
                  setSearchTerm('');
                }}
              >
                {language === 'hi-IN' ? 'रीसेट' : 'Reset'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Shop Listing */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(null).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  {Array(3).fill(null).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-16 rounded-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : filteredShops.length > 0 ? (
          filteredShops.map(shop => {
            const ShopIcon = getShopIcon(shop.type);
            const isActive = activeShop === shop.id;
            
            return (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className={`overflow-hidden transition-all duration-200 ${isActive ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setActiveShop(isActive ? null : shop.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {shop.name}
                          {shop.isOpen ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                              {language === 'hi-IN' ? 'खुला है' : 'Open'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                              {language === 'hi-IN' ? 'बंद है' : 'Closed'}
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{shop.location}</span>
                          <span className="text-xs">• {shop.distance} km</span>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShopIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Products */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {language === 'hi-IN' ? 'उपलब्ध उत्पाद' : 'Available Products'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {shop.products.slice(0, 3).map((product, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            {product}
                          </span>
                        ))}
                        {shop.products.length > 3 && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            +{shop.products.length - 3} {language === 'hi-IN' ? 'अधिक' : 'more'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array(5).fill(null).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(shop.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{shop.rating}</span>
                    </div>
                    
                    {/* Additional info when active */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 mt-2 pt-2 border-t"
                      >
                        {shop.openTime && shop.closeTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {language === 'hi-IN' ? 'समय' : 'Hours'}: {shop.openTime} - {shop.closeTime}
                            </span>
                          </div>
                        )}
                        
                        {shop.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{shop.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            {language === 'hi-IN' ? 'दिशानिर्देश' : 'Directions'}
                          </Button>
                          <Button size="sm" className="flex-1">
                            {language === 'hi-IN' ? 'दुकान देखें' : 'View Shop'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to shop details
                        toast.success(`Viewing ${shop.name}`);
                      }}
                    >
                      {language === 'hi-IN' ? 'उत्पाद देखें' : 'View Products'}
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">
              {language === 'hi-IN' ? 'कोई दुकान नहीं मिली' : 'No shops found'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {language === 'hi-IN'
                ? 'आपके खोज मापदंडों से मेल खाने वाली कोई दुकान नहीं मिली। कृपया अपने फिल्टर समायोजित करें या अलग खोज शब्द आज़माएं।'
                : 'No shops match your search criteria. Try adjusting your filters or try a different search term.'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedType(null);
                setMaxDistance(10);
              }}
            >
              {language === 'hi-IN' ? 'सभी दुकानें दिखाएं' : 'Show All Shops'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyShops;
