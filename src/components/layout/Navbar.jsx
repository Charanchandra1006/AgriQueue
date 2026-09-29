import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu, Bell, Globe, ChevronDown, User, LogOut, Settings, ShieldCheck, CheckCheck
} from 'lucide-react';
import { ProfileModal } from '../profile/ProfileModal';

export const Navbar = ({ onMenuToggle }) => {
  const {
    language, setLanguage, profile, notifications,
    unreadCount, markAllNotificationsAsRead, logout, t
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'te', label: 'తెలుగు' },
  ];

  const getLangLabel = (code) => languages.find(l => l.code === code)?.label || 'EN';

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    height: '72px',
    background: 'rgba(255, 254, 248, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1.5px solid #e6dfc5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    boxShadow: '0 1px 8px 0 rgba(40, 54, 24, 0.06)',
  };

  const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    background: '#fffef8',
    border: '1.5px solid #e6dfc5',
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(40, 54, 24, 0.12)',
    zIndex: 50,
    overflow: 'hidden',
    animation: 'fadeUp 0.2s ease forwards',
  };

  const iconBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '10px',
    background: 'transparent',
    border: '1.5px solid #e6dfc5',
    color: '#606C38',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  };

  return (
    <>
      <header style={headerStyle}>
        {/* Left: Menu + Welcome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onMenuToggle}
            className="md:hidden"
            style={{ ...iconBtnStyle, border: 'none', background: 'transparent' }}
            aria-label="Toggle Menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden sm:block">
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#a09472', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('nav.welcome')}
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#283618', marginTop: '-1px' }}>
              {profile.name}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setIsLangOpen(!isLangOpen); setIsNotifOpen(false); setIsProfileOpen(false); }}
              style={{
                ...iconBtnStyle,
                gap: '0.375rem',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#606C38',
              }}
            >
              <Globe size={15} style={{ color: '#DDA15E' }} />
              <span className="hidden sm:inline">{getLangLabel(language)}</span>
              <span className="sm:hidden" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{language}</span>
              <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: isLangOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                <div style={{ ...dropdownStyle, width: '180px' }} className="z-50">
                  <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.62rem', fontWeight: 700, color: '#a09472', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Language
                  </div>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '0.625rem 1rem',
                        background: language === lang.code ? 'rgba(96,108,56,0.08)' : 'transparent',
                        color: language === lang.code ? '#283618' : '#5c6245',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', fontWeight: language === lang.code ? 700 : 500,
                        fontSize: '0.85rem', textAlign: 'left',
                        transition: 'background 0.12s'
                      }}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && <ShieldCheck size={14} style={{ color: '#606C38' }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setIsNotifOpen(!isNotifOpen); setIsLangOpen(false); setIsProfileOpen(false); }}
              style={{ ...iconBtnStyle }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#BC6C25', color: 'white',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #fffef8'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <div style={{ ...dropdownStyle, width: '340px', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="z-50">
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderBottom: '1.5px solid #e6dfc5',
                    background: 'rgba(254,250,224,0.5)'
                  }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#283618', fontSize: '0.9rem' }}>
                      {t('nav.notifications')}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.72rem', fontWeight: 700, color: '#606C38',
                          background: 'none', border: 'none', cursor: 'pointer'
                        }}
                      >
                        <CheckCheck size={13} />
                        {t('nav.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#a09472', fontSize: '0.82rem', fontWeight: 500 }}>
                        🌾 {t('nav.noNotifications')}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          style={{
                            padding: '0.875rem 1rem',
                            borderBottom: '1px solid #f0e8d0',
                            background: notif.read ? 'transparent' : 'rgba(221,161,94,0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#283618' }}>
                              {notif.titleKey ? t(notif.titleKey) : notif.title}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#a09472', whiteSpace: 'nowrap' }}>{notif.time}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#5c6245', marginTop: '2px', lineHeight: '1.4' }}>
                            {notif.messageKey ? t(notif.messageKey) : notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsLangOpen(false); setIsNotifOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '5px 10px 5px 5px',
                borderRadius: '12px',
                border: '1.5px solid #e6dfc5',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #606C38, #283618)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sans)',
                fontWeight: 800, fontSize: '0.72rem',
                flexShrink: 0
              }}>
                {getInitials(profile?.name) || <User size={15} />}
              </div>
              <div className="hidden md:block" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#283618' }}>{profile.name}</p>
                <p style={{ fontSize: '0.62rem', color: '#a09472', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {profile.farmerId || 'Farmer'}
                </p>
              </div>
              <ChevronDown size={13} style={{ color: '#a09472', transition: 'transform 0.2s', transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div style={{ ...dropdownStyle, width: '250px' }} className="z-50">
                  {/* Profile header */}
                  <div style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1.5px solid #e6dfc5',
                    background: 'rgba(254,250,224,0.5)'
                  }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: '#283618' }}>
                      {profile.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#a09472', fontWeight: 600, marginTop: '1px' }}>{profile.phone}</p>
                    <span style={{ 
                      display: 'inline-block', marginTop: '6px',
                      background: 'rgba(96,108,56,0.1)', color: '#606C38',
                      border: '1px solid rgba(96,108,56,0.2)',
                      borderRadius: '999px', padding: '2px 8px',
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em'
                    }}>
                      {t('nav.farmerId')}: {profile.farmerId || '—'}
                    </span>
                    <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(254,250,224,0.8)', borderRadius: '8px', border: '1px solid #e6dfc5' }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</p>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#283618', marginTop: '2px' }}>
                        {[profile.village, profile.district, profile.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {[
                    { label: t('nav.myProfile'), Icon: User },
                    { label: t('nav.settings'), Icon: Settings },
                  ].map(({ label, Icon }) => (
                    <button
                      key={label}
                      onClick={() => { setIsProfileOpen(false); setIsProfileModalOpen(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        width: '100%', padding: '0.625rem 1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#5c6245', fontFamily: 'var(--font-sans)',
                        fontWeight: 500, fontSize: '0.85rem', textAlign: 'left',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,108,56,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Icon size={15} style={{ color: '#a09472' }} />
                      <span>{label}</span>
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #e6dfc5' }}>
                    <button
                      onClick={() => { setIsProfileOpen(false); logout(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        width: '100%', padding: '0.625rem 1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#bc4c35', fontFamily: 'var(--font-sans)',
                        fontWeight: 600, fontSize: '0.85rem', textAlign: 'left',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(188,76,53,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={15} />
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};
