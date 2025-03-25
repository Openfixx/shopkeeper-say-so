import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { InventoryProvider } from '@/context/InventoryContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Inventory from '@/pages/Inventory';
import Products from '@/pages/Products';
import AddProduct from '@/pages/AddProduct';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import ShopFinder from '@/pages/ShopFinder';

// Import new components
import Reports from '@/pages/Reports';
import NearbyShops from '@/pages/NearbyShops';
import { LanguageProvider } from '@/context/LanguageContext';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <InventoryProvider>
            <ThemeProvider defaultTheme="light" storageKey="ui-theme">
              <Toaster position="top-right" expand={false} richColors />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="inventory" element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  } />
                  <Route path="products" element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  } />
                  <Route path="products/add" element={
                    <ProtectedRoute>
                      <AddProduct />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="billing" element={
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="shop-finder" element={
                    <ProtectedRoute>
                      <ShopFinder />
                    </ProtectedRoute>
                  } />
                  <Route path="nearby-shops" element={<NearbyShops />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </ThemeProvider>
          </InventoryProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
