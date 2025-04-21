
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Layout from '@/components/layout/Layout';
import EnhancedLogin from '@/pages/EnhancedLogin';
import AuthCallback from '@/pages/AuthCallback';
import ModernRegister from '@/pages/ModernRegister';
import Dashboard from '@/pages/Index';
import Inventory from '@/pages/Inventory';
import Products from '@/pages/Products';
import Reports from '@/pages/Reports';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import { AddProductForm } from '@/components/AddProductForm';
import EditProduct from '@/pages/EditProduct';
import NotFound from '@/pages/NotFound';
import PosPage from '@/pages/pos';
import ProtectedRoute from '@/components/ProtectedRoute';
import BulkInventory from '@/pages/BulkInventory';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="apni-dukaan-theme">
        <LanguageProvider>
          <AuthProvider>
            <InventoryProvider>
              <Toaster position="top-right" richColors />
              <Routes>
                <Route path="/login" element={<EnhancedLogin />} />
                <Route path="/register" element={<ModernRegister />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/add" element={<AddProductForm />} />
                  <Route path="/products/edit/:id" element={<EditProduct />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/pos" element={<PosPage />} />
                  <Route path="/bulk-inventory" element={<BulkInventory />} />
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
