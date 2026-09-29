import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  Globe,
  ChevronDown,
  User,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { ProfileModal } from '../profile/ProfileModal';

export const Navbar = ({ onMenuToggle }) => {
  const {
    language,
    setLanguage,
    profile,
    notifications,
    unreadCount,
    markAllNotificationsAsRead,
    logout,
    t
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' }
  ];

  const getLanguageLabel = (code) => {
    return languages.find(l => l.code === code)?.label || 'English';
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-[72px] px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-slate-100">
        {/* Mobile Toggle & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Welcome Text */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-400">{t('nav.welcome')},</p>
            <p className="font-heading font-bold text-slate-800 -mt-0.5">{profile.name}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsNotifOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-semibold cursor-pointer border border-slate-100"
            >
              <Globe className="h-4.5 w-4.5 text-slate-400" />
              <span className="hidden md:inline">{getLanguageLabel(language)}</span>
              <span className="md:hidden uppercase">{language}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-3 duration-200">
                  <span className="block px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    {t('nav.changeLanguage')}
                  </span>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left font-medium cursor-pointer ${
                        language === lang.code
                          ? 'text-primary-600 bg-primary-50/50'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && <ShieldCheck className="h-4 w-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsLangOpen(false);
                setIsProfileOpen(false);
              }}
              className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 cursor-pointer border border-slate-100"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="font-heading font-semibold text-slate-800">{t('nav.notifications')}</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead()}
                        className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>{t('nav.markAllRead')}</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        {t('nav.noNotifications')}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 transition-colors ${
                            notif.read ? 'bg-white' : 'bg-primary-50/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-semibold text-sm ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notif.titleKey ? t(notif.titleKey) : notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsLangOpen(false);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-2.5 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{profile.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {profile.farmerId || t('nav.noId')}
                </p>
              </div>
              {profile.avatarUrl && !profile.avatarUrl.includes('unsplash.com') ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || 'Farmer Profile'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-heading font-extrabold text-xs shadow-xs ring-2 ring-emerald-500/20 shrink-0">
                  {getInitials(profile?.name) || <User className="h-4 w-4 text-white" />}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-2">
                    <p className="font-heading font-bold text-slate-800 text-base">{profile.name}</p>
                    <p className="text-xs text-slate-400 font-semibold">{profile.phone}</p>
                    <p className="text-[11px] text-primary-600 font-extrabold mt-0.5">
                      {t('nav.farmerId')}: {profile.farmerId || t('nav.noId')}
                    </p>
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('nav.location')}</p>
                      <p className="text-xs font-semibold text-slate-700">{profile.village}, {profile.district}, {profile.state}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{t('nav.myProfile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>{t('nav.settings')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer border-t border-slate-50 mt-1.5 pt-2.5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Farmer Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
