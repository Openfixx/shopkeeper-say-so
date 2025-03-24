
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, DbProduct, DbBill, DbBillItem, DbShop, DbStockAlert } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { checkProductInSharedDatabase } from '@/utils/voiceCommandUtils';

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
  createdAt: string;
  updatedAt: string;
  shared?: boolean;
  stockAlert?: number;
};

export type BillItem = {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
};

export type Bill = {
  id: string;
  items: BillItem[];
  total: number;
  deliveryOption?: boolean;
  paymentMethod?: string;
  partialPayment?: boolean;
  createdAt: string;
};

export type Shop = {
  id: string;
  name: string;
  type: 'Grocery' | 'Electronics' | 'Clothing' | 'Pharmacy' | string;
  location: string;
  distance?: number;
  products?: string[]; // Product IDs
  createdAt: string;
  updatedAt: string;
};

export type StockAlert = {
  id: string;
  productId: string;
  threshold: number;
  notificationSent: boolean;
  createdAt: string;
};

type InventoryContextType = {
  products: Product[];
  bills: Bill[];
  currentBill: Bill | null;
  shops: Shop[];
  stockAlerts: StockAlert[];
  currentShopType: string;
  isLoading: boolean;
  
  // Product functions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  findProduct: (query: string) => Product[];
  checkSharedDatabase: (name: string) => Promise<Product | null>;
  scanBarcode: (barcode: string) => Promise<Product | null>;
  
  // Bill functions
  startNewBill: () => void;
  addToBill: (productId: string, quantity: number) => void;
  removeFromBill: (productId: string) => void;
  completeBill: () => void;
  cancelBill: () => void;
  updateBillOptions: (options: {
    deliveryOption?: boolean;
    paymentMethod?: string;
    partialPayment?: boolean;
  }) => void;
  
  // Shop functions
  findNearbyShops: (query: string, distance?: number, type?: string) => Shop[];
  setShopType: (type: string) => void;
  
  // Stock alert functions
  setStockAlert: (productId: string, threshold: number) => void;
  removeStockAlert: (alertId: string) => void;
  checkStockAlerts: () => void;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [currentShopType, setCurrentShopType] = useState<string>(() => {
    return localStorage.getItem('shop_niche') || 'Grocery';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        // If no user is logged in, we can't load data
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchBills(),
        fetchShops(),
        fetchStockAlerts()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Save shop type to localStorage
  useEffect(() => {
    localStorage.setItem('shop_niche', currentShopType);
  }, [currentShopType]);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      const formattedProducts: Product[] = data.map((item: DbProduct) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        position: item.position,
        expiry: item.expiry,
        price: item.price,
        image: item.image_url,
        barcode: item.barcode,
        stockAlert: item.stock_alert,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch bills from Supabase
  const fetchBills = async () => {
    if (!user) return;
    
    try {
      // Fetch bills
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (billsError) {
        console.error('Error fetching bills:', billsError);
        return;
      }
      
      // For each bill, fetch its items
      const billsWithItems = await Promise.all(
        billsData.map(async (bill: DbBill) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('bill_items')
            .select('*, products(*)')
            .eq('bill_id', bill.id);
            
          if (itemsError) {
            console.error(`Error fetching items for bill ${bill.id}:`, itemsError);
            return null;
          }
          
          const items: BillItem[] = itemsData.map((item: any) => ({
            productId: item.product_id,
            name: item.products.name,
            quantity: item.quantity,
            unit: item.products.unit,
            price: item.price,
            total: item.total
          }));
          
          return {
            id: bill.id,
            items,
            total: bill.total,
            deliveryOption: bill.delivery_option,
            paymentMethod: bill.payment_method,
            partialPayment: bill.partial_payment,
            createdAt: bill.created_at
          };
        })
      );
      
      setBills(billsWithItems.filter(Boolean) as Bill[]);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  // Fetch shops from Supabase
  const fetchShops = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching shops:', error);
        return;
      }
      
      const formattedShops: Shop[] = data.map((item: DbShop) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        location: item.location,
        distance: item.distance,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setShops(formattedShops);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  // Fetch stock alerts from Supabase
  const fetchStockAlerts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching stock alerts:', error);
        return;
      }
      
      const formattedAlerts: StockAlert[] = data.map((item: DbStockAlert) => ({
        id: item.id,
        productId: item.product_id,
        threshold: item.threshold,
        notificationSent: item.notification_sent,
        createdAt: item.created_at
      }));
      
      setStockAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
    }
  };

  // Product functions
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add products');
      return;
    }
    
    try {
      const newProductData = {
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        position: product.position,
        expiry: product.expiry,
        price: product.price,
        image_url: product.image,
        barcode: product.barcode,
        stock_alert: product.stockAlert,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([newProductData])
        .select()
        .single();
        
      if (error) {
        console.error('Error adding product:', error);
        toast.error('Failed to add product');
        return;
      }
      
      const newProduct: Product = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        position: data.position,
        expiry: data.expiry,
        price: data.price,
        image: data.image_url,
        barcode: data.barcode,
        stockAlert: data.stock_alert,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setProducts(prev => [...prev, newProduct]);
      toast.success(`${product.name} added to inventory`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;
    
    try {
      // Convert from frontend model to database model
      const dbUpdates: Partial<DbProduct> = {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.quantity !== undefined && { quantity: updates.quantity }),
        ...(updates.unit !== undefined && { unit: updates.unit }),
        ...(updates.position !== undefined && { position: updates.position }),
        ...(updates.expiry !== undefined && { expiry: updates.expiry }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.image !== undefined && { image_url: updates.image }),
        ...(updates.barcode !== undefined && { barcode: updates.barcode }),
        ...(updates.stockAlert !== undefined && { stock_alert: updates.stockAlert }),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating product:', error);
        toast.error('Failed to update product');
        return;
      }
      
      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === id 
            ? { 
                ...product, 
                ...updates, 
                updatedAt: new Date().toISOString() 
              } 
            : product
        )
      );
      toast.success('Product updated');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
        return;
      }
      
      setProducts(prev => prev.filter(product => product.id !== id));
      toast.success('Product removed from inventory');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const findProduct = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(
      product => 
        product.name.toLowerCase().includes(lowercaseQuery) || 
        product.position.toLowerCase().includes(lowercaseQuery)
    );
  };
  
  const checkSharedDatabase = async (name: string): Promise<Product | null> => {
    try {
      const sharedProduct = await checkProductInSharedDatabase(name);
      if (sharedProduct) {
        // Convert to local Product format
        const newProduct: Product = {
          id: Date.now().toString(),
          name: sharedProduct.name || name,
          quantity: 0, // Need to set initial quantity
          unit: sharedProduct.unit || 'kg',
          position: '',
          price: sharedProduct.price || 0,
          image: sharedProduct.image || '/placeholder.svg',
          shared: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return newProduct;
      }
      return null;
    } catch (error) {
      console.error('Error checking shared database:', error);
      return null;
    }
  };
  
  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    // First check if product exists in local inventory
    const existingProduct = products.find(p => p.barcode === barcode);
    if (existingProduct) return existingProduct;
    
    try {
      // Check if product exists in Supabase's shared barcode database table
      const { data, error } = await supabase
        .from('barcode_products')
        .select('*')
        .eq('barcode', barcode)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, use mock data as fallback
          return mockBarcodeData(barcode);
        }
        console.error('Error scanning barcode:', error);
        return null;
      }
      
      // Convert to local Product format
      const newProduct: Product = {
        id: Date.now().toString(),
        name: data.name,
        quantity: 0, // Needs to be set by user
        unit: data.unit || 'pcs',
        position: '',
        price: data.price || 0,
        image: data.image_url || '/placeholder.svg',
        barcode: barcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shared: true
      };
      
      return newProduct;
    } catch (error) {
      console.error('Error scanning barcode:', error);
      return mockBarcodeData(barcode);
    }
  };
  
  // Mock barcode data as fallback
  const mockBarcodeData = (barcode: string): Promise<Product | null> => {
    const barcodes: Record<string, Partial<Product>> = {
      '8901234567890': {
        name: 'Sugar',
        unit: 'kg',
        price: 45,
        image: '/placeholder.svg',
        barcode: '8901234567890'
      },
      '8901234567891': {
        name: 'Rice',
        unit: 'kg',
        price: 60,
        image: '/placeholder.svg',
        barcode: '8901234567891'
      }
    };
    
    return new Promise(resolve => {
      setTimeout(() => {
        if (barcode in barcodes) {
          // Create a temp product (user would need to save to inventory)
          const newProduct: Product = {
            id: Date.now().toString(),
            name: barcodes[barcode].name || 'Unknown Product',
            quantity: 0, // Needs to be set by user
            unit: barcodes[barcode].unit || 'pcs',
            position: '',
            price: barcodes[barcode].price || 0,
            image: barcodes[barcode].image || '/placeholder.svg',
            barcode: barcode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            shared: true
          };
          resolve(newProduct);
        } else {
          resolve(null);
        }
      }, 500); // Simulate network delay
    });
  };

  // Bill functions
  const startNewBill = () => {
    setCurrentBill({
      id: Date.now().toString(),
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const addToBill = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    if (product.quantity < quantity) {
      toast.error(`Only ${product.quantity} ${product.unit} available`);
      return;
    }
    
    if (!currentBill) {
      startNewBill();
    }
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const existingItemIndex = prev.items.findIndex(item => item.productId === productId);
      let newItems: BillItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...prev.items];
        newItems[existingItemIndex].quantity += quantity;
        newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].price;
      } else {
        // Add new item
        newItems = [
          ...prev.items,
          {
            productId,
            name: product.name,
            quantity,
            unit: product.unit,
            price: product.price,
            total: product.price * quantity,
          }
        ];
      }
      
      // Calculate new total
      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
    
    // Update product quantity
    updateProduct(productId, { 
      quantity: product.quantity - quantity 
    });
    
    toast.success(`Added ${quantity} ${product.unit} of ${product.name} to bill`);
  };

  const removeFromBill = (productId: string) => {
    if (!currentBill) return;
    
    const billItem = currentBill.items.find(item => item.productId === productId);
    if (!billItem) return;
    
    // Restore product quantity
    const product = products.find(p => p.id === productId);
    if (product) {
      updateProduct(productId, { 
        quantity: product.quantity + billItem.quantity 
      });
    }
    
    // Remove item from bill
    setCurrentBill(prev => {
      if (!prev) return null;
      
      const newItems = prev.items.filter(item => item.productId !== productId);
      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
    
    toast.success(`Removed ${billItem.name} from bill`);
  };
  
  const updateBillOptions = (options: {
    deliveryOption?: boolean;
    paymentMethod?: string;
    partialPayment?: boolean;
  }) => {
    if (!currentBill) return;
    
    setCurrentBill(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        ...options
      };
    });
    
    toast.success('Bill options updated');
  };

  const completeBill = async () => {
    if (!user) {
      toast.error('You must be logged in to complete a bill');
      return;
    }
    
    if (!currentBill || currentBill.items.length === 0) {
      toast.error('Cannot complete an empty bill');
      return;
    }
    
    try {
      // Create the bill in Supabase
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert([{
          total: currentBill.total,
          delivery_option: currentBill.deliveryOption || false,
          payment_method: currentBill.paymentMethod || 'cash',
          partial_payment: currentBill.partialPayment || false,
          user_id: user.id
        }])
        .select()
        .single();
        
      if (billError) {
        console.error('Error creating bill:', billError);
        toast.error('Failed to complete bill');
        return;
      }
      
      // Create bill items
      const billItems = currentBill.items.map(item => ({
        bill_id: billData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        user_id: user.id
      }));
      
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);
        
      if (itemsError) {
        console.error('Error creating bill items:', itemsError);
        toast.error('Failed to complete bill items');
        return;
      }
      
      // Update local state
      setBills(prev => [
        {
          ...currentBill,
          id: billData.id,
          createdAt: billData.created_at
        }, 
        ...prev
      ]);
      
      setCurrentBill(null);
      toast.success('Bill completed');
    } catch (error) {
      console.error('Error completing bill:', error);
      toast.error('Failed to complete bill');
    }
  };

  const cancelBill = () => {
    if (!currentBill) return;
    
    // Restore all product quantities
    currentBill.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updateProduct(item.productId, { 
          quantity: product.quantity + item.quantity 
        });
      }
    });
    
    setCurrentBill(null);
    toast.success('Bill cancelled');
  };
  
  // Shop functions
  const findNearbyShops = (query: string, distance = 10, type?: string) => {
    const filteredShops = shops.filter(shop => {
      // Filter by distance
      if (shop.distance && shop.distance > distance) return false;
      
      // Filter by shop type if specified
      if (type && shop.type !== type) return false;
      
      // Filter by query if provided
      if (query) {
        return shop.name.toLowerCase().includes(query.toLowerCase()) ||
               shop.location.toLowerCase().includes(query.toLowerCase());
      }
      
      return true;
    });
    
    return filteredShops;
  };
  
  const setShopType = (type: string) => {
    setCurrentShopType(type);
    toast.success(`Shop type set to ${type}`);
  };
  
  // Stock alert functions
  const setStockAlert = async (productId: string, threshold: number) => {
    if (!user) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    try {
      // Check if alert already exists
      const existingAlert = stockAlerts.find(a => a.productId === productId);
      
      if (existingAlert) {
        // Update existing alert
        const { error } = await supabase
          .from('stock_alerts')
          .update({
            threshold,
            notification_sent: false
          })
          .eq('id', existingAlert.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error updating stock alert:', error);
          toast.error('Failed to update stock alert');
          return;
        }
        
        setStockAlerts(prev => 
          prev.map(alert => 
            alert.id === existingAlert.id 
              ? { 
                  ...alert, 
                  threshold,
                  notificationSent: false 
                } 
              : alert
          )
        );
      } else {
        // Create new alert
        const { data, error } = await supabase
          .from('stock_alerts')
          .insert([{
            product_id: productId,
            threshold,
            notification_sent: false,
            user_id: user.id
          }])
          .select()
          .single();
          
        if (error) {
          console.error('Error creating stock alert:', error);
          toast.error('Failed to create stock alert');
          return;
        }
        
        const newAlert: StockAlert = {
          id: data.id,
          productId: data.product_id,
          threshold: data.threshold,
          notificationSent: data.notification_sent,
          createdAt: data.created_at
        };
        
        setStockAlerts(prev => [...prev, newAlert]);
      }
      
      // Update product to store threshold
      await updateProduct(productId, {
        stockAlert: threshold
      });
      
      toast.success(`Stock alert set for ${product.name} at ${threshold} ${product.unit}`);
    } catch (error) {
      console.error('Error setting stock alert:', error);
      toast.error('Failed to set stock alert');
    }
  };
  
  const removeStockAlert = async (alertId: string) => {
    if (!user) return;
    
    try {
      const alert = stockAlerts.find(a => a.id === alertId);
      if (!alert) return;
      
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error removing stock alert:', error);
        toast.error('Failed to remove stock alert');
        return;
      }
      
      setStockAlerts(prev => prev.filter(a => a.id !== alertId));
      
      // Remove threshold from product
      const product = products.find(p => p.id === alert.productId);
      if (product) {
        await updateProduct(alert.productId, {
          stockAlert: undefined
        });
      }
      
      toast.success('Stock alert removed');
    } catch (error) {
      console.error('Error removing stock alert:', error);
      toast.error('Failed to remove stock alert');
    }
  };
  
  const checkStockAlerts = () => {
    stockAlerts.forEach(alert => {
      if (alert.notificationSent) return;
      
      const product = products.find(p => p.id === alert.productId);
      if (!product) return;
      
      if (product.quantity <= alert.threshold) {
        // Set notification as sent
        supabase
          .from('stock_alerts')
          .update({ notification_sent: true })
          .eq('id', alert.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating alert notification status:', error);
            } else {
              setStockAlerts(prev => 
                prev.map(a => 
                  a.id === alert.id 
                    ? { ...a, notificationSent: true } 
                    : a
                )
              );
              
              // Notify user
              toast.warning(`Low stock alert: ${product.name} is below the threshold of ${alert.threshold} ${product.unit}`);
            }
          });
      }
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        currentBill,
        shops,
        stockAlerts,
        currentShopType,
        isLoading,
        
        addProduct,
        updateProduct,
        deleteProduct,
        findProduct,
        checkSharedDatabase,
        scanBarcode,
        
        startNewBill,
        addToBill,
        removeFromBill,
        completeBill,
        cancelBill,
        updateBillOptions,
        
        findNearbyShops,
        setShopType,
        
        setStockAlert,
        removeStockAlert,
        checkStockAlerts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
