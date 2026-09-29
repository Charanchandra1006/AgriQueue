import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f6f8f6]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Dynamic Nested Route Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="py-6 px-4 md:px-8 border-t border-slate-100 text-center bg-white text-xs font-semibold text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <p>© 2026 AgriQueue. Digitizing India's Agricultural Procurement Chain.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
