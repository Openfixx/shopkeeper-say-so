import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useInventory } from '@/context/InventoryContext';
import { useLanguage } from '@/context/LanguageContext';
import NoData from '@/components/NoData';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';
import EnhancedVoiceCommand from '@/components/ui-custom/EnhancedVoiceCommand';
import { VoiceProduct } from '@/types/voice';

const Products = () => {
  const { products, addProduct } = useInventory();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);

  // Check for search query in location state (when redirected from voice search)
  useEffect(() => {
    const searchFromState = location.state?.searchQuery;
    if (searchFromState) {
      setSearchQuery(searchFromState);
      // Clear the state to avoid persisting across navigations
      navigate('.', { state: {}, replace: true });
    }
  }, [location.state, navigate]);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'quantity') {
        return sortOrder === 'asc'
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } else if (sortBy === 'price') {
        return sortOrder === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      }
      return 0;
    });
  
  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Categories derived from products
  const categories = ['all', ...new Set(products
    .map(product => (product.category || 'uncategorized'))
    .filter(Boolean))];
  
  // Toggle sort order when clicking on the same sort option
  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortOrder('asc');
    }
  };

  const handleVoiceCommand = (command: string, detectedProducts: VoiceProduct[]) => {
    if (command.toLowerCase().includes('search') || command.toLowerCase().includes('find')) {
      // Extract search term
      const searchTerms = command.replace(/search|find|for/gi, '').trim();
      if (searchTerms) {
        setSearchQuery(searchTerms);
        toast.success(`Searching for "${searchTerms}"`);
      }
    } else if (detectedProducts.length > 0) {
      // Add all detected products to inventory
      detectedProducts.forEach(product => {
        const newProduct = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: product.name,
          quantity: product.quantity || 1,
          unit: product.unit || 'piece',
          position: product.position || 'General Storage',
          price: product.price || 0,
          category: 'Voice Added',
          image_url: product.image_url || '',
          notes: `Added via voice command on ${new Date().toLocaleString()}`
        };
        
        addProduct(newProduct);
      });
      
      toast.success(`Added ${detectedProducts.length} product(s) to inventory`);
    }
  };
  
  const getSortIcon = () => {
    if (sortOrder === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('products')}</h1>
          <p className="text-muted-foreground">
            {t('manageProducts')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate('/products/add')} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('addProduct')}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowVoiceCommand(true)}
            className="w-full sm:w-auto"
          >
            <Mic className="mr-2 h-4 w-4" />
            Voice Command
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t('filterBy')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' 
                        ? t('allCategories') 
                        : category.charAt(0).toUpperCase() + category.slice(1)
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={sortBy}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <span>
                      {t('sortBy')}: {sortBy}
                    </span>
                    {getSortIcon()}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('name')}</SelectItem>
                  <SelectItem value="quantity">{t('quantity')}</SelectItem>
                  <SelectItem value="price">{t('price')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Product Grid */}
      {currentProducts.length === 0 ? (
        <NoData 
          title={t('noProductsFound')}
          message={t('tryDifferentSearch')}
          action={
            <Button onClick={() => setSearchQuery('')}>
              {t('clearSearch')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="px-3 py-1.5">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </Badge>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Floating voice command with enhanced functionality */}
      <EnhancedVoiceCommand
        variant="floating"
        onCommand={handleVoiceCommand}
        onClose={() => setShowVoiceCommand(false)}
        className={showVoiceCommand ? 'visible' : 'invisible'}
      />
    </div>
  );
};

export default Products;
