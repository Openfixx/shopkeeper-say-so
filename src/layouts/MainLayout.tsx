
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
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
      </>
    } />
  );
};

export default MainLayout;
