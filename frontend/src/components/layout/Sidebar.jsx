import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { X, Sprout, LayoutDashboard, Map, Building2, TrendingUp, FileText, Truck, HelpCircle, LogOut } from 'lucide-react';

const navItems = [
  { name: 'dashboard',     path: '/',              Icon: LayoutDashboard },
  { name: 'mandiMap',      path: '/mandi-map',     Icon: Map             },
  { name: 'mandiCenters',  path: '/mandi-centers', Icon: Building2       },
  { name: 'marketPrices',  path: '/market-prices', Icon: TrendingUp      },
  { name: 'schemes',       path: '/schemes',        Icon: FileText        },
  { name: 'bookTransport', path: '/book-transport', Icon: Truck           },
  { name: 'help',          path: '/help',           Icon: HelpCircle      },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { t, logout } = useApp();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(28, 31, 22, 0.4)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '230px',
          background: '#fffef8',
          borderRight: '1.5px solid #e6dfc5',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`fixed top-0 left-0 z-40 h-screen md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Branding */}
        <div style={{ 
          padding: '1.25rem 1.25rem',
          borderBottom: '1px solid #e6dfc5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #606C38, #283618)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(40,54,24,0.15)',
              flexShrink: 0
            }}>
              <Sprout size={16} color="white" />
            </div>
            <div>
              <span style={{ 
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#283618',
                letterSpacing: '-0.02em'
              }}>
                Agri<span style={{ color: '#BC6C25' }}>Queue</span>
              </span>
              <div style={{ 
                fontSize: '0.55rem', 
                color: '#8a7d60',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '-2px'
              }}>
                Kisan Digital Portal
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex md:hidden items-center justify-center p-[6px] rounded-lg border-none cursor-pointer transition-colors bg-transparent hover:bg-[rgba(96,108,56,0.06)] text-[#606C38]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-sans)',
                    color: isActive ? '#283618' : '#5c6245',
                    background: isActive 
                      ? 'rgba(96,108,56,0.08)'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #606C38' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  })}
                  onMouseEnter={e => {
                    if (!e.currentTarget.style.background.includes('rgba(96, 108, 56, 0.08)')) {
                      e.currentTarget.style.background = 'rgba(230,223,197,0.3)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.background.includes('rgba(96, 108, 56, 0.08)')) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <item.Icon
                        size={15}
                        style={{ 
                          color: isActive ? '#606C38' : '#a09472',
                          flexShrink: 0,
                          transition: 'color 0.15s'
                        }}
                      />
                      <span>{t(`common.${item.name}`)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout at bottom */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #e6dfc5' }}>
          <button
            onClick={() => { onClose(); logout(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              background: 'transparent',
              color: '#5c6245',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '0.8rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(188,76,53,0.06)';
              e.currentTarget.style.color = '#bc4c35';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5c6245';
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            <span>{t('common.logout')}</span>
          </button>

          {/* Bottom brand tagline */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0 0.5rem',
            fontSize: '0.6rem',
            color: '#a09472',
            fontWeight: 500,
            letterSpacing: '0.02em',
            textAlign: 'center'
          }}>
            AgriQueue — Digital Procurement
          </div>
        </div>
      </aside>
    </>
  );
};
