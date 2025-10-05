import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

const LayoutContent: React.FC = () => {
  const { isOpen, close } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-automotive-light flex flex-col">
      <Navbar />
      <div className="flex flex-1 relative pt-16"> {/* Add padding-top to account for navbar */}
        {/* Mobile overlay */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={close}
          />
        )}
        
        <div className="fixed top-16 left-0 bottom-0 z-30">
          <Sidebar />
        </div>
        
        <main className="flex-1 min-w-0 lg:ml-64 transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 sm:p-4 md:p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};