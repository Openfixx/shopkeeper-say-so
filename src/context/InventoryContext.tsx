import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DbProduct } from '@/lib/supabase';
import { Bill, BillItem, Shop, StockAlert, ProductFindResult } from '@/types/inventory';
import { fetchProductImage } from '@/lib/fetchImage';

// ——— Types ———
export type Product = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image?: string;
  barcode?: string;
  stockAlert?: number;
  createdAt: string;
  updatedAt: string;
  shopId?: string;
  userId: string;
};

interface InventoryContextType {
  products: Product[];
  bills: Bill[];
  isLoading: boolean;
  error: string | null;
  currentBill: { id: string; items: BillItem[]; total: number } | null;
  stockAlerts: StockAlert[];
  currentShopType: string;
  
  // Product management methods
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'image'>
  ) => Promise<void>;
  updateProduct: (id: string, product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  findProduct: (name: string) => ProductFindResult[];
  scanBarcode: (barcode: string) => Promise<Product | null>;
  
  // Bill management methods
  startNewBill: () => void;
  addToBill: (productId: string, quantity: number) => void;
  removeFromBill: (productId: string) => void;
  updateBillItemQuantity: (productId: string, quantity: number) => void;
  updateBillItemUnit: (productId: string, unit: string) => void;
  completeBill: () => void;
  cancelBill: () => void;
  
  // Shop management methods
  setShopType: (type: string) => void;
  findNearbyShops: (query: string, distance: number, type?: string) => Shop[];
  
  // Stock alerts
  setStockAlert: (productId: string, threshold: number) => void;
  removeStockAlert: (productId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);
export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within Provider');
  return ctx;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBill, setCurrentBill] = useState<{
    id: string;
    items: BillItem[];
    total: number;
  } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [currentShopType, setCurrentShopType] = useState<string>('');
  // … other state (shopType, stockAlerts) …

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchBills()]);
      } catch (e) {
        console.error(e);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Demo mode: seed from localStorage
      if (process.env.NEXT_PUBLIC_DEMO_MODE) {
        const storedProducts = localStorage.getItem('demo-products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
          return;
        }
      }

      // 2. Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Convert from DB format to our local `Product` type
      const typedProducts: Product[] = data.map((p: DbProduct) => ({
        id: p.id,
        name: p.product_name,
        quantity: p.quantity,
        unit: p.unit,
        position: p.position || '',
        expiry: p.expiry || '',
        price: p.price,
        image: p.image_url,
        barcode: p.barcode,
        stockAlert: p.stock_alert,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        shopId: p.shop_id,
        userId: p.user_id,
      }));
      setProducts(typedProducts);
    } catch (e: any) {
      console.error('Failed to load products from Supabase', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Demo mode: seed from localStorage
      if (process.env.NEXT_PUBLIC_DEMO_MODE) {
        return; // no bills in demo mode
      }

      // 2. Supabase
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;

      // Convert from DB format to our local `Bill` type
      // TODO: write this conversion
      // const typedBills: Bill[] = data.map((b: DbBill) => ({
      //   id: b.id,
      //   items: b.items,
      //   total: b.total,
      //   customerId: b.customer_id,
      //   customerName: b.customer_name,
      //   timestamp: b.timestamp,
      // }));
      // setBills(typedBills);
    } catch (e: any) {
      console.error('Failed to load bills from Supabase', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ——— UPDATED addProduct ———
  const addProduct = async (
    product: Omit<
      Product,
      'id' | 'createdAt' | 'updatedAt' | 'userId' | 'image'
    >
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'demo-user';
      const now = new Date().toISOString();

      // ★ fetch an image for this product name ★
      const image = await fetchProductImage(product.name);

      const newProduct: Product = {
        id: uuidv4(),
        ...product,
        image,
        createdAt: now,
        updatedAt: now,
        userId,
      };

      // demo‐mode: local state
      setProducts((prev) => [...prev, newProduct]);

      toast.success(`${product.name} added!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
      throw err;
    }
  };

  // Add the missing methods to fix the TypeScript errors
  
  // Product management methods
  const updateProduct = async (id: string, updatedProduct: Product) => {
    try {
      setProducts(prev => prev.map(p => p.id === id ? { ...updatedProduct, updatedAt: new Date().toISOString() } : p));
      toast.success('Product updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update product');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
      throw err;
    }
  };

  const findProduct = (name: string): ProductFindResult[] => {
    if (!name) return [];
    const lowerName = name.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(lowerName))
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        price: p.price,
        image: p.image,
        image_url: p.image
      }));
  };

  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      toast.success(`Found: ${product.name}`);
      return product;
    }
    toast.error('Product not found');
    return null;
  };

  // Bill management methods
  const startNewBill = () => {
    setCurrentBill({
      id: uuidv4(),
      items: [],
      total: 0,
    });
    toast.info('New bill started');
  };

  const addToBill = (productId: string, quantity: number) => {
    if (!currentBill) {
      startNewBill();
    }
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const product = products.find(p => p.id === productId);
      if (!product) return prev;
      
      // Check if product already in bill
      const existingItemIndex = prev.items.findIndex(item => item.productId === productId);
      
      let updatedItems: BillItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...prev.items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      } else {
        // Add new item
        const newItem: BillItem = {
          productId,
          name: product.name,
          quantity,
          price: product.price,
          unit: product.unit,
          total: product.price * quantity,
          image: product.image,
        };
        updatedItems = [...prev.items, newItem];
      }
      
      // Calculate new total
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const removeFromBill = (productId: string) => {
    if (!currentBill) return;
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.filter(item => item.productId !== productId);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const updateBillItemQuantity = (productId: string, quantity: number) => {
    if (!currentBill) return;
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity,
            total: quantity * item.price
          };
        }
        return item;
      });
      
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const updateBillItemUnit = (productId: string, unit: string) => {
    if (!currentBill) return;
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            unit
          };
        }
        return item;
      });
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const completeBill = () => {
    if (!currentBill || currentBill.items.length === 0) return;
    
    // Create a new completed bill
    const completedBill: Bill = {
      id: currentBill.id,
      items: [...currentBill.items],
      total: currentBill.total,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    // Add to bills history
    setBills(prev => [completedBill, ...prev]);
    
    // Reset current bill
    setCurrentBill(null);
    
    toast.success('Bill completed successfully');
  };

  const cancelBill = () => {
    if (!currentBill) return;
    
    // Add to history as cancelled
    if (currentBill.items.length > 0) {
      const cancelledBill: Bill = {
        id: currentBill.id,
        items: [...currentBill.items],
        total: currentBill.total,
        timestamp: new Date().toISOString(),
        status: 'cancelled'
      };
      
      setBills(prev => [cancelledBill, ...prev]);
    }
    
    // Reset current bill
    setCurrentBill(null);
    
    toast.info('Bill cancelled');
  };

  // Shop management methods
  const setShopType = (type: string) => {
    setCurrentShopType(type);
  };

  const findNearbyShops = (query: string, distance: number, type?: string): Shop[] => {
    // This is a mock implementation - in a real app this would call an API
    const mockShops: Shop[] = [
      { id: '1', name: 'Grocery Store', type: 'Grocery', location: 'Main Street', distance: 1.2 },
      { id: '2', name: 'Electronics Bazaar', type: 'Electronics', location: 'Tech Lane', distance: 2.5 },
      { id: '3', name: 'Fashion Hub', type: 'Clothing', location: 'Style Avenue', distance: 3.7 },
      { id: '4', name: 'Medicine Mart', type: 'Pharmacy', location: 'Health Road', distance: 1.8 }
    ];
    
    return mockShops.filter(shop => {
      // Filter by type if provided
      if (type && shop.type !== type) return false;
      
      // Filter by distance
      if (shop.distance > distance) return false;
      
      // Filter by query if provided
      if (query && !shop.name.toLowerCase().includes(query.toLowerCase())) return false;
      
      return true;
    });
  };

  // Stock alert methods
  const setStockAlert = (productId: string, threshold: number) => {
    setStockAlerts(prev => {
      const existing = prev.find(a => a.productId === productId);
      if (existing) {
        return prev.map(a => a.productId === productId ? { ...a, threshold } : a);
      }
      return [...prev, { productId, threshold }];
    });
    
    toast.success('Stock alert set');
  };

  const removeStockAlert = (productId: string) => {
    setStockAlerts(prev => prev.filter(a => a.productId !== productId));
    toast.info('Stock alert removed');
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        isLoading,
        error,
        currentBill,
        stockAlerts,
        currentShopType,
        addProduct,
        updateProduct,
        deleteProduct,
        findProduct,
        scanBarcode,
        startNewBill,
        addToBill,
        removeFromBill,
        updateBillItemQuantity,
        updateBillItemUnit,
        completeBill,
        cancelBill,
        setShopType,
        findNearbyShops,
        setStockAlert,
        removeStockAlert
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
