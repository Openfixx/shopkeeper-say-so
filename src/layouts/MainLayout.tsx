
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { ErrorBoundary } from 'react-error-boundary';
import HeaderVoiceControl from '@/components/ui-custom/HeaderVoiceControl';
import { useMediaQuery } from 'react-responsive'; // Using react-responsive instead of custom hook

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    // On mobile, close sidebar when navigating
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className={`h-screen flex flex-col ${isMobile ? 'overflow-hidden' : ''}`}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          open={showSidebar} 
          setOpen={setShowSidebar} 
        />
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
