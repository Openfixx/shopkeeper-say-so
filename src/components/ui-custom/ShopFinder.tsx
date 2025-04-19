
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Building, Search, MapPin, Phone, Share, ShoppingCart } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { Shop } from '@/types/inventory';

type ShopFinderProps = {
  onSelectShop?: (shop: Shop) => void;
};

const ShopFinder: React.FC<ShopFinderProps> = ({ onSelectShop }) => {
  const { findNearbyShops, currentShopType } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState([10]);
  const [shopType, setShopType] = useState('');
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const handleSearch = () => {
    const results = findNearbyShops(searchQuery, distance[0], shopType || undefined);
    setSearchResults(results);
    
    if (results.length === 0) {
      toast.info('No shops found matching your criteria');
    } else {
      toast.success(`Found ${results.length} shops nearby`);
    }
  };
  
  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDetail(true);
    
    if (onSelectShop) {
      onSelectShop(shop);
    }
  };
  
  const shopTypes = ['Grocery', 'Electronics', 'Clothing', 'Pharmacy'];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Find Nearby Shops
          </CardTitle>
          <CardDescription>
            Discover shops within 10 km that have the products you need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-search">Product</Label>
            <Input
              id="product-search"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="distance-range">Distance (km)</Label>
              <span className="text-sm text-muted-foreground">{distance[0]} km</span>
            </div>
            <Slider
              id="distance-range"
              min={1}
              max={20}
              step={1}
              value={distance}
              onValueChange={setDistance}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop-type">Shop Type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={shopType === '' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setShopType('')}
              >
                All
              </Button>
              {shopTypes.map((type) => (
                <Button
                  key={type}
                  variant={shopType === type ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setShopType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Find Shops
          </Button>
        </CardFooter>
      </Card>
      
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Shops Near You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((shop) => (
              <Card key={shop.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{shop.name}</CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <MapPin className="h-3 w-3 mr-1" /> {shop.distance} km away
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="h-3.5 w-3.5 mr-1.5" />
                    <span>{shop.type}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    <span>{shop.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button size="sm" className="w-full" onClick={() => handleShopSelect(shop)}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedShop?.name}</SheetTitle>
            <SheetDescription>
              {selectedShop?.distance} km away
            </SheetDescription>
          </SheetHeader>
          
          {selectedShop && (
            <div className="space-y-6 mt-6">
              <div className="space-y-1">
                <label className="text-sm font-medium">Location</label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedShop.location}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Shop Type</label>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedShop.type}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Products</label>
                <div className="text-sm text-muted-foreground">
                  {selectedShop.products && selectedShop.products.length > 0 ? (
                    <ul className="list-disc list-inside">
                      <li>Sugar</li>
                      <li>Rice</li>
                      <li>Salt</li>
                      {/* This would be populated dynamically in a real app */}
                    </ul>
                  ) : (
                    <p>No product information available</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Shop
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Share className="h-4 w-4 mr-2" />
                  Share Location
                </Button>
                
                <Button variant="default" className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ShopFinder;
