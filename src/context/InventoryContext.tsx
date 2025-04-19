import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DbProduct } from '@/lib/supabase';

// ——— Helper: fetchProductImage ———
// Free & unlimited via Unsplash Source
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) {
    return `https://placehold.co/300x300?text=No+Product+Name`;
  }
  try {
    return `https://source.unsplash.com/300x300/?${encodeURIComponent(
      productName
    )}`;
  } catch (err) {
    console.error('Unsplash Source error:', err);
    return `https://placehold.co/300x300?text=${encodeURIComponent(
      productName
    )}`;
  }
};

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

// … (Shop & StockAlert types stay unchanged) …

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
  // … all your methods …
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'image'>
  ) => Promise<void>;
  // … rest unchanged …
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);
export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
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
  // … other state (shop type, alerts) …

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchBills()]);
      } catch (e) {
        console.error(e);
        setError('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ——— fetchProducts (demo mode + supabase) — unchanged ———
  const fetchProducts = async () => {
    // … your existing demo / supabase logic …
  };

  // ——— fetchBills — unchanged ———
  const fetchBills = async () => {
    // … your existing demo / supabase logic …
  };

  // … demo data generators …

  // ——— startNewBill, addToBill, removeFromBill, updateBillItem…  all unchanged …

  // ——— addProduct (MODIFIED) ———
  const addProduct = async (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'image'>
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'demo-user';
      const now = new Date().toISOString();

      // 1) fetch image
      const imageUrl = await fetchProductImage(product.name);

      // 2) build newProduct
      const newProduct: Product = {
        id: uuidv4(),
        ...product,
        image: imageUrl,
        createdAt: now,
        updatedAt: now,
        userId,
      };

      // 3) (demo) push locally, or in real app: supabase insert
      setProducts((prev) => [...prev, newProduct]);
      toast.success(`${product.name} added successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
      throw err;
    }
  };

  // ——— editProduct, updateProduct, deleteProduct, refetch…  unchanged ———

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        isLoading,
        error,
        currentBill,
        // … all other methods …
        addProduct,
        // … etc …
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
