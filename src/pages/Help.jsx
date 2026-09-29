import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  Ticket,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';

/**
 * FUTURE AI AGENT ARCHITECTURE NOTE:
 * This support module is structured to accommodate an autonomous agent triage pipeline:
 *  1. Farmer initiates WhatsApp click-to-chat with structured contextual metadata.
 *  2. WhatsApp Business Cloud Webhook / Ingestion service captures the message payload.
 *  3. AI Support Agent identifies Category, Token ID, and Mandi ID to answer simple queries.
 *  4. High-friction issues (scale disputes, payment > 72h) automatically route to Human Admin.
 *
 * CURRENT PRODUCTION FLOW:
 *  Farmer → WhatsApp (wa.me) → AgriQueue Human Admin Coordinator.
 */

// 5 Main Farmer-Friendly Problem Categories (IDs preserved for stable state and translation keys)
const PROBLEM_CATEGORIES = [
  {
    id: 'token',
    icon: '',
    subProblemIds: [
      'token_not_showing',
      'qr_not_scanning',
      'queue_turn_problem',
      'booking_problem'
    ]
  },
  {
    id: 'mandi',
    icon: '',
    subProblemIds: [
      'mandi_closed',
      'procurement_problem',
      'weighing_problem',
      'other_mandi_issue'
    ]
  },
  {
    id: 'transport',
    icon: '',
    subProblemIds: [
      'driver_not_arrived',
      'driver_cancelled',
      'crop_not_picked_up',
      'other_transport_issue'
    ]
  },
  {
    id: 'payment',
    icon: '',
    subProblemIds: [
      'payment_delayed',
      'payment_discrepancy',
      'other_payment_issue'
    ]
  },
  {
    id: 'other',
    icon: '',
    subProblemIds: []
  }
];

// 7 Farmer-friendly FAQ indices mapped to localized faqs array in i18n
const FAQ_INDICES = [0, 1, 2, 3, 4, 5, 6];

export const Help = () => {
  const navigate = useNavigate();
  const { profile, activeBooking, activeTransport, t } = useApp();

  // Selected Problem State (Defaults to first category for instant clarity)
  const [selectedCategoryId, setSelectedCategoryId] = useState('token');
  const [selectedSubProblemId, setSelectedSubProblemId] = useState('token_not_showing');
  const [shortDescription, setShortDescription] = useState('');
  const [faqOpenIdx, setFaqOpenIdx] = useState(null);

  // Active Category Object
  const currentCategory = PROBLEM_CATEGORIES.find(c => c.id === selectedCategoryId) || PROBLEM_CATEGORIES[0];

  // Handle Category Click
  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const cat = PROBLEM_CATEGORIES.find(c => c.id === categoryId);
    if (cat && cat.subProblemIds.length > 0) {
      setSelectedSubProblemId(cat.subProblemIds[0]);
    } else {
      setSelectedSubProblemId(null);
    }
  };

  // Build the WhatsApp Click-to-Chat URL
  const buildWhatsAppUrl = () => {
    // Read admin number from Vite environment configuration
    // Sanitized: digits only, no spaces, hyphens, brackets, or plus signs
    const rawNumber = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    // Construct the structured pre-filled message
    const lines = [
      'Hello AgriQueue Help,',
      ''
    ];

    if (profile?.farmerId) {
      lines.push(`Farmer ID: ${profile.farmerId}`);
    }
    if (profile?.name) {
      lines.push(`Farmer Name: ${profile.name}`);
    }

    if (currentCategory) {
      lines.push(`Problem: ${t(`help.categories.${currentCategory.id}`) || currentCategory.id}`);
    }

    if (selectedSubProblemId) {
      lines.push(`Issue: ${t(`help.subProblems.${selectedSubProblemId}`) || selectedSubProblemId}`);
    }

    // Active Mandi and Token Information
    const mandiName = profile?.mandiName || activeBooking?.mandi?.name;
    const token = profile?.activeToken || activeBooking?.tokenNumber;
    const bookingId = profile?.activeBookingId || activeBooking?.bookingId;

    if (mandiName) {
      lines.push(`Mandi: ${mandiName}`);
    }
    if (token) {
      lines.push(`Token: ${token}`);
    }
    if (bookingId) {
      lines.push(`Booking ID: ${bookingId}`);
    }

    // Transport info if relevant
    const transportId = activeTransport?.transportBookingId || activeTransport?.id;
    const transportStatus = activeTransport?.status;
    if (transportId && (currentCategory.id === 'transport' || transportStatus)) {
      lines.push(`Transport Booking ID: ${transportId}${transportStatus ? ` (${transportStatus})` : ''}`);
    }

    // Short farmer-entered description if provided
    if (shortDescription.trim()) {
      lines.push('');
      lines.push(`My problem: ${shortDescription.trim()}`);
    }

    lines.push('');
    lines.push('Please help me.');

    const prefilledText = lines.join('\n');
    const encodedText = encodeURIComponent(prefilledText);

    // Official wa.me Click-to-Chat URL
    if (cleanNumber) {
      return `https://wa.me/${cleanNumber}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

  const handleWhatsAppClick = () => {
    const url = buildWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Active Token / Booking reference
  const activeTokenNumber = profile?.activeToken || activeBooking?.tokenNumber;
  const activeMandiName = profile?.mandiName || activeBooking?.mandi?.name;
  const activeSlotDisplay = profile?.slotTime || (activeBooking?.slot ? `${activeBooking.slot.displayDate}, ${activeBooking.slot.formattedTime}` : null);
  const activeCropName = profile?.crop || activeBooking?.cropName;

  // Active Guidance Text
  const activeGuidanceKey = selectedSubProblemId || currentCategory.id;
  const guidanceText = t(`help.guidance.${activeGuidanceKey}`);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-7 w-7 text-primary-600" />
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
            {t('help.title')}
          </h1>
        </div>
        <p className="text-sm font-medium text-slate-600 mt-1">
          {t('help.subtitle')}
        </p>
      </div>

      {/* Active Token Assistance Banner (Visible when user has an active booking) */}
      {activeTokenNumber && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 border-emerald-300 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {t('help.activeBookingAttached')}
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {t('help.tokenAtMandi', {
                    token: activeTokenNumber,
                    mandi: activeMandiName || t('help.mandiLabel')
                  })}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('help.reservedForSlot', {
                    slot: activeSlotDisplay || t('help.scheduledSlot'),
                    crop: activeCropName ? `(${activeCropName})` : ''
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                onClick={() => navigate('/')}
              >
                {t('help.viewOnDashboard')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Tap-Friendly Problem Categories, Guidance & WhatsApp Support */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: 🆘 HOW CAN WE HELP YOU? */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-extrabold text-lg md:text-xl text-slate-850 flex items-center gap-2">
                    <span>🆘</span> {t('help.howCanWeHelp')}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('help.howCanWeHelpSub')}
                  </p>
                </div>
                <span className="hidden sm:inline-flex text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {t('help.noTypingRequired')}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* 5 Main Problem Categories */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  {t('help.step1SelectCategory')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {PROBLEM_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    const catName = t(`help.categories.${cat.id}`);
                    const catDesc = t(`help.categories.${cat.id}Desc`);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between min-h-[96px] ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2">
                          <h3 className={`text-xs sm:text-sm font-extrabold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {catName}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {catDesc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Problems Selection for chosen category */}
              {currentCategory.subProblemIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    {t('help.step2ChooseIssue')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentCategory.subProblemIds.map((subId) => {
                      const isSubSelected = selectedSubProblemId === subId;
                      const subLabel = t(`help.subProblems.${subId}`);
                      return (
                        <button
                          key={subId}
                          type="button"
                          onClick={() => setSelectedSubProblemId(subId)}
                          className={`p-3 rounded-xl border text-left font-bold text-xs transition-all duration-150 cursor-pointer flex items-center justify-between min-h-[46px] ${
                            isSubSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span>{subLabel}</span>
                          <ArrowRight className={`h-3.5 w-3.5 shrink-0 ml-2 ${isSubSelected ? 'text-white' : 'text-slate-400'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short Description text field: Only for "Other Problem" or optional extra notes */}
              {selectedCategoryId === 'other' && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('help.shortDescLabel')}
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder={t('help.shortDescPlaceholder')}
                    maxLength={140}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    {t('help.shortDescHelp')}
                  </p>
                </div>
              )}

              {/* Instant Plain-Language Guidance Message */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                  <Info className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>{t('help.immediateGuidanceTitle')}</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {guidanceText}
                </p>
              </div>

              {/* Context Summary Preview Before WhatsApp Click */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>{t('help.attachedToMessage')}</span>
                  <span className="text-emerald-700 font-semibold">{t('help.automatic')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700 font-medium">
                  <div>
                    <span className="text-slate-400">{t('help.farmerLabel')}</span>{' '}
                    <strong className="text-slate-900 font-semibold">{profile?.name || t('help.registeredFarmer')}</strong>
                    {profile?.farmerId ? ` (${profile.farmerId})` : ''}
                  </div>
                  <div>
                    <span className="text-slate-400">{t('help.selectedIssueLabel')}</span>{' '}
                    <strong className="text-slate-900 font-semibold">
                      {selectedSubProblemId ? t(`help.subProblems.${selectedSubProblemId}`) : t(`help.categories.${currentCategory.id}`)}
                    </strong>
                  </div>
                  {activeMandiName && (
                    <div>
                      <span className="text-slate-400">{t('help.mandiLabel')}</span>{' '}
                      <strong className="text-slate-900 font-semibold">{activeMandiName}</strong>
                    </div>
                  )}
                  {activeTokenNumber && (
                    <div>
                      <span className="text-slate-400">{t('help.activeTokenLabel')}</span>{' '}
                      <strong className="text-emerald-800 font-mono font-bold">{activeTokenNumber}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2:  CHAT WITH AGRIQUEUE ADMIN ON WHATSAPP */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="w-full py-3.5 px-6 rounded-2xl font-heading font-extrabold text-sm sm:text-base text-white shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] border-none ring-4 ring-[#25D366]/20"
                >
                  <MessageSquare className="h-5 w-5 fill-current" />
                  <span> {t('help.chatOnWhatsApp')}</span>
                </button>
                <p className="text-center text-[11px] text-slate-400 font-medium mt-2">
                  {t('help.whatsAppDisclaimer')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Helpline Numbers & Quick Mandi Services */}
        <div className="space-y-6">
          {/* SECTION 4:  FARMER HELPLINE NUMBERS */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary-600" />
                <h2 className="font-heading font-extrabold text-slate-850 text-base md:text-lg">
                   {t('help.farmerHelplineTitle')}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('help.helplineSubtitle')}
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Government of India Kisan Call Centre (Official) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ️ {t('help.govtKisanBadge')}
                  </span>
                </div>

                {/* Number 1: 1800-180-1551 */}
                <a
                  href="tel:18001801551"
                  className="group block p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-600 transition-all text-left shadow-2xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600">
                        {t('help.kisan24x7')}
                      </span>
                      <span className="font-heading font-black text-emerald-800 text-lg sm:text-xl block tracking-tight">
                         1800-180-1551
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {t('help.kisanCallSub')}
                      </span>
                    </div>
                  </div>
                </a>

                {/* Number 2: 1551 */}
                <a
                  href="tel:1551"
                  className="group block p-3.5 rounded-xl border-2 border-blue-500/40 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-600 transition-all text-left shadow-2xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600">
                        {t('help.kisanShortCode')}
                      </span>
                      <span className="font-heading font-black text-blue-800 text-lg sm:text-xl block tracking-tight">
                         1551
                      </span>
                      <span className="text-[10px] text-blue-700 font-semibold block">
                        {t('help.kisanShortSub')}
                      </span>
                    </div>
                  </div>
                </a>
              </div>

              {/* AgriQueue Platform Support (Explicitly distinguished from Government) */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded block">
                  ️ {t('help.agriQueueDeskTitle')}
                </span>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('help.agriQueueDeskDesc')}
                </p>

                {/* Support Email */}
                <a
                  href="mailto:support@agriqueue.gov.in"
                  className="group block p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-800 rounded-lg shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('help.supportEmail')}
                      </span>
                      <span className="font-heading font-bold text-slate-800 text-xs block font-mono">
                        support@agriqueue.gov.in
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {t('help.emailResponseTime')}
                      </span>
                    </div>
                  </div>
                </a>

                {/* Direct WhatsApp Quick Card */}
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="w-full group p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-400 transition-all text-left cursor-pointer flex items-center gap-3"
                >
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      {t('help.adminWhatsAppTitle')}
                    </span>
                    <span className="font-heading font-bold text-emerald-900 text-xs block">
                      {t('help.chatCoordinator')}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {t('help.fastResponseNotice')}
                    </span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links to Mandi Services */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-2.5">
            <h3 className="font-heading font-bold text-slate-500 text-xs uppercase tracking-wider">
              {t('help.procurementServicesTitle')}
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/mandi-centers')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-300 transition-colors flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
              >
                <span> {t('help.browseMandisBtn')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/book-slot')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-300 transition-colors flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
              >
                <span> {t('help.bookSlotBtn')}</span>
                <Calendar className="h-3.5 w-3.5 text-primary-600" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 5:  FREQUENTLY ASKED QUESTIONS (Below main support actions) */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-base md:text-lg">
              {t('help.faqsTitle')}
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('help.faqsSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {FAQ_INDICES.map((idx) => {
            const isOpen = faqOpenIdx === idx;
            return (
              <div key={idx} className="py-3.5 first:pt-2 last:pb-1">
                <button
                  type="button"
                  onClick={() => setFaqOpenIdx(isOpen ? null : idx)}
                  className="flex items-center justify-between w-full text-left font-bold text-slate-800 text-sm md:text-base cursor-pointer hover:text-primary-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-primary-600 font-black">Q{idx + 1}.</span>
                    <span>{t(`help.faqs.${idx}.q`)}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-2.5 pl-6 animate-in fade-in slide-in-from-top-1 duration-150">
                    {t(`help.faqs.${idx}.a`)}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

