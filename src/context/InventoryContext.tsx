
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

export type Product = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  position: string;
  expiry?: string;
  price: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
};

type InventoryContextType = {
  products: Product[];
  bills: Bill[];
  currentBill: Bill | null;
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  findProduct: (query: string) => Product[];
  startNewBill: () => void;
  addToBill: (productId: string, quantity: number) => void;
  removeFromBill: (productId: string) => void;
  completeBill: () => void;
  cancelBill: () => void;
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

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load mock data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockProducts);
      setIsLoading(false);
    };

    loadData();
  }, []);

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

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        currentBill,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        findProduct,
        startNewBill,
        addToBill,
        removeFromBill,
        completeBill,
        cancelBill,
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
