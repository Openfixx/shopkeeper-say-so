
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopFinderComponent from '@/components/ui-custom/ShopFinder';
import { useInventory } from '@/context/InventoryContext';

const ShopFinder: React.FC = () => {
  const { currentShopType } = useInventory();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shop Finder</h2>
          <p className="text-muted-foreground">
            Find nearby shops and discover available products
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="p-6">
              <ShopFinderComponent />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Package2 className="h-5 w-5 mr-2 text-primary" />
                Your Shop Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shop Type</p>
                  <p className="font-medium">{currentShopType}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    <p className="font-medium">Current Location</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <p className="font-medium">Visible to nearby customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Shop Finder Features</h3>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                  <span>Search for products within a 10km radius</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                  <span>Filter shops by type (Grocery, Electronics, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                  <span>View product availability before visiting</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                  <span>Create pickup orders directly from the app</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopFinder;
