import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { DbProduct } from '@/lib/supabase';

// ——— Free image helper ———
const fetchProductImage = async (productName: string): Promise<string> => {
  if (!productName) {
    return 'https://placehold.co/300x300?text=No+Name';
  }
  const q = productName.replace(/(kg|g|ml|l)\b/gi, '').trim();
  return `https://source.unsplash.com/300x300/?${encodeURIComponent(q)}`;
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

// … BillItem, Bill, Shop, StockAlert types unchanged …

interface InventoryContextType {
  products: Product[];
  bills: Bill[];
  isLoading: boolean;
  error: string | null;
  currentBill: { id: string; items: BillItem[]; total: number } | null;
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'image'>
  ) => Promise<void>;
  // … all your other methods unchanged …
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
    // … your existing demo + Supabase logic …
  };

  const fetchBills = async () => {
    // … your existing demo + Supabase logic …
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

  // … keep all your other methods exactly as they were …

  return (
    <InventoryContext.Provider
      value={{
        products,
        bills,
        isLoading,
        error,
        currentBill,
        addProduct,
        // … plus all your other methods …
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
