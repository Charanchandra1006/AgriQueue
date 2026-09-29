import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import {
  X,
  User,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit3,
  Save
} from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { profile, updateProfile, logout, language, setLanguage, t } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [state, setState] = useState(profile?.state || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [mandal, setMandal] = useState(profile?.mandal || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [selectedLang, setSelectedLang] = useState(profile?.preferredLanguage || language || 'en');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || '');
      setState(profile?.state || '');
      setDistrict(profile?.district || '');
      setMandal(profile?.mandal || '');
      setVillage(profile?.village || '');
      setSelectedLang(profile?.preferredLanguage || language || 'en');
      setIsEditing(false);
      setNotification(null);
    }
  }, [isOpen, profile, language]);

  if (!isOpen) return null;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    try {
      updateProfile({
        name,
        state,
        district,
        mandal,
        village,
        preferredLanguage: selectedLang
      });
      if (selectedLang !== language) {
        setLanguage(selectedLang);
      }
      setIsEditing(false);
      setNotification({ type: 'success', message: t('profile.updateSuccess') });
    } catch {
      setNotification({ type: 'error', message: t('profile.updateError') });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-100 text-primary-700 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-slate-800 tracking-tight">
                {t('profile.title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('profile.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t('profile.kisanId')}
                  </span>
                  <span className="font-mono font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {profile?.farmerId || t('nav.noId')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase block text-[10px]">
                      {t('profile.farmerName')}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                      {profile?.name || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase block text-[10px]">
                      {t('profile.phone')}
                    </span>
                    <span className="font-semibold text-slate-700 text-sm mt-0.5 block">
                      {profile?.phone || '—'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="font-bold text-slate-400 uppercase block text-[10px]">
                      {t('common.village')} / {t('common.mandal')}
                    </span>
                    <span className="font-semibold text-slate-700 block mt-0.5">
                      {profile?.village || '—'}, {profile?.mandal || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase block text-[10px]">
                      {t('common.district')} / {t('common.state')}
                    </span>
                    <span className="font-semibold text-slate-700 block mt-0.5">
                      {profile?.district || '—'}, {profile?.state || '—'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">
                    {t('profile.preferredLanguage')}
                  </span>
                  <span className="font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-lg">
                    {languages.find(l => l.code === language)?.label || 'English'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  className="flex-1 justify-center py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1.5" />
                  {t('profile.editProfile')}
                </Button>
                <Button
                  variant="outline"
                  className="py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('profile.farmerName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.state')}
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.district')}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.mandal')}
                  </label>
                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.village')}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('profile.preferredLanguage')}
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800 cursor-pointer"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 justify-center py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {t('profile.saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="py-2.5 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
