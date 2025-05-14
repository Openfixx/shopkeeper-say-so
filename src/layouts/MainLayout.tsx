
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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
