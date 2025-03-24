
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
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

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Sugar',
    quantity: 25,
    unit: 'kg',
    position: 'Rack 7',
    expiry: '2026-07-01',
    price: 45,
    image: 'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Salt',
    quantity: 30,
    unit: 'kg',
    position: 'Rack 3',
    price: 20,
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Rice',
    quantity: 50,
    unit: 'kg',
    position: 'Rack 1',
    price: 60,
    image: 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock shops data
const mockShops: Shop[] = [
  {
    id: '1',
    name: 'Local Grocery',
    type: 'Grocery',
    location: 'Main Street',
    distance: 2.5,
    products: ['1', '2', '3'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'City Electronics',
    type: 'Electronics',
    location: 'Market Street',
    distance: 5.1,
    products: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Fashion Hub',
    type: 'Clothing',
    location: 'Mall Road',
    distance: 8.3,
    products: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'MediCare',
    type: 'Pharmacy',
    location: 'Hospital Street',
    distance: 3.2,
    products: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [currentShopType, setCurrentShopType] = useState<string>('Grocery');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load mock data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockProducts);
      setShops(mockShops);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Product functions
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts(prev => [...prev, newProduct]);
    toast.success(`${product.name} added to inventory`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
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
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    toast.success('Product removed from inventory');
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
    
    // Mock barcode lookup - would normally check a database
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

  const completeBill = () => {
    if (!currentBill || currentBill.items.length === 0) {
      toast.error('Cannot complete an empty bill');
      return;
    }
    
    setBills(prev => [...prev, currentBill]);
    setCurrentBill(null);
    toast.success('Bill completed');
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
      
      // Filter by product query if provided
      if (query) {
        // Check if shop has products with this name
        // In a real app, this would be more sophisticated
        const hasProduct = shop.products?.some(productId => {
          const product = products.find(p => p.id === productId);
          return product?.name.toLowerCase().includes(query.toLowerCase());
        });
        return hasProduct;
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
  const setStockAlert = (productId: string, threshold: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    // Check if alert already exists
    const existingAlert = stockAlerts.find(a => a.productId === productId);
    if (existingAlert) {
      // Update existing alert
      setStockAlerts(prev => 
        prev.map(alert => 
          alert.productId === productId 
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
      const newAlert: StockAlert = {
        id: Date.now().toString(),
        productId,
        threshold,
        notificationSent: false,
        createdAt: new Date().toISOString()
      };
      setStockAlerts(prev => [...prev, newAlert]);
    }
    
    // Update product to store threshold
    updateProduct(productId, {
      stockAlert: threshold
    });
    
    toast.success(`Stock alert set for ${product.name} at ${threshold} ${product.unit}`);
  };
  
  const removeStockAlert = (alertId: string) => {
    const alert = stockAlerts.find(a => a.id === alertId);
    if (!alert) return;
    
    setStockAlerts(prev => prev.filter(a => a.id !== alertId));
    
    // Remove threshold from product
    const product = products.find(p => p.id === alert.productId);
    if (product) {
      updateProduct(alert.productId, {
        stockAlert: undefined
      });
    }
    
    toast.success('Stock alert removed');
  };
  
  const checkStockAlerts = () => {
    stockAlerts.forEach(alert => {
      if (alert.notificationSent) return;
      
      const product = products.find(p => p.id === alert.productId);
      if (!product) return;
      
      if (product.quantity <= alert.threshold) {
        // Set notification as sent
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
