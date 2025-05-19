import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import HeaderVoiceControl from '@/components/ui-custom/HeaderVoiceControl';

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    setShowMobileNav(false);
  }, [location.pathname]);

  return (
    <div className={`h-screen flex flex-col ${isMobile ? 'overflow-hidden' : ''}`}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 bg-background">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <HeaderVoiceControl />
    </div>
  );
}

export default MainLayout;
