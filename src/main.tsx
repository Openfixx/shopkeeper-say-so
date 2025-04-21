
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ui/theme-provider';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { LanguageProvider } from './context/LanguageContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <InventoryProvider>
          <LanguageProvider>
            <App />
            <SonnerToaster position="top-right" richColors />
            <Toaster />
          </LanguageProvider>
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
