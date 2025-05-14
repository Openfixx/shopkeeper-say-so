
import React, { useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 w-full">
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
            isSidebarOpen ? "md:ml-64" : "md:ml-0"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="page-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-screen"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
