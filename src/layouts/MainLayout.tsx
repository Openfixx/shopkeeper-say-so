
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import VoiceCommandButton from '@/components/ui-custom/VoiceCommandButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <Layout children={
      <>
        <Outlet />
        {children}
        {isMobile && (
          <div className="fixed bottom-4 right-4 z-50">
            <VoiceCommandButton />
          </div>
        )}
      </>
    } />
  );
};

export default MainLayout;
