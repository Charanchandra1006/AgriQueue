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
          style={{ background: 'rgba(28, 31, 22, 0.55)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '272px',
          background: '#283618',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`fixed top-0 bottom-0 left-0 z-40 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Branding */}
        <div style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #DDA15E, #BC6C25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(188,108,37,0.4)',
              flexShrink: 0
            }}>
              <Sprout size={18} color="white" />
            </div>
            <div>
              <span style={{ 
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: '#FEFAE0',
                letterSpacing: '-0.02em'
              }}>
                Agri<span style={{ color: '#DDA15E' }}>Queue</span>
              </span>
              <div style={{ 
                fontSize: '0.58rem', 
                color: 'rgba(254,250,224,0.45)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '-1px'
              }}>
                Kisan Digital Portal
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden"
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(254,250,224,0.7)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem' }}>
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
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-sans)',
                    color: isActive ? '#FEFAE0' : 'rgba(254,250,224,0.6)',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(221,161,94,0.18) 0%, rgba(188,108,37,0.1) 100%)'
                      : 'transparent',
                    borderLeft: isActive ? '2.5px solid #DDA15E' : '2.5px solid transparent',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <item.Icon
                        size={17}
                        style={{ 
                          color: isActive ? '#DDA15E' : 'rgba(254,250,224,0.45)',
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
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => { onClose(); logout(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '10px',
              background: 'transparent',
              color: 'rgba(254,250,224,0.45)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '0.875rem',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220,80,60,0.12)';
              e.currentTarget.style.color = '#f4a090';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(254,250,224,0.45)';
            }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            <span>{t('common.logout')}</span>
          </button>

          {/* Bottom brand tagline */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0 0.5rem',
            fontSize: '0.6rem',
            color: 'rgba(254,250,224,0.2)',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            Powered by Google Gemini AI
          </div>
        </div>
      </aside>
    </>
  );
};
