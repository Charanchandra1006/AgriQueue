import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';

const GOVERNMENT_SCHEMES = [
  {
    id: 1,
    key: 'pmKisan',
    title: "PM-Kisan Samman Nidhi",
    categoryKey: 'directBenefit',
    category: "Direct Benefit",
    benefit: "₹6,000 yearly in 3 direct bank transfers of ₹2,000 each",
    eligibility: "Small and marginal farmers holding cultivable land in their name",
    status: "Active - Installment 19",
    badgeVariant: "success",
    desc: "Central government income support providing direct financial assistance to land-holding farmer families.",
    docKeys: ['doc1', 'doc2', 'doc3', 'doc4'],
    documents: [
      "Aadhaar Card",
      "Bank Account Passbook (Aadhaar-linked)",
      "Landholding Ownership Papers (Khatauni / RoR)",
      "Active Mobile Number (for e-KYC OTP)"
    ],
    applyUrl: "https://pmkisan.gov.in/RegistrationFormupdated.aspx",
    applyNote: "Official Govt Portal ↗",
    guidelinesUrl: "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf",
    officialWebsite: "https://pmkisan.gov.in/"
  },
  {
    id: 2,
    key: 'pmfby',
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    categoryKey: 'cropInsurance',
    category: "Crop Insurance",
    benefit: "Low-premium insurance coverage protecting against crop losses from natural calamities, flood, and drought",
    eligibility: "All farmers growing notified crops in notified areas (both loanee and non-loanee farmers)",
    status: "Kharif Booking Open",
    badgeVariant: "primary",
    desc: "Comprehensive crop insurance scheme safeguarding agricultural yield against unexpected weather hazards and pest outbreaks.",
    docKeys: ['doc1', 'doc2', 'doc3', 'doc4'],
    documents: [
      "Aadhaar Card",
      "Land Record (Khasra / Khatauni) or Tenancy Agreement",
      "Sowing Certificate from Village Revenue Officer / Patwari",
      "Bank Passbook photocopy / Cancelled Cheque"
    ],
    applyUrl: "https://pmfby.gov.in/farmerRegistrationForm",
    applyNote: "Official Govt Portal ↗",
    guidelinesUrl: "https://pmfby.gov.in/guidelines",
    officialWebsite: "https://pmfby.gov.in/"
  },
  {
    id: 3,
    key: 'smam',
    title: "Subsidized Tractor & Harvester Procurement (SMAM)",
    categoryKey: 'subsidies',
    category: "Subsidies",
    benefit: "Up to 50% government subsidy on tractors, rotavators, power tillers, and farm machinery",
    eligibility: "Farmers with registered land records; priority to small, marginal, SC/ST and women farmers",
    status: "Open - Limited Slots",
    badgeVariant: "warning",
    desc: "Agricultural mechanization program designed to subsidize high-capital equipment like tractors, seed drills, and harvesters.",
    docKeys: ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'],
    documents: [
      "Aadhaar Card & Voter ID",
      "Land Ownership Records (7/12 / 8A / Jamabandi copy)",
      "Bank Passbook photocopy",
      "Passport Size Photograph",
      "Caste Certificate (for SC/ST subsidy category)"
    ],
    applyUrl: "https://agrimachinery.nic.in/Index/Index",
    applyNote: "DBT Farm Machinery Portal ↗",
    guidelinesUrl: "https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf",
    officialWebsite: "https://agrimachinery.nic.in/"
  },
  {
    id: 4,
    key: 'pdmc',
    title: "Per Drop More Crop (PDMC)",
    categoryKey: 'irrigationTech',
    category: "Irrigation & Tech",
    benefit: "Up to 80% subsidy on Drip and Sprinkler micro-irrigation systems to maximize water efficiency",
    eligibility: "All land-owning farmers and registered cooperative farming societies with an assured water source",
    status: "Active",
    badgeVariant: "success",
    desc: "Program to enhance water use efficiency at the farm level through micro-irrigation systems, reducing costs and boosting yield.",
    docKeys: ['doc1', 'doc2', 'doc3', 'doc4'],
    documents: [
      "Aadhaar Card",
      "Land Ownership Records / Jamabandi",
      "Electricity Connection or Water Source Proof",
      "Bank Passbook copy"
    ],
    applyUrl: "https://pmksy.gov.in/",
    applyNote: "State DBT / PMKSY Portal ↗",
    guidelinesUrl: "https://pmksy.gov.in/microirrigation/Archive/Revised_PDMC_Operational_Guidelines2023.pdf",
    officialWebsite: "https://pmksy.gov.in/"
  }
];

const CATEGORIES = [
  { id: 'All', key: 'all' },
  { id: 'Direct Benefit', key: 'directBenefit' },
  { id: 'Crop Insurance', key: 'cropInsurance' },
  { id: 'Irrigation & Tech', key: 'irrigationTech' },
  { id: 'Subsidies', key: 'subsidies' }
];

export const Schemes = () => {
  const { t } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [portalNotice, setPortalNotice] = useState(null);

  const schemes = GOVERNMENT_SCHEMES;

  // Localized getters with English fallbacks
  const getSchemeCategory = useCallback((scheme) => {
    return t(`schemes.categories.${scheme.categoryKey}`, scheme.category);
  }, [t]);

  const getSchemeStatus = useCallback((scheme) => {
    return t(`schemes.items.${scheme.key}.status`, scheme.status);
  }, [t]);

  const getSchemeDesc = useCallback((scheme) => {
    return t(`schemes.items.${scheme.key}.desc`, scheme.desc);
  }, [t]);

  const getSchemeBenefit = useCallback((scheme) => {
    return t(`schemes.items.${scheme.key}.benefit`, scheme.benefit);
  }, [t]);

  const getSchemeEligibility = useCallback((scheme) => {
    return t(`schemes.items.${scheme.key}.eligibility`, scheme.eligibility);
  }, [t]);

  const getSchemeApplyNote = useCallback((scheme) => {
    return t(`schemes.items.${scheme.key}.applyNote`, scheme.applyNote);
  }, [t]);

  const getSchemeDocs = useCallback((scheme) => {
    if (scheme.docKeys && scheme.docKeys.length > 0) {
      return scheme.docKeys.map((docKey, idx) => {
        const fallback = scheme.documents[idx] || '';
        return t(`schemes.items.${scheme.key}.${docKey}`, fallback);
      });
    }
    return scheme.documents || [];
  }, [t]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const matchesCategory = activeCategory === 'All' || scheme.category === activeCategory;
      if (!matchesCategory) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      // Match against official scheme title, descriptions, benefits, eligibility, and documents
      const title = scheme.title.toLowerCase();
      const desc = `${getSchemeDesc(scheme)} ${scheme.desc}`.toLowerCase();
      const benefit = `${getSchemeBenefit(scheme)} ${scheme.benefit}`.toLowerCase();
      const eligibility = `${getSchemeEligibility(scheme)} ${scheme.eligibility}`.toLowerCase();
      const docs = getSchemeDocs(scheme).join(' ').toLowerCase();

      return title.includes(q) || desc.includes(q) || benefit.includes(q) || eligibility.includes(q) || docs.includes(q);
    });
  }, [schemes, activeCategory, searchQuery, getSchemeDesc, getSchemeBenefit, getSchemeEligibility, getSchemeDocs]);

  const handleApplyOnline = (scheme) => {
    if (scheme.applyUrl) {
      setPortalNotice(t('schemes.openingPortal', { name: scheme.title }));
      setTimeout(() => setPortalNotice(null), 5000);
      window.open(scheme.applyUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewGuidelines = (scheme) => {
    const url = scheme.guidelinesUrl || scheme.officialWebsite;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert(t('schemes.guidelinesAlert', "Official guidelines document is available from your local district agriculture office."));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl" role="img" aria-label="schemes">🏛️</span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
            {t('schemes.pageTitle', 'Government Schemes')}
          </h1>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {t('schemes.pageSubtitle', 'Explore official central and state government farmer benefits, direct transfers, and machinery subsidies.')}
        </p>
      </div>

      {/* Opening Portal Notification Banner */}
      {portalNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏛️</span>
            <span>{portalNotice}</span>
          </div>
          <button
            onClick={() => setPortalNotice(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
            aria-label={t('schemes.modal.close', 'Close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search and Category Filter Card */}
      <Card className="p-4 border-slate-200 shadow-2xs space-y-3 bg-white rounded-2xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('schemes.searchPlaceholder', 'Search schemes by name, benefit, or keyword...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              aria-label={t('schemes.clearSearch', 'Clear search')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 pt-1 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {t(`schemes.categories.${cat.key}`, cat.id)}
            </button>
          ))}
        </div>
      </Card>

      {/* Result Count Indicator */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500">
          {t('schemes.showingCount', { count: filteredSchemes.length, total: schemes.length })}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          {t('schemes.officialPrograms', 'Official Central & State Programs')}
        </span>
      </div>

      {/* Schemes List */}
      <div className="space-y-6">
        {filteredSchemes.length === 0 ? (
          <Card className="p-12 text-center bg-white border-slate-200 rounded-2xl">
            <div className="max-w-sm mx-auto space-y-2">
              <span className="text-3xl">🏛️</span>
              <p className="font-bold text-slate-800 text-base">
                {t('schemes.emptyTitle', 'No schemes match your search')}
              </p>
              <p className="text-xs text-slate-500">
                {t('schemes.emptyDesc', 'Try adjusting your category filter or search keywords.')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-2 text-xs font-bold cursor-pointer"
              >
                {t('schemes.resetFilters', 'Reset Filters')}
              </Button>
            </div>
          </Card>
        ) : (
          filteredSchemes.map((scheme) => (
            <Card
              key={scheme.id}
              className="border-slate-200 relative overflow-hidden bg-white shadow-2xs hover:border-slate-300 transition-all rounded-2xl"
            >
              {/* Corner highlight indicator */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600" />
              
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 p-2 sm:p-3">
                <div className="space-y-4 flex-1">
                  {/* Category & Status Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={scheme.badgeVariant}>
                      {getSchemeStatus(scheme)}
                    </Badge>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {getSchemeCategory(scheme)}
                    </span>
                  </div>
                  
                  {/* Scheme Name - Official scheme names such as PM-KISAN, PMFBY, SMAM, PDMC are kept untranslated */}
                  <div>
                    <h2 className="font-heading font-extrabold text-lg md:text-xl text-slate-900 tracking-tight flex items-center gap-2">
                      <span>🏛️</span>
                      <span>{scheme.title}</span>
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mt-1">
                      {getSchemeDesc(scheme)}
                    </p>
                  </div>

                  {/* 3 Clear Sections: Benefits, Eligibility, Documents Needed */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                    {/* 1. Key Benefits */}
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>💰</span>
                        <span>{t('schemes.keyBenefits', 'Key Benefits')}</span>
                      </span>
                      <p className="text-xs font-semibold text-slate-700 leading-snug pt-0.5 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{getSchemeBenefit(scheme)}</span>
                      </p>
                    </div>

                    {/* 2. Eligibility */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>👨‍🌾</span>
                        <span>{t('schemes.eligibility', 'Eligibility')}</span>
                      </span>
                      <p className="text-xs font-semibold text-slate-700 leading-snug pt-0.5 flex items-start gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{getSchemeEligibility(scheme)}</span>
                      </p>
                    </div>

                    {/* 3. Documents Needed */}
                    <div className="p-3.5 bg-amber-50/40 border border-amber-200/70 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📄</span>
                        <span>{t('schemes.documentsNeeded', 'Documents Needed')}</span>
                      </span>
                      {getSchemeDocs(scheme).length > 0 ? (
                        <ul className="space-y-1 pt-0.5">
                          {getSchemeDocs(scheme).map((doc, idx) => (
                            <li
                              key={idx}
                              className="text-xs font-semibold text-slate-700 flex items-start gap-1.5 leading-tight"
                            >
                              <span className="text-amber-600 font-bold leading-none select-none">•</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium italic pt-0.5">
                          {t('schemes.docInfoInGuidelines', 'Document information will be available from the official scheme guidelines.')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Apply Online, View Guidelines, View Details */}
                <div className="flex flex-col gap-2.5 shrink-0 w-full lg:w-48 pt-2 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-5">
                  {/* Apply Online Button */}
                  {scheme.applyUrl ? (
                    <div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-center text-xs font-bold shadow-xs py-2.5 flex items-center gap-1.5 cursor-pointer"
                        onClick={() => handleApplyOnline(scheme)}
                      >
                        <span>🟢 {t('schemes.applyOnline', 'Apply Online')}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <span className="block text-[10px] text-emerald-700 font-bold mt-1 text-center">
                        {getSchemeApplyNote(scheme)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled
                        className="w-full justify-center text-xs font-bold py-2.5 opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 border-none"
                      >
                        <span>🟢 {t('schemes.applyOnline', 'Apply Online')}</span>
                      </Button>
                      <span className="block text-[10px] text-amber-700 font-semibold mt-1 text-center">
                        {t('schemes.applicationNotAvailable', 'Official application link is not available yet.')}
                      </span>
                    </div>
                  )}

                  {/* View Guidelines Button */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 flex items-center gap-1.5 cursor-pointer"
                      onClick={() => handleViewGuidelines(scheme)}
                    >
                      <span>📘 {t('schemes.viewGuidelines', 'View Guidelines')}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <span className="block text-[10px] text-slate-400 font-medium mt-1 text-center">
                      {t('schemes.officialRulesAndEligibility', 'Official Rules & Eligibility')}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <span>📄 {t('schemes.viewDetails', 'View Details')}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Scheme Details Modal */}
      {selectedScheme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scheme-modal-title"
          onClick={() => setSelectedScheme(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏛️</span>
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                    {t('schemes.modal.title', 'Scheme Details')}
                  </span>
                </div>
                <h2 id="scheme-modal-title" className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
                  {selectedScheme.title}
                </h2>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={selectedScheme.badgeVariant}>
                    {getSchemeStatus(selectedScheme)}
                  </Badge>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {getSchemeCategory(selectedScheme)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                aria-label={t('schemes.modal.close', 'Close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-700">
              {/* Description */}
              <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                {getSchemeDesc(selectedScheme)}
              </p>

              {/* Benefits & Eligibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💰</span>
                    <span>{t('schemes.keyBenefits', 'Key Benefits')}</span>
                  </span>
                  <p className="text-xs font-semibold text-slate-700 leading-snug pt-1 flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{getSchemeBenefit(selectedScheme)}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👨‍🌾</span>
                    <span>{t('schemes.eligibility', 'Eligibility')}</span>
                  </span>
                  <p className="text-xs font-semibold text-slate-700 leading-snug pt-1 flex items-start gap-1.5">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{getSchemeEligibility(selectedScheme)}</span>
                  </p>
                </div>
              </div>

              {/* Documents Required */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2">
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📄</span>
                  <span>{t('schemes.documentsNeeded', 'Documents Needed')}</span>
                </span>
                <ul className="space-y-1.5 pt-0.5">
                  {getSchemeDocs(selectedScheme).map((doc, idx) => (
                    <li key={idx} className="text-xs font-semibold text-slate-700 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Apply Section */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📝</span>
                  <span>{t('schemes.modal.howToApply', 'How to Apply')}</span>
                </span>
                <ol className="space-y-1.5 text-xs font-medium text-slate-700 list-decimal list-inside">
                  <li>{t('schemes.modal.step1', 'Visit the official government portal using the Apply Online button below.')}</li>
                  <li>{t('schemes.modal.step2', 'Keep your Aadhaar, bank passbook, and land ownership records ready.')}</li>
                  <li>{t('schemes.modal.step3', 'Complete the farmer registration / application form and save your registration or reference number.')}</li>
                </ol>
              </div>

              {/* Important Info Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>ℹ️</span>
                  <span>{t('schemes.modal.importantInfo', 'Important Information')}</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('schemes.modal.importantNote', 'Applications are processed directly through central and state government departments. AgriQueue does not charge any fee for government schemes.')}
                </p>
                <div className="pt-1 text-[11px] text-slate-500 font-medium">
                  <span>{t('schemes.modal.officialNotice', 'Official Government Portal: You will be redirected to the secure portal at')} </span>
                  <a
                    href={selectedScheme.officialWebsite || selectedScheme.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline font-bold break-all"
                  >
                    {selectedScheme.officialWebsite || selectedScheme.applyUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedScheme(null)}
                className="text-xs font-bold cursor-pointer"
              >
                {t('schemes.modal.close', 'Close')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                onClick={() => handleViewGuidelines(selectedScheme)}
              >
                <span>📘 {t('schemes.viewGuidelines', 'View Guidelines')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Button>
              {selectedScheme.applyUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  onClick={() => handleApplyOnline(selectedScheme)}
                >
                  <span>🟢 {t('schemes.applyOnline', 'Apply Online')}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

