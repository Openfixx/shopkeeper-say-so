
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  BoxIcon, 
  CreditCard, 
  Package2, 
  PackageX, 
  ShoppingCart, 
  TrendingUp 
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import AnimatedNumber from '@/components/ui-custom/AnimatedNumber';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from '@/components/ui-custom/BarChart';
import DashboardVoiceCommands from '@/components/ui-custom/DashboardVoiceCommands';
import BillingDialog from '@/components/ui-custom/BillingDialog';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  formatter?: (value: number) => string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  formatter = (val) => val.toString(),
  onClick,
}) => (
  <Card 
    className={`overflow-hidden transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <AnimatedNumber value={value} formatter={formatter} />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground flex items-center">
          {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
          {trend === 'down' && <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />}
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { products, bills, isLoading } = useInventory();
  const navigate = useNavigate();
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, product) => acc + product.quantity, 0);
  const lowStockProducts = products.filter(product => product.quantity < 5).length;
  const totalSales = bills.reduce((acc, bill) => acc + bill.total, 0);
  
  // Mock data for charts
  const salesData = [
    { name: 'Jan', total: 1200 },
    { name: 'Feb', total: 900 },
    { name: 'Mar', total: 1800 },
    { name: 'Apr', total: 1400 },
    { name: 'May', total: 2200 },
    { name: 'Jun', total: 1700 },
    { name: 'Jul', total: 2600 },
  ];
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });
  
  // Voice command handlers
  const handleAddProductCommand = () => {
    navigate('/products/add');
  };
  
  const handleCreateBillCommand = () => {
    setIsBillingDialogOpen(true);
  };
  
  const handleSearchProductCommand = (searchTerm: string) => {
    navigate(`/inventory?search=${encodeURIComponent(searchTerm)}`);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your inventory and sales
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/products/add')}
          >
            <Package2 className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button onClick={() => setIsBillingDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Products"
              value={totalProducts}
              icon={<BoxIcon className="h-4 w-4 text-primary" />}
              description="5 new this month"
              trend="up"
              onClick={() => navigate('/products')}
            />
            <StatCard
              title="Total Stock"
              value={totalStock}
              icon={<Package2 className="h-4 w-4 text-primary" />}
              description="Across all products"
              onClick={() => navigate('/inventory')}
            />
            <StatCard
              title="Low Stock Items"
              value={lowStockProducts}
              icon={<PackageX className="h-4 w-4 text-primary" />}
              description="Need to restock"
              trend={lowStockProducts > 0 ? 'up' : 'down'}
              onClick={() => navigate('/inventory?filter=low-stock')}
            />
            <StatCard
              title="Total Sales"
              value={totalSales}
              icon={<CreditCard className="h-4 w-4 text-primary" />}
              description="This month"
              trend="up"
              formatter={(val) => formatter.format(val)}
              onClick={() => navigate('/billing')}
            />
          </>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <GlassCard className="lg:col-span-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sales Overview</h3>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Monthly sales performance
            </p>
          </div>
          <div className="h-[300px] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              </div>
            ) : (
              <BarChart 
                data={salesData} 
                index="name" 
                categories={['total']} 
                colors={['#3b82f6']} 
                valueFormatter={(value) => formatter.format(value)}
                yAxisWidth={60}
              />
            )}
          </div>
        </GlassCard>
        
        <GlassCard className="lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {bills.length > 0 ? (
                bills.slice(0, 5).map((bill, index) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Bill #{bill.id.slice(-4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bill.createdAt).toLocaleString()} • {bill.items.length} items
                      </p>
                    </div>
                    <div className="ml-auto text-sm font-medium">
                      {formatter.format(bill.total)}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground opacity-20" />
                  <div>
                    <h3 className="text-lg font-medium">No bills yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start creating bills to track your sales
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/billing')}
                  >
                    Create a bill
                  </Button>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
      
      {/* Dashboard Voice Commands */}
      <DashboardVoiceCommands 
        onAddProduct={handleAddProductCommand}
        onCreateBill={handleCreateBillCommand}
        onSearchProduct={handleSearchProductCommand}
      />
      
      {/* Quick Billing Dialog */}
      <BillingDialog
        open={isBillingDialogOpen}
        onOpenChange={setIsBillingDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
