
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Index from './pages/Index';
import Products from './pages/Products';
import BulkInventory from './pages/BulkInventory';
import AuthCallback from './pages/AuthCallback';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes for better performance
const AddProduct = React.lazy(() => import('./pages/AddProduct'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ShopFinder = React.lazy(() => import('./pages/ShopFinder'));

// Loading fallback for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return user ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          
          <Route path="/products/add" element={
            <Suspense fallback={<LoadingFallback />}>
              <AddProduct />
            </Suspense>
          } />
          
          <Route path="/inventory" element={
            <Suspense fallback={<LoadingFallback />}>
              <Inventory />
            </Suspense>
          } />
          
          <Route path="/bulk-inventory" element={<BulkInventory />} />
          
          <Route path="/reports" element={
            <Suspense fallback={<LoadingFallback />}>
              <Reports />
            </Suspense>
          } />
          
          <Route path="/billing" element={
            <Suspense fallback={<LoadingFallback />}>
              <Billing />
            </Suspense>
          } />
          
          <Route path="/settings" element={
            <Suspense fallback={<LoadingFallback />}>
              <Settings />
            </Suspense>
          } />
          
          <Route path="/shop-finder" element={
            <Suspense fallback={<LoadingFallback />}>
              <ShopFinder />
            </Suspense>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
