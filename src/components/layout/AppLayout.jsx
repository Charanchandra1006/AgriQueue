import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useState } from 'react';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto page-enter">
          <Outlet />
        </main>

        {/* Footer */}
        <footer style={{ 
          borderTop: '1.5px solid #e6dfc5', 
          background: 'rgba(255, 254, 248, 0.95)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontWeight: 700,
                color: '#606C38',
                fontSize: '0.9rem'
              }}>
                Agri<span style={{ color: '#BC6C25' }}>Queue</span>
              </span>
              <span style={{ color: '#c3b98a', fontSize: '0.7rem' }}>•</span>
              <span style={{ color: '#8a7d60', fontSize: '0.7rem', fontWeight: 600 }}>
                Digitizing India's Agricultural Procurement Chain
              </span>
            </div>
            <span style={{ color: '#a09472', fontSize: '0.68rem', fontWeight: 500 }}>
               2026 AgriQueue. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
