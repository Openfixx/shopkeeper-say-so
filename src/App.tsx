// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Layout from '@/components/layout/Layout';
import EnhancedLogin from '@/pages/EnhancedLogin';
import ModernRegister from '@/pages/ModernRegister';
import Dashboard from '@/pages/Index';
import Inventory from '@/pages/Inventory';
import Products from '@/pages/Products';
import Reports from '@/pages/Reports';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
// ← NEW: import your form here
import { AddProductForm } from '@/components/AddProductForm';
// ← you can remove this if you’re no longer using the old page
// import AddProduct from '@/pages/AddProduct';
import EditProduct from '@/pages/EditProduct';
import ShopFinder from '@/pages/ShopFinder';
import NearbyShops from '@/pages/NearbyShops';
import NotFound from '@/pages/NotFound';
import PosPage from '@/pages/pos';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="bolt-inventory-theme">
        <LanguageProvider>
          <AuthProvider>
            <InventoryProvider>
              <Toaster position="top-right" richColors />
              <Routes>
                <Route path="/login" element={<EnhancedLogin />} />
                <Route path="/register" element={<ModernRegister />} />
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/products" element={<Products />} />

                  {/* ← CHANGED: render AddProductForm instead of the old AddProduct page */}
                  <Route path="/products/add" element={<AddProductForm />} />

                  <Route path="/products/edit/:id" element={<EditProduct />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/shop-finder" element={<ShopFinder />} />
                  <Route path="/nearby-shops" element={<NearbyShops />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/pos" element={<PosPage />} />
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
