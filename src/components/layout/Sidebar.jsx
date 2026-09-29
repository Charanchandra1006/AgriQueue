import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { X, Sprout } from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { t, logout } = useApp();

  const navItems = [
    { name: t('common.dashboard'), path: '/', emoji: '🏠' },
    { name: t('common.mandiMap'), path: '/mandi-map', emoji: '🗺️' },
    { name: t('common.mandiCenters'), path: '/mandi-centers', emoji: '🏪' },
    { name: t('common.marketPrices'), path: '/market-prices', emoji: '💰' },
    { name: t('common.schemes'), path: '/schemes', emoji: '📋' },
    { name: t('common.bookTransport'), path: '/book-transport', emoji: '🚜' },
    { name: t('common.help'), path: '/help', emoji: '🆘' },
    { name: t('common.logout'), action: 'logout', emoji: '🚪' },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 ${
      isActive
        ? 'bg-primary-600 text-white font-semibold shadow-xs shadow-primary-500/10'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-600 rounded-lg text-white">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-800">
                Agri<span className="text-primary-600">Queue</span>
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path || item.action}>
                {item.action === 'logout' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer text-left"
                  >
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={item.name}>
                      {item.emoji}
                    </span>
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <NavLink to={item.path} className={linkClass} onClick={onClose}>
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={item.name}>
                      {item.emoji}
                    </span>
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  );
};
