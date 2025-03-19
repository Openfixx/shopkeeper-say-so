
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import SearchBar from '@/components/ui-custom/SearchBar';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { 
  AlertCircle,
  ArrowUpDown, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FilterIcon, 
  MapPin,
  PackageIcon,
  XCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type Product } from '@/context/InventoryContext';
import { toast } from 'sonner';

type SortField = 'name' | 'quantity' | 'position' | 'price' | 'expiry';
type SortDirection = 'asc' | 'desc';

const Inventory: React.FC = () => {
  const { products, isLoading } = useInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';
  const initialFilter = searchParams.get('filter') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterType, setFilterType] = useState<string>(initialFilter);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
    
    if (initialFilter) {
      setFilterType(initialFilter);
    }
  }, [initialSearchQuery, initialFilter]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Update URL params
    if (query) {
      searchParams.set('search', query);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };
  
  const handleFilter = (filter: string) => {
    setFilterType(filter);
    
    // Update URL params
    if (filter) {
      searchParams.set('filter', filter);
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      const searchTerm = lowerCommand
        .replace(/search|find|where is/i, '')
        .trim();
      
      if (searchTerm) {
        handleSearch(searchTerm);
        toast.success(`Searching for "${searchTerm}"`);
      }
    } 
    else if (lowerCommand.includes('show') || lowerCommand.includes('filter')) {
      if (lowerCommand.includes('low stock') || lowerCommand.includes('low inventory')) {
        handleFilter('low-stock');
        toast.success('Filtering by low stock items');
      } 
      else if (lowerCommand.includes('expiring') || lowerCommand.includes('expiry')) {
        handleFilter('expiring-soon');
        toast.success('Filtering by expiring soon items');
      }
      else if (lowerCommand.includes('all') || lowerCommand.includes('everything')) {
        handleFilter('');
        handleSearch('');
        toast.success('Showing all inventory items');
      }
    }
    else if (lowerCommand.includes('sort')) {
      if (lowerCommand.includes('name')) {
        handleSort('name');
        toast.success('Sorting by name');
      }
      else if (lowerCommand.includes('quantity') || lowerCommand.includes('stock')) {
        handleSort('quantity');
        toast.success('Sorting by quantity');
      }
      else if (lowerCommand.includes('price')) {
        handleSort('price');
        toast.success('Sorting by price');
      }
      else if (lowerCommand.includes('expiry') || lowerCommand.includes('expiration')) {
        handleSort('expiry');
        toast.success('Sorting by expiry date');
      }
    }
    else {
      toast.info(`Command not recognized: "${command}"`);
    }
  };
  
  const sortData = (data: Product[]) => {
    return [...data].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } 
      else if (sortField === 'quantity') {
        return sortDirection === 'asc'
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } 
      else if (sortField === 'position') {
        return sortDirection === 'asc'
          ? a.position.localeCompare(b.position)
          : b.position.localeCompare(a.position);
      } 
      else if (sortField === 'price') {
        return sortDirection === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      } 
      else if (sortField === 'expiry') {
        // Handle cases where expiry might not exist
        if (!a.expiry) return sortDirection === 'asc' ? 1 : -1;
        if (!b.expiry) return sortDirection === 'asc' ? -1 : 1;
        return sortDirection === 'asc'
          ? new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
          : new Date(b.expiry).getTime() - new Date(a.expiry).getTime();
      }
      return 0;
    });
  };
  
  const getFilteredData = () => {
    let filteredData = [...products];
    
    // Apply search filter
    if (searchQuery) {
      filteredData = filteredData.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterType === 'low-stock') {
      filteredData = filteredData.filter(product => product.quantity < 5);
    } else if (filterType === 'expiring-soon') {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      filteredData = filteredData.filter(
        product => product.expiry && new Date(product.expiry) <= oneMonthFromNow
      );
    }
    
    // Sort the data
    return sortData(filteredData);
  };
  
  const filteredProducts = getFilteredData();
  
  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return (
        <Badge variant="destructive" className="flex gap-1 items-center">
          <XCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (quantity < 5) {
      return (
        <Badge variant="outline" className="flex gap-1 items-center text-orange-500 border-orange-500">
          <AlertCircle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex gap-1 items-center text-green-500 border-green-500">
          <CheckCircle2 className="h-3 w-3" />
          In Stock
        </Badge>
      );
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Track and manage your inventory
          </p>
        </div>
        <div className="flex space-x-2">
          <VoiceCommandButton 
            onVoiceCommand={handleVoiceCommand}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter
                {filterType && (
                  <Badge variant="secondary" className="ml-2">
                    {filterType === 'low-stock' ? 'Low Stock' : 'Expiring Soon'}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilter('')}>
                <PackageIcon className="mr-2 h-4 w-4" />
                All Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilter('low-stock')}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Low Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilter('expiring-soon')}>
                <Clock className="mr-2 h-4 w-4" />
                Expiring Soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <SearchBar
        placeholder="Search products or locations..."
        onSearch={handleSearch}
        className="w-full md:w-96"
      />
      
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('name')}>
                      <span>Product Name</span>
                      {sortField === 'name' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('quantity')}>
                      <span>Quantity</span>
                      {sortField === 'quantity' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('position')}>
                      <span>Location</span>
                      {sortField === 'position' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('price')}>
                      <span>Price</span>
                      {sortField === 'price' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('expiry')}>
                      <span>Expiry</span>
                      {sortField === 'expiry' && (
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.image ? (
                            <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <PackageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.quantity} {product.unit}
                      </TableCell>
                      <TableCell>
                        {getStockStatusBadge(product.quantity)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                          {product.position}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.expiry ? (
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                            {new Date(product.expiry).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <PackageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
                        <div>
                          <p className="text-lg font-medium">No results found</p>
                          <p className="text-sm text-muted-foreground">
                            {searchQuery 
                              ? `No products matching "${searchQuery}"` 
                              : filterType 
                                ? `No products match the "${filterType === 'low-stock' ? 'Low Stock' : 'Expiring Soon'}" filter`
                                : "No products found in your inventory"}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => { handleSearch(''); handleFilter(''); }}>
                          Show all products
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
