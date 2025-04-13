
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Index'; // Using Index.tsx which contains the Dashboard component
import Inventory from '@/pages/Inventory';
import Products from '@/pages/Products';
import Reports from '@/pages/Reports';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import AddProduct from '@/pages/AddProduct';
import EditProduct from '@/pages/EditProduct';
import ShopFinder from '@/pages/ShopFinder';
import NearbyShops from '@/pages/NearbyShops';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="inventory-pro-theme">
        <LanguageProvider>
          <AuthProvider>
            <InventoryProvider>
              <Toaster position="top-right" richColors />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/add" element={<AddProduct />} />
                  <Route path="/products/edit/:id" element={<EditProduct />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/shop-finder" element={<ShopFinder />} />
                  <Route path="/nearby-shops" element={<NearbyShops />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </InventoryProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
