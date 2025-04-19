
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/context/InventoryContext';
import ShopTypeChanger from '@/components/ui-custom/ShopTypeChanger';
import { Shop } from '@/types/inventory';

const NearbyShops: React.FC = () => {
  const { findNearbyShops } = useInventory();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopType, setShopType] = useState<string>('');
  
  // Function to handle shop type change
  const handleShopTypeChange = (type: string) => {
    setShopType(type);
    // Refresh shops with new type
    const nearbyShops = findNearbyShops('', 10, type);
    setShops(nearbyShops);
  };
  
  // Initialize shops on component mount
  React.useEffect(() => {
    const initialShops = findNearbyShops('', 10, '');
    setShops(initialShops);
  }, [findNearbyShops]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nearby Shops</h2>
          <p className="text-muted-foreground">
            Discover shops in your area
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ShopTypeChanger onTypeChange={handleShopTypeChange} />
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Shops Near You</h3>
              
              {shops.length > 0 ? (
                <div className="space-y-4">
                  {shops.map(shop => (
                    <Card key={shop.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{shop.name}</h4>
                            <p className="text-sm text-muted-foreground">{shop.type}</p>
                            <p className="text-sm mt-1">{shop.location}</p>
                          </div>
                          <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                            {shop.distance} km away
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No shops found nearby</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NearbyShops;
