import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DbProduct } from '@/lib/supabase';

// Define types
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
  deliveryOption: boolean;
  paymentMethod: string;
  partialPayment: boolean;
  createdAt: string;
  userId: string;
};

export type Shop = {
  id: string;
  name: string;
  type: string;
  location: string;
  distance: number;
  products?: string[];
};

export type StockAlert = {
  productId: string;
  threshold: number;
};

interface InventoryContextType {
  products: Product[];
  bills: Bill[];
  isLoading: boolean;
  error: string | null;
  currentBill: {
    id: string;
    items: BillItem[];
    total: number;
  } | null;
  startNewBill: () => void;
  addToBill: (productId: string, quantity: number) => void;
  removeFromBill: (productId: string) => void;
  updateBillItem: (productId: string, quantity: number) => void;
  updateBillItemQuantity: (productId: string, quantity: number) => void;
  updateBillItemUnit: (productId: string, unit: string) => void;
  completeBill: () => void;
  cancelBill: () => void;
  findProduct: (query: string) => Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  editProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refetchBills: () => Promise<void>;
  refetchProducts: () => Promise<void>;
  
  // Shop related properties
  currentShopType: string;
  setShopType: (type: string) => void;
  findNearbyShops: (query: string, distance: number, type?: string) => Shop[];
  
  // Stock alert related properties
  stockAlerts: StockAlert[];
  setStockAlert: (productId: string, threshold: number) => void;
  removeStockAlert: (productId: string) => void;
  
  // Barcode scanner related properties
  scanBarcode: (barcode: string) => Promise<Product | null>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBill, setCurrentBill] = useState<{
    id: string;
    items: BillItem[];
    total: number;
  } | null>(null);
  const [currentShopType, setCurrentShopType] = useState<string>('Grocery');
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  // Fetch products and bills on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchBills()]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.warn('No user ID found, using demo data');
        // Use demo data if no user ID
        setProducts(generateDemoProducts());
        return;
      }

      // DEMO MODE: Since we don't have actual tables in the Supabase project yet,
      // we'll use demo data instead of attempting to query
      setProducts(generateDemoProducts());

      /* In a production environment with proper tables, you'd do:
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedProducts: Product[] = data.map((item: DbProduct) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || '',
          position: item.position || '',
          expiry: item.expiry,
          price: item.price || 0,
          image: item.image_url,
          barcode: item.barcode,
          stockAlert: item.stock_alert,
          createdAt: item.created_at,
          updatedAt: item.updated_at || '',
          shopId: item.shop_id,
          userId: item.user_id || '',
        }));
        setProducts(formattedProducts);
      }
      */
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to demo data
      setProducts(generateDemoProducts());
    }
  };

  // Fetch bills from Supabase
  const fetchBills = async () => {
    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.warn('No user ID found, using demo data');
        // Use demo data if no user ID
        setBills(generateDemoBills());
        return;
      }

      // DEMO MODE: Since we don't have the bills table in Supabase yet,
      // we'll use demo data instead of attempting to query
      setBills(generateDemoBills());

      /* In a production environment with proper tables, you'd do:
      // Fetch bills
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (billsError) {
        throw billsError;
      }

      if (!billsData) {
        setBills([]);
        return;
      }

      // Fetch bill items for each bill
      const billsWithItems: Bill[] = await Promise.all(
        billsData.map(async (bill: DbBill) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('bill_items')
            .select('*, products(*)')
            .eq('bill_id', bill.id);

          if (itemsError) {
            throw itemsError;
          }

          const items: BillItem[] = itemsData
            ? itemsData.map((item: DbBillItem & { products: DbProduct }) => ({
                productId: item.product_id,
                name: item.products?.name || 'Unknown Product',
                quantity: item.quantity,
                unit: item.products?.unit || 'pcs',
                price: item.price,
                total: item.total,
              }))
            : [];

          return {
            id: bill.id,
            items,
            total: bill.total,
            deliveryOption: bill.delivery_option,
            paymentMethod: bill.payment_method,
            partialPayment: bill.partial_payment,
            createdAt: bill.created_at,
            userId: bill.user_id,
          };
        })
      );

      setBills(billsWithItems);
      */
    } catch (error) {
      console.error('Error fetching bills:', error);
      // Fallback to demo data
      setBills(generateDemoBills());
    }
  };

  // Generate demo products
  const generateDemoProducts = (): Product[] => {
    return [
      {
        id: '1',
        name: 'Rice',
        quantity: 25,
        unit: 'kg',
        position: 'Rack 1',
        price: 50,
        image: 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user',
      },
      {
        id: '2',
        name: 'Sugar',
        quantity: 10,
        unit: 'kg',
        position: 'Rack 2',
        price: 40,
        image: 'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user',
      },
      {
        id: '3',
        name: 'Flour',
        quantity: 15,
        unit: 'kg',
        position: 'Rack 1',
        price: 30,
        image: 'https://images.unsplash.com/photo-1627485937980-221ea163c3c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user',
      },
      {
        id: '4',
        name: 'Oil',
        quantity: 5,
        unit: 'liters',
        position: 'Rack 3',
        price: 120,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user',
      },
      {
        id: '5',
        name: 'Salt',
        quantity: 2,
        unit: 'kg',
        position: 'Rack 2',
        price: 20,
        image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user',
      },
    ];
  };

  // Generate demo bills
  const generateDemoBills = (): Bill[] => {
    const demoProducts = generateDemoProducts();
    
    return [
      {
        id: '1',
        items: [
          {
            productId: demoProducts[0].id,
            name: demoProducts[0].name,
            quantity: 2,
            unit: demoProducts[0].unit,
            price: demoProducts[0].price,
            total: 2 * demoProducts[0].price,
          },
          {
            productId: demoProducts[1].id,
            name: demoProducts[1].name,
            quantity: 1,
            unit: demoProducts[1].unit,
            price: demoProducts[1].price,
            total: 1 * demoProducts[1].price,
          },
        ],
        total: 2 * demoProducts[0].price + 1 * demoProducts[1].price,
        deliveryOption: false,
        paymentMethod: 'cash',
        partialPayment: false,
        createdAt: new Date().toISOString(),
        userId: 'demo-user',
      },
      {
        id: '2',
        items: [
          {
            productId: demoProducts[2].id,
            name: demoProducts[2].name,
            quantity: 3,
            unit: demoProducts[2].unit,
            price: demoProducts[2].price,
            total: 3 * demoProducts[2].price,
          },
        ],
        total: 3 * demoProducts[2].price,
        deliveryOption: true,
        paymentMethod: 'card',
        partialPayment: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        userId: 'demo-user',
      },
    ];
  };

  // Start a new bill
  const startNewBill = () => {
    setCurrentBill({
      id: uuidv4(),
      items: [],
      total: 0,
    });
  };

  // Add a product to the current bill
  const addToBill = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (!currentBill) {
      startNewBill();
    }

    if (currentBill) {
      // Check if product already exists in bill
      const existingItemIndex = currentBill.items.findIndex(
        (item) => item.productId === productId
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item
        updatedItems = [...currentBill.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          total: (existingItem.quantity + quantity) * existingItem.price,
        };
      } else {
        // Add new item
        updatedItems = [
          ...currentBill.items,
          {
            productId,
            name: product.name,
            quantity,
            unit: product.unit,
            price: product.price,
            total: quantity * product.price,
          },
        ];
      }

      // Calculate new total
      const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

      setCurrentBill({
        ...currentBill,
        items: updatedItems,
        total,
      });

      toast.success(`Added ${product.name} to bill`);
    }
  };

  // Remove a product from the current bill
  const removeFromBill = (productId: string) => {
    if (!currentBill) return;

    const updatedItems = currentBill.items.filter(
      (item) => item.productId !== productId
    );
    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

    setCurrentBill({
      ...currentBill,
      items: updatedItems,
      total,
    });

    toast.success('Item removed from bill');
  };

  // Update a bill item
  const updateBillItem = (productId: string, quantity: number) => {
    if (!currentBill) return;

    const updatedItems = currentBill.items.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          total: quantity * item.price,
        };
      }
      return item;
    });

    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

    setCurrentBill({
      ...currentBill,
      items: updatedItems,
      total,
    });
  };

  // Add these new functions
  const updateBillItemQuantity = (productId: string, quantity: number) => {
    if (!currentBill) return;
    
    const updatedItems = currentBill.items.map(item => {
      if (item.productId === productId) {
        const price = item.price;
        return {
          ...item,
          quantity: quantity,
          total: price * quantity
        };
      }
      return item;
    });
    
    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setCurrentBill({
      ...currentBill,
      items: updatedItems,
      total: total
    });
  };

  const updateBillItemUnit = (productId: string, unit: string) => {
    if (!currentBill) return;
    
    const updatedItems = currentBill.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          unit: unit
        };
      }
      return item;
    });
    
    setCurrentBill({
      ...currentBill,
      items: updatedItems
    });
  };

  // Complete the current bill
  const completeBill = async () => {
    if (!currentBill || currentBill.items.length === 0) return;

    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'demo-user';

      const newBill: Bill = {
        id: currentBill.id,
        items: currentBill.items,
        total: currentBill.total,
        deliveryOption: false,
        paymentMethod: 'cash',
        partialPayment: false,
        createdAt: new Date().toISOString(),
        userId,
      };

      // In a real app, we would save to Supabase here
      // For demo, just add to local state
      setBills([newBill, ...bills]);

      // Update product quantities
      const updatedProducts = [...products];
      for (const item of currentBill.items) {
        const productIndex = updatedProducts.findIndex(
          (p) => p.id === item.productId
        );
        if (productIndex >= 0) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            quantity: Math.max(
              0,
              updatedProducts[productIndex].quantity - item.quantity
            ),
          };
        }
      }
      setProducts(updatedProducts);

      // Reset current bill
      setCurrentBill(null);

      toast.success('Bill completed successfully');
    } catch (error) {
      console.error('Error completing bill:', error);
      toast.error('Failed to complete bill');
    }
  };

  // Cancel the current bill
  const cancelBill = () => {
    setCurrentBill(null);
    toast.info('Bill has been cancelled');
  };

  // Find products by name
  const findProduct = (query: string): Product[] => {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(lowerQuery)
    );
  };

  // Add a new product
  const addProduct = async (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'demo-user';

      const now = new Date().toISOString();
      const newProduct: Product = {
        id: uuidv4(),
        ...product,
        createdAt: now,
        updatedAt: now,
        userId,
      };

      // In a real app, we would save to Supabase here
      // For demo, just add to local state
      setProducts([...products, newProduct]);

      toast.success(`${product.name} added successfully`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  };

  // Edit a product
  const editProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const productIndex = products.findIndex((p) => p.id === id);
      if (productIndex < 0) {
        throw new Error('Product not found');
      }

      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // In a real app, we would save to Supabase here
      // For demo, just update local state
      setProducts(updatedProducts);

      toast.success(`${updatedProducts[productIndex].name} updated successfully`);
    } catch (error) {
      console.error('Error editing product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };
  
  // Alias for editProduct for compatibility
  const updateProduct = editProduct;

  // Delete a product
  const deleteProduct = async (id: string) => {
    try {
      const productIndex = products.findIndex((p) => p.id === id);
      if (productIndex < 0) {
        throw new Error('Product not found');
      }

      const productName = products[productIndex].name;
      const updatedProducts = products.filter((p) => p.id !== id);

      // In a real app, we would delete from Supabase here
      // For demo, just update local state
      setProducts(updatedProducts);

      toast.success(`${productName} deleted successfully`);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  };

  // Refetch bills
  const refetchBills = async () => {
    try {
      await fetchBills();
    } catch (error) {
      console.error('Error refetching bills:', error);
      toast.error('Failed to refresh bills');
    }
  };

  // Refetch products
  const refetchProducts = async () => {
    try {
      await fetchProducts();
    } catch (error) {
      console.error('Error refetching products:', error);
      toast.error('Failed to refresh products');
    }
  };
  
  // Set shop type
  const setShopType = (type: string) => {
    setCurrentShopType(type);
    toast.success(`Shop type set to ${type}`);
  };
  
  // Find nearby shops
  const findNearbyShops = (query: string, distance: number, type?: string): Shop[] => {
    // Mock implementation to return dummy data
    const shops: Shop[] = [
      {
        id: '1',
        name: 'Super Grocery Store',
        type: 'Grocery',
        location: '123 Main St, City',
        distance: 0.8,
      },
      {
        id: '2',
        name: 'Electronic World',
        type: 'Electronics',
        location: '456 Oak St, City',
        distance: 1.5,
      },
      {
        id: '3',
        name: 'Fashion Hub',
        type: 'Clothing',
        location: '789 Pine St, City',
        distance: 2.3,
      },
      {
        id: '4',
        name: 'Health Plus Pharmacy',
        type: 'Pharmacy',
        location: '101 Elm St, City',
        distance: 3.0,
      }
    ];
    
    let filtered = shops;
    
    // Filter by type if provided
    if (type) {
      filtered = filtered.filter(shop => shop.type === type);
    }
    
    // Filter by distance
    filtered = filtered.filter(shop => shop.distance <= distance);
    
    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(lowerQuery) || 
        shop.type.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  };
  
  // Set stock alert for a product
  const setStockAlert = (productId: string, threshold: number) => {
    setStockAlerts(prev => {
      // Remove existing alert for the product if any
      const filtered = prev.filter(alert => alert.productId !== productId);
      // Add new alert
      return [...filtered, { productId, threshold }];
    });
    toast.success('Stock alert set successfully');
  };
  
  // Remove stock alert for a product
  const removeStockAlert = (productId: string) => {
    setStockAlerts(prev => prev.filter(alert => alert.productId !== productId));
    toast.success('Stock alert removed');
  };
  
  // Scan barcode to find product
  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    // Mock implementation to find product by barcode
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      return product;
    }
    
    // For demo purposes, return a random product if barcode doesn't match
    if (products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      return products[randomIndex];
    }
    
    return null;
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        isLoading,
        error,
        currentBill,
        startNewBill,
        addToBill,
        removeFromBill,
        updateBillItem,
        updateBillItemQuantity,
        updateBillItemUnit,
        completeBill,
        cancelBill,
        findProduct,
        addProduct,
        editProduct,
        updateProduct,
        deleteProduct,
        refetchBills,
        refetchProducts,
        currentShopType,
        setShopType,
        findNearbyShops,
        stockAlerts,
        setStockAlert,
        removeStockAlert,
        scanBarcode
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
