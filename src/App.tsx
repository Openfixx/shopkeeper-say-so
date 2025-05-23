
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { InventoryProvider } from './context/InventoryContext';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import ProductDetail from './pages/ProductDetail';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <InventoryProvider>
          <Router>
            <Toaster richColors closeButton position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <MainLayout>
                  <Routes>
                    <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="products/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                    <Route path="products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
                    <Route path="products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                    <Route path="billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  </Routes>
                </MainLayout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
