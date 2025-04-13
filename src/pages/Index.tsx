
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  BoxIcon, 
  CreditCard,
  ChevronRight,
  DollarSign,
  Package2, 
  PackageX, 
  ShoppingCart, 
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/ui-custom/BarChart';
import DashboardVoiceCommands from '@/components/ui-custom/DashboardVoiceCommands';
import BillingDialog from '@/components/ui-custom/BillingDialog';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  formatter?: (value: number) => string;
  onClick?: () => void;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  formatter = (val) => val.toString(),
  onClick,
  className,
}) => (
  <Card 
    className={`stats-card cursor-pointer overflow-hidden ${className}`}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="text-2xl font-bold">{formatter(value)}</div>
          {description && (
            <div className="flex items-center mt-1">
              {trend === 'up' && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> 
                  {description}
                </Badge>
              )}
              {trend === 'down' && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> 
                  {description}
                </Badge>
              )}
              {!trend && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { products, bills, isLoading } = useInventory();
  const navigate = useNavigate();
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, product) => acc + (product.quantity || 0), 0);
  const lowStockProducts = products.filter(product => (product.quantity || 0) < 5).length;
  const totalSales = bills.reduce((acc, bill) => acc + bill.total, 0);
  
  // Mock sales data for charts with different periods
  const salesData = {
    daily: [
      { name: 'Mon', total: 1200 },
      { name: 'Tue', total: 900 },
      { name: 'Wed', total: 1800 },
      { name: 'Thu', total: 1400 },
      { name: 'Fri', total: 2200 },
      { name: 'Sat', total: 1700 },
      { name: 'Sun', total: 2600 },
    ],
    weekly: [
      { name: 'Week 1', total: 8200 },
      { name: 'Week 2', total: 6900 },
      { name: 'Week 3', total: 7800 },
      { name: 'Week 4', total: 9400 },
    ],
    monthly: [
      { name: 'Jan', total: 12000 },
      { name: 'Feb', total: 9000 },
      { name: 'Mar', total: 18000 },
      { name: 'Apr', total: 14000 },
      { name: 'May', total: 22000 },
      { name: 'Jun', total: 17000 },
    ]
  };
  
  const areaChartData = [
    { name: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
    { name: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
    { name: 'Mar', revenue: 2000, expenses: 1200, profit: 800 },
    { name: 'Apr', revenue: 2780, expenses: 1908, profit: 872 },
    { name: 'May', revenue: 1890, expenses: 1800, profit: 90 },
    { name: 'Jun', revenue: 2390, expenses: 1600, profit: 790 },
    { name: 'Jul', revenue: 3490, expenses: 2200, profit: 1290 },
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

  // Card animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient-purple">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your inventory and sales
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/products/add')}
            className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
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
      
      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[60px]" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Total Products"
                value={totalProducts}
                icon={<BoxIcon className="h-6 w-6" />}
                description="12% increase"
                trend="up"
                onClick={() => navigate('/products')}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="Current Inventory"
                value={totalStock}
                icon={<Package2 className="h-6 w-6" />}
                description="Total items in stock"
                onClick={() => navigate('/inventory')}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="Low Stock Items"
                value={lowStockProducts}
                icon={<PackageX className="h-6 w-6" />}
                description={lowStockProducts > 0 ? "Needs attention" : "All stocked"}
                trend={lowStockProducts > 0 ? 'down' : 'up'}
                onClick={() => navigate('/inventory?filter=low-stock')}
                className={lowStockProducts > 0 ? 'border-red-200 dark:border-red-900/30' : ''}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="Total Sales"
                value={totalSales}
                icon={<DollarSign className="h-6 w-6" />}
                description="15% increase"
                trend="up"
                formatter={(val) => formatter.format(val)}
                onClick={() => navigate('/billing')}
              />
            </motion.div>
          </>
        )}
      </motion.div>
      
      <motion.div 
        className="grid gap-6 md:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="md:col-span-2"
          variants={itemVariants}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Sales Overview</CardTitle>
              <Tabs value={activePeriod} onValueChange={(v: string) => setActivePeriod(v as any)}>
                <TabsList className="grid w-[220px] grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[280px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={areaChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value}`, undefined]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 8,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#82ca9d" 
                        fillOpacity={1} 
                        fill="url(#colorExpenses)"
                        name="Expenses" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[160px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bills.length > 0 ? (
                  <div className="space-y-4">
                    {bills.slice(0, 4).map((bill, index) => (
                      <div
                        key={bill.id}
                        className="flex items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">
                            Bill #{bill.id.slice(-4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bill.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="ml-auto text-sm font-medium">
                          {formatter.format(bill.total)}
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => navigate('/billing')}
                    >
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground opacity-20" />
                    <div>
                      <h3 className="text-lg font-medium">No activity yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start by creating your first bill
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Popular Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-[140px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))
                ) : (
                  products.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex items-center">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted mr-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Package2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.quantity} {product.unit}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatter.format(product.price)}
                      </p>
                    </div>
                  ))
                )}
                
                {!isLoading && products.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => navigate('/products')}
                  >
                    View All Products
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
                
                {!isLoading && products.length === 0 && (
                  <div className="text-center py-6">
                    <Package2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No products yet</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => navigate('/products/add')}
                    >
                      Add Product
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium">Total Products</p>
                      <p className="text-2xl font-bold">{totalProducts}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Total Items</p>
                      <p className="text-2xl font-bold">{totalStock}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          Low Stock
                        </span>
                        <span>{lowStockProducts}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-destructive"
                          style={{ width: `${(lowStockProducts / totalProducts) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          Expiring Soon
                        </span>
                        <span>3</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500"
                          style={{ width: '15%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-green-500" />
                          Well Stocked
                        </span>
                        <span>{totalProducts - lowStockProducts - 3}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${((totalProducts - lowStockProducts - 3) / totalProducts) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center p-1 rounded-full bg-muted">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">240</p>
                    <p className="text-sm text-muted-foreground">Monthly customers</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Returning</p>
                      <p className="text-xl font-bold">64%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">New</p>
                      <p className="text-xl font-bold">36%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Avg. Spend</p>
                      <p className="text-xl font-bold">$42</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Conversion</p>
                      <p className="text-xl font-bold">3.2%</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
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
