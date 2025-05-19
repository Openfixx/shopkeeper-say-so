
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { ErrorBoundary } from 'react-error-boundary';
import HeaderVoiceControl from '@/components/ui-custom/HeaderVoiceControl';
import { useMediaQuery } from 'react-responsive'; // Using react-responsive instead of custom hook

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    setShowMobileNav(false);
  }, [location.pathname]);

  return (
    <div className={`h-screen flex flex-col ${isMobile ? 'overflow-hidden' : ''}`}>
      {/* No Header component since it's not available */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 bg-background">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <HeaderVoiceControl />
    </div>
  );
}

export default MainLayout;
