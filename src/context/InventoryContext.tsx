import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DbProduct } from '@/lib/supabase';
import { Bill, BillItem, StockAlert, ProductFindResult } from '@/types/inventory';
import { fetchProductImage } from '@/lib/fetchImage'; 
import type { Shop } from '@/types/inventory';

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
  image_url?: string;
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
  
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => Promise<void>;
  updateProduct: (id: string, product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  findProduct: (name: string) => ProductFindResult[];
  scanBarcode: (barcode: string) => Promise<Product | null>;
  
  startNewBill: () => void;
  addToBill: (productId: string, quantity: number) => void;
  removeFromBill: (productId: string) => void;
  updateBillItemQuantity: (productId: string, quantity: number) => void;
  updateBillItemUnit: (productId: string, unit: string) => void;
  completeBill: () => void;
  cancelBill: () => void;
  
  setShopType: (type: string) => void;
  findNearbyShops: (query: string, distance: number, type?: string) => Shop[];
  
  setStockAlert: (productId: string, threshold: number) => void;
  removeStockAlert: (productId: string) => void;
}

export type { Shop };

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
      if (process.env.NEXT_PUBLIC_DEMO_MODE) {
        const storedProducts = localStorage.getItem('demo-products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
          return;
        }
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const typedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id || uuidv4(),
        name: p.name || p.product_name || '',
        quantity: typeof p.quantity === 'number' ? p.quantity : 0,
        unit: p.unit || '',
        position: p.position || '',
        expiry: p.expiry || '',
        price: typeof p.price === 'number' ? p.price : 0,
        image: p.image_url || '',
        barcode: p.barcode || '',
        stockAlert: p.stock_alert || undefined,
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
        shopId: p.shop_id || undefined,
        userId: p.user_id || 'demo-user',
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
      if (process.env.NEXT_PUBLIC_DEMO_MODE) {
        return;
      }

      setBills([]);
    } catch (e: any) {
      console.error('Failed to load bills from Supabase', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (
    product: Omit<
      Product,
      'id' | 'createdAt' | 'updatedAt' | 'userId'
    >
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'demo-user';
      const now = new Date().toISOString();

      const image = await fetchProductImage(product.name);

      const newProduct: Product = {
        id: uuidv4(),
        ...product,
        image,
        createdAt: now,
        updatedAt: now,
        userId,
      };

      setProducts((prev) => [...prev, newProduct]);

      toast.success(`${product.name} added!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
      throw err;
    }
  };

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
      
      const existingItemIndex = prev.items.findIndex(item => item.productId === productId);
      
      let updatedItems: BillItem[];
      if (existingItemIndex >= 0) {
        updatedItems = [...prev.items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      } else {
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
    
    const completedBill: Bill = {
      id: currentBill.id,
      items: [...currentBill.items],
      total: currentBill.total,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    setBills(prev => [completedBill, ...prev]);
    
    setCurrentBill(null);
    
    toast.success('Bill completed successfully');
  };

  const cancelBill = () => {
    if (!currentBill) return;
    
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
    
    setCurrentBill(null);
    
    toast.info('Bill cancelled');
  };

  const setShopType = (type: string) => {
    setCurrentShopType(type);
  };

  const findNearbyShops = (query: string, distance: number, type?: string): Shop[] => {
    const mockShops: Shop[] = [
      { id: '1', name: 'Grocery Store', type: 'Grocery', location: 'Main Street', distance: 1.2 },
      { id: '2', name: 'Electronics Bazaar', type: 'Electronics', location: 'Tech Lane', distance: 2.5 },
      { id: '3', name: 'Fashion Hub', type: 'Clothing', location: 'Style Avenue', distance: 3.7 },
      { id: '4', name: 'Medicine Mart', type: 'Pharmacy', location: 'Health Road', distance: 1.8 }
    ];
    
    return mockShops.filter(shop => {
      if (type && shop.type !== type) return false;
      
      if (shop.distance > distance) return false;
      
      if (query && !shop.name.toLowerCase().includes(query.toLowerCase())) return false;
      
      return true;
    });
  };

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
