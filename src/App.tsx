
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ShopFinder from "./pages/ShopFinder";
import NotFound from "./pages/NotFound";

// For animation libraries
import { motion, AnimatePresence } from "framer-motion";

// Create the query client
const queryClient = new QueryClient();

// Check if Supabase environment variables are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const App = () => {
  const [envMissing, setEnvMissing] = useState(false);

  useEffect(() => {
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      setEnvMissing(true);
      console.warn(
        "Supabase credentials missing. Using demo mode instead."
      );
    }
  }, []);

  // Don't show the error screen, instead use the application with mock data
  // This allows users to use the app without setting up Supabase
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <InventoryProvider>
            <Toaster />
            <Sonner position="top-right" closeButton />
            {envMissing && (
              <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 text-amber-800 p-2 text-sm text-center">
                Running in demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file for full functionality.
              </div>
            )}
            <BrowserRouter>
              <Layout>
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/add" element={<AddProduct />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/shop-finder" element={<ShopFinder />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
              </Layout>
            </BrowserRouter>
          </InventoryProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
