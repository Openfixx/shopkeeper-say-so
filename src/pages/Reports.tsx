
import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/utils/formatters';
import { BarChart } from '@/components/ui-custom/BarChart';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CalendarIcon,
  DownloadIcon,
  FileBarChart2,
  FilePieChart,
  LineChart as LineChartIcon,
  BarChart2,
  Printer,
  Share2,
  Filter
} from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

// Custom hook for date range picking
const useDateRange = (initialRange?: DateRange) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialRange || {
      from: subDays(new Date(), 30),
      to: new Date(),
    }
  );

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return {
    dateRange,
    setDateRange: handleRangeSelect,
  };
};

// Color palette for charts
const CHART_COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#8B5CF6'];

// Mock data generator functions
const generateSalesData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'MMM dd'),
      sales: Math.floor(Math.random() * 500) + 100,
      orders: Math.floor(Math.random() * 20) + 1,
    });
  }
  
  return data;
};

const generateProductData = () => {
  return [
    { name: 'Rice', value: 400 },
    { name: 'Sugar', value: 300 },
    { name: 'Flour', value: 300 },
    { name: 'Oil', value: 200 },
    { name: 'Salt', value: 100 },
  ];
};

const generateCategoryData = () => {
  return [
    { name: 'Groceries', value: 400 },
    { name: 'Dairy', value: 300 },
    { name: 'Beverages', value: 200 },
    { name: 'Snacks', value: 150 },
    { name: 'Household', value: 100 },
  ];
};

const Reports: React.FC = () => {
  const { bills, products } = useInventory();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sales');
  const { dateRange, setDateRange } = useDateRange();
  
  // Generate demo/sample data for reports
  const salesData = generateSalesData(30);
  const productData = generateProductData();
  const categoryData = generateCategoryData();
  
  // Format for date display
  const formatDateDisplay = () => {
    if (!dateRange?.from) {
      return 'Select date range';
    }
    if (!dateRange.to) {
      return format(dateRange.from, 'PPP');
    }
    return `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
  };

  // Filter data based on date range
  const filteredSalesData = dateRange?.from
    ? salesData.filter(item => {
        const itemDate = new Date(item.date);
        return (
          (!dateRange.from || itemDate >= dateRange.from) &&
          (!dateRange.to || itemDate <= dateRange.to)
        );
      })
    : salesData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'hi-IN' ? 'रिपोर्ट्स और विश्लेषण' : 'Reports & Analytics'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'hi-IN' ? 'अपने व्यापार के प्रदर्शन का विश्लेषण करें' : 'Analyze the performance of your business'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange({
                    from: startOfMonth(new Date()),
                    to: endOfMonth(new Date())
                  })}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange({
                    from: subDays(new Date(), 7),
                    to: new Date()
                  })}
                >
                  Last 7 Days
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          
          <Button>
            <Printer className="mr-2 h-4 w-4" />
            {language === 'hi-IN' ? 'प्रिंट करें' : 'Print Report'}
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'hi-IN' ? 'कुल बिक्री' : 'Total Sales'}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-primary"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(45600)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% {language === 'hi-IN' ? 'पिछले महीने से' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'hi-IN' ? 'कुल आदेश' : 'Total Orders'}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-primary"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">235</div>
            <p className="text-xs text-muted-foreground">
              +12.2% {language === 'hi-IN' ? 'पिछले महीने से' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'hi-IN' ? 'औसत आदेश मूल्य' : 'Average Order Value'}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-primary"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(194.12)}</div>
            <p className="text-xs text-muted-foreground">
              +8.1% {language === 'hi-IN' ? 'पिछले महीने से' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'hi-IN' ? 'कुल उत्पाद' : 'Total Products'}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-primary"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              +201 {language === 'hi-IN' ? 'पिछले महीने से' : 'from last month'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Tabs */}
      <Tabs defaultValue="sales" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>{language === 'hi-IN' ? 'बिक्री' : 'Sales'}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FilePieChart className="h-4 w-4" />
            <span>{language === 'hi-IN' ? 'उत्पाद' : 'Products'}</span>
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <FileBarChart2 className="h-4 w-4" />
            <span>{language === 'hi-IN' ? 'श्रेणियां' : 'Categories'}</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span>{language === 'hi-IN' ? 'रुझान' : 'Trends'}</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <GlassCard>
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">
                {language === 'hi-IN' ? 'बिक्री अवलोकन' : 'Sales Overview'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'hi-IN'
                  ? 'पिछले 30 दिनों में बिक्री और आदेश की संख्या।'
                  : 'Number of sales and orders over the last 30 days.'}
              </p>
            </div>
            <div className="h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredSalesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'sales') {
                        return [formatCurrency(value), language === 'hi-IN' ? 'बिक्री' : 'Sales'];
                      }
                      return [value, language === 'hi-IN' ? 'आदेश' : 'Orders'];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name={language === 'hi-IN' ? 'बिक्री' : 'Sales'} />
                  <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name={language === 'hi-IN' ? 'आदेश' : 'Orders'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard>
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold">
                  {language === 'hi-IN' ? 'शीर्ष उत्पाद' : 'Top Products'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi-IN'
                    ? 'मात्रा के आधार पर शीर्ष बिकने वाले उत्पाद।'
                    : 'Top-selling products by quantity.'}
                </p>
              </div>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} units`, 'Quantity']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            
            <GlassCard>
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold">
                  {language === 'hi-IN' ? 'उत्पाद राजस्व' : 'Product Revenue'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi-IN'
                    ? 'राजस्व के आधार पर शीर्ष उत्पाद।'
                    : 'Top products by revenue.'}
                </p>
              </div>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 60,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                    <Bar dataKey="value" fill="#8884d8">
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
        
        {/* Category Tab */}
        <TabsContent value="category" className="space-y-4">
          <GlassCard>
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">
                {language === 'hi-IN' ? 'श्रेणी अवलोकन' : 'Category Overview'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'hi-IN'
                  ? 'श्रेणी के आधार पर बिक्री का विश्लेषण।'
                  : 'Analysis of sales by category.'}
              </p>
            </div>
            <div className="h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="value" fill="#8884d8">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <GlassCard>
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">
                {language === 'hi-IN' ? 'बिक्री रुझान' : 'Sales Trend'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'hi-IN'
                  ? 'समय के साथ बिक्री की प्रवृत्ति।'
                  : 'Trend of sales over time.'}
              </p>
            </div>
            <div className="h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredSalesData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
