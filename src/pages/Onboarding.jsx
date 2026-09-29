import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Globe, User, Phone, MapPin, Check, Key, ChevronRight, Sprout, ArrowRight } from 'lucide-react';
import { locationData } from '../mock/locationData';
import { getFarmer } from '../services/api';

/* -------------------------------------------------------
   Onboarding — Rustic Copper Harvest Design
   Steps: 1-Welcome  2-Language  3-Phone  4-OTP  5-Profile
   ------------------------------------------------------- */

const localT = {
  en: {
    welcomeTitle: "Welcome to AgriQueue",
    welcomeSubtitle: "Your digital companion for smarter farming and easier mandi procurement.",
    benefit1: "Find verified mandi centers near you",
    benefit2: "Book a digital procurement slot",
    benefit3: "Access government farming services",
    getStarted: "Get Started",
    chooseLanguage: "Choose Your Language",
    chooseLanguageSub: "Select the language you're most comfortable with.",
    continue: "Continue",
    loginTitle: "Login to AgriQueue",
    loginSubtitle: "Enter your registered mobile number to continue.",
    phoneLabel: "Mobile Number (10 digits)",
    phonePlaceholder: "e.g. 9876543210",
    sendOtp: "Send OTP",
    demoOtpNotice: "Demo OTP: 123456",
    verifyTitle: "Verify Your Number",
    verifySubtitle: "Enter the 6-digit OTP sent to your mobile.",
    otpLabel: "6-Digit OTP",
    otpPlaceholder: "Enter 6-digit code",
    verifyOtp: "Verify OTP",
    changePhone: "Change Number",
    profileTitle: "Farmer Profile",
    profileSubtitle: "Tell us about yourself so we can serve you better.",
    nameLabel: "Your Name",
    namePlaceholder: "Enter your full name",
    stateLabel: "State",
    districtLabel: "District",
    villageLabel: "Village / Town",
    villagePlaceholder: "Enter your village or town",
    completeBtn: "Complete Registration",
    backBtn: "Back",
    errPhoneInvalid: "Enter a valid 10-digit Indian mobile number.",
    errOtpInvalid: "Invalid OTP. Please enter the demo code 123456.",
    errNameRequired: "Your name is required.",
    errStateRequired: "Please select a state.",
    errDistrictRequired: "Please select a district.",
    errVillageRequired: "Village or town is required.",
  },
  hi: {
    welcomeTitle: "AgriQueue में आपका स्वागत है",
    welcomeSubtitle: "स्मार्ट खेती और आसान मंडी खरीद के लिए आपका डिजिटल साथी।",
    benefit1: "नजदीकी मंडियां खोजें",
    benefit2: "डिजिटल स्लॉट बुक करें",
    benefit3: "सरकारी योजनाओं का लाभ उठाएं",
    getStarted: "शुरू करें",
    chooseLanguage: "अपनी भाषा चुनें",
    chooseLanguageSub: "आगे बढ़ने के लिए एक भाषा चुनें।",
    continue: "जारी रखें",
    loginTitle: "लॉगिन करें",
    loginSubtitle: "अपना पंजीकृत मोबाइल नंबर दर्ज करें।",
    phoneLabel: "मोबाइल नंबर (10 अंक)",
    phonePlaceholder: "जैसे: 9876543210",
    sendOtp: "ओटीपी भेजें",
    demoOtpNotice: "डेमो ओटीपी: 123456",
    verifyTitle: "नंबर सत्यापित करें",
    verifySubtitle: "6-अंकीय ओटीपी दर्ज करें।",
    otpLabel: "6-अंकीय ओटीपी",
    otpPlaceholder: "6-अंकीय कोड",
    verifyOtp: "ओटीपी सत्यापित करें",
    changePhone: "नंबर बदलें",
    profileTitle: "किसान प्रोफाइल",
    profileSubtitle: "आपकी जानकारी दर्ज करें।",
    nameLabel: "किसान का नाम",
    namePlaceholder: "पूरा नाम दर्ज करें",
    stateLabel: "राज्य",
    districtLabel: "जिला",
    villageLabel: "गांव",
    villagePlaceholder: "गांव का नाम",
    completeBtn: "पंजीकरण पूरा करें",
    backBtn: "वापस",
    errPhoneInvalid: "सही मोबाइल नंबर दर्ज करें।",
    errOtpInvalid: "गलत ओटीपी। डेमो कोड 123456 दर्ज करें।",
    errNameRequired: "नाम आवश्यक है।",
    errStateRequired: "राज्य चुनें।",
    errDistrictRequired: "जिला चुनें।",
    errVillageRequired: "गांव आवश्यक है।",
  },
  pa: {
    welcomeTitle: "AgriQueue ਵਿੱਚ ਸੁਆਗਤ ਹੈ",
    welcomeSubtitle: "ਸਮਾਰਟ ਖੇਤੀ ਲਈ ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਸਾਥੀ।",
    benefit1: "ਨੇੜਲੀਆਂ ਮੰਡੀਆਂ ਲੱਭੋ",
    benefit2: "ਡਿਜੀਟਲ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
    benefit3: "ਸਰਕਾਰੀ ਸੇਵਾਵਾਂ ਦਾ ਲਾਭ ਲਓ",
    getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
    chooseLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    chooseLanguageSub: "ਅੱਗੇ ਵਧਣ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।",
    continue: "ਜਾਰੀ ਰੱਖੋ",
    loginTitle: "ਲਾਗਇਨ ਕਰੋ",
    loginSubtitle: "ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।",
    phoneLabel: "ਮੋਬਾਈਲ ਨੰਬਰ",
    phonePlaceholder: "ਜਿਵੇਂ: 9876543210",
    sendOtp: "ਓਟੀਪੀ ਭੇਜੋ",
    demoOtpNotice: "ਡੈਮੋ ਓਟੀਪੀ: 123456",
    verifyTitle: "ਨੰਬਰ ਪੁਸ਼ਟੀ ਕਰੋ",
    verifySubtitle: "6-ਅੰਕੀ ਓਟੀਪੀ ਦਰਜ ਕਰੋ।",
    otpLabel: "6-ਅੰਕੀ ਓਟੀਪੀ",
    otpPlaceholder: "6-ਅੰਕੀ ਕੋਡ",
    verifyOtp: "ਓਟੀਪੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    changePhone: "ਨੰਬਰ ਬਦਲੋ",
    profileTitle: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
    profileSubtitle: "ਆਪਣੀ ਜਾਣਕਾਰੀ ਦਰਜ ਕਰੋ।",
    nameLabel: "ਕਿਸਾਨ ਦਾ ਨਾਮ",
    namePlaceholder: "ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    stateLabel: "ਸੂਬਾ",
    districtLabel: "ਜ਼ਿਲ੍ਹਾ",
    villageLabel: "ਪਿੰਡ",
    villagePlaceholder: "ਪਿੰਡ ਦਾ ਨਾਮ",
    completeBtn: "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ",
    backBtn: "ਪਿੱਛੇ",
    errPhoneInvalid: "ਸਹੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।",
    errOtpInvalid: "ਗਲਤ ਓਟੀਪੀ। ਡੈਮੋ ਕੋਡ 123456 ਦਰਜ ਕਰੋ।",
    errNameRequired: "ਨਾਮ ਲੋੜੀਂਦਾ ਹੈ।",
    errStateRequired: "ਸੂਬਾ ਚੁਣੋ।",
    errDistrictRequired: "ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ।",
    errVillageRequired: "ਪਿੰਡ ਲੋੜੀਂਦਾ ਹੈ।",
  },
  te: {
    welcomeTitle: "AgriQueue కి స్వాగతం",
    welcomeSubtitle: "స్మార్ట్ వ్యవసాయం కోసం మీ డిజిటల్ తోడు.",
    benefit1: "సమీప మండీలను కనుగొనండి",
    benefit2: "డిజిటల్ స్లాట్ బుక్ చేసుకోండి",
    benefit3: "ప్రభుత్వ పథకాలు పొందండి",
    getStarted: "ప్రారంభించండి",
    chooseLanguage: "భాషను ఎంచుకోండి",
    chooseLanguageSub: "కొనసాగడానికి భాషను ఎంచుకోండి.",
    continue: "కొనసాగించండి",
    loginTitle: "లాగిన్ అవ్వండి",
    loginSubtitle: "మీ మొబైల్ సంఖ్యను నమోదు చేయండి.",
    phoneLabel: "మొబైల్ సంఖ్య",
    phonePlaceholder: "ఉదా: 9876543210",
    sendOtp: "OTP పంపండి",
    demoOtpNotice: "డెమో OTP: 123456",
    verifyTitle: "సంఖ్యను ధృవీకరించండి",
    verifySubtitle: "6-అంకెల OTPని నమోదు చేయండి.",
    otpLabel: "6-అంకెల OTP",
    otpPlaceholder: "6-అంకెల కోడ్",
    verifyOtp: "OTP ధృవీకరించండి",
    changePhone: "సంఖ్య మార్చండి",
    profileTitle: "రైతు ప్రొఫైల్",
    profileSubtitle: "మీ వివరాలను నమోదు చేయండి.",
    nameLabel: "రైతు పేరు",
    namePlaceholder: "పూర్తి పేరు",
    stateLabel: "రాష్ట్రం",
    districtLabel: "జిల్లా",
    villageLabel: "గ్రామం",
    villagePlaceholder: "గ్రామం పేరు",
    completeBtn: "నమోదును పూర్తి చేయండి",
    backBtn: "వెనుకకు",
    errPhoneInvalid: "సరైన మొబైల్ సంఖ్యను నమోదు చేయండి.",
    errOtpInvalid: "తప్పు OTP. డెమో కోడ్ 123456 నమోదు చేయండి.",
    errNameRequired: "పేరు తప్పనిసరి.",
    errStateRequired: "రాష్ట్రం ఎంచుకోండి.",
    errDistrictRequired: "జిల్లా ఎంచుకోండి.",
    errVillageRequired: "గ్రామం తప్పనిసరి.",
  }
};

const languages = [
  { code: 'en', label: 'English',   sub: 'English'  },
  { code: 'hi', label: 'हिन्दी',    sub: 'Hindi'    },
  { code: 'pa', label: 'ਪੰਜਾਬੀ',  sub: 'Punjabi'  },
  { code: 'te', label: 'తెలుగు',   sub: 'Telugu'   },
];

/* Shared input style */
const inputStyle = (hasError) => ({
  width: '100%',
  background: 'rgba(255, 254, 248, 0.95)',
  border: `1.5px solid ${hasError ? '#c0392b' : '#d4c9a8'}`,
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  color: '#1c1f16',
  outline: 'none',
  transition: 'all 0.15s ease',
});

const labelStyle = {
  display: 'block',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: '#8a7d60',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

export const Onboarding = () => {
  const {
    language, setLanguage, isProfileCompleted,
    completeRegistration, loginSession, profile, t
  } = useApp();

  const [step, setStep] = useState(() => isProfileCompleted ? 3 : 1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(isProfileCompleted ? (profile?.phone || '') : '');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [otp, setOtp] = useState('');

  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const stateRef = useRef(null);
  const districtRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getT = (key) => {
    const dict = localT[language] || localT.en;
    return dict[key] || localT.en[key] || key;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stateRef.current && !stateRef.current.contains(e.target)) setIsStateOpen(false);
      if (districtRef.current && !districtRef.current.contains(e.target)) setIsDistrictOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statesList = Object.keys(locationData);
  const filteredStates = statesList.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  const districtsList = state ? (locationData[state] || []) : [];
  const filteredDistricts = districtsList.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()));

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrors({ phone: getT('errPhoneInvalid') });
      return;
    }
    setErrors({});
    setStep(4);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp !== '123456') {
      setErrors({ otp: getT('errOtpInvalid') });
      return;
    }
    setErrors({});
    try {
      const existing = await getFarmer(phone);
      if (existing.success && existing.data) {
        await loginSession(existing.data, phone);
        return;
      }
    } catch (_) {}
    if (isProfileCompleted && profile?.phone === phone && profile?.farmerId) {
      await loginSession(profile, phone);
    } else {
      setStep(5);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = getT('errNameRequired');
    if (!state.trim()) errs.state = getT('errStateRequired');
    if (!district.trim()) errs.district = getT('errDistrictRequired');
    if (!village.trim()) errs.village = getT('errVillageRequired');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);
    try {
      await completeRegistration({ name, phone, state, district, village });
    } catch (_) {
    } finally {
      setIsSubmitting(false);
    }
  };

  /* === Card shell === */
  const cardStyle = {
    background: '#fffef8',
    borderRadius: '20px',
    border: '1.5px solid #e0d8be',
    boxShadow: '0 8px 40px rgba(40, 54, 24, 0.10), 0 2px 8px rgba(40, 54, 24, 0.06)',
    overflow: 'hidden',
    animation: 'fadeUp 0.35s ease forwards',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FEFAE0 0%, #f5edcc 40%, #ede0b8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,108,56,0.08) 0%, transparent 70%)',
        top: '-150px', right: '-100px', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(188,108,37,0.07) 0%, transparent 70%)',
        bottom: '-100px', left: '-80px', pointerEvents: 'none'
      }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.75rem', animation: 'fadeIn 0.4s ease forwards' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #DDA15E, #BC6C25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(188,108,37,0.3)',
        }}>
          <Sprout size={22} color="white" />
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.45rem', color: '#283618', letterSpacing: '-0.02em' }}>
            Agri<span style={{ color: '#BC6C25' }}>Queue</span>
          </span>
          <div style={{ fontSize: '0.58rem', color: '#8a7d60', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-2px' }}>
            Kisan Digital Portal
          </div>
        </div>
      </div>

      {/* Step progress dots */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
        {[1,2,3,4,5].map(s => (
          <div key={s} style={{
            width: s === step ? '24px' : '7px', height: '7px',
            borderRadius: '999px',
            background: s < step ? '#606C38' : s === step ? '#BC6C25' : '#d4c9a8',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* ——— STEP 1: WELCOME ——— */}
        {step === 1 && (
          <div style={cardStyle}>
            {/* Copper hero band */}
            <div style={{
              background: 'linear-gradient(135deg, #283618 0%, #606C38 100%)',
              padding: '2rem 2rem 1.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌾</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', color: '#FEFAE0', margin: 0, lineHeight: 1.25 }}>
                {getT('welcomeTitle')}
              </h1>
              <p style={{ color: 'rgba(254,250,224,0.7)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                {getT('welcomeSubtitle')}
              </p>
            </div>

            <div style={{ padding: '1.5rem 1.75rem 2rem' }}>
              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
                {[
                  { icon: '🗺️', text: getT('benefit1') },
                  { icon: '🎫', text: getT('benefit2') },
                  { icon: '📋', text: getT('benefit3') },
                ].map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 0.875rem',
                    background: 'rgba(96,108,56,0.06)',
                    border: '1px solid rgba(96,108,56,0.12)',
                    borderRadius: '12px',
                    animation: `fadeUp ${0.3 + i * 0.08}s ease forwards`,
                    opacity: 0,
                    animationFillMode: 'forwards',
                  }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{b.icon}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4424', lineHeight: 1.4 }}>{b.text}</span>
                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#a09472', flexShrink: 0 }} />
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={() => setStep(2)}
                style={{ width: '100%', minHeight: '52px', fontSize: '0.95rem', borderRadius: '12px' }}
              >
                {getT('getStarted')}
                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </Button>
            </div>
          </div>
        )}

        {/* ——— STEP 2: LANGUAGE ——— */}
        {step === 2 && (
          <div style={cardStyle}>
            <div style={{ padding: '1.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(96,108,56,0.12), rgba(96,108,56,0.06))',
                  border: '1.5px solid rgba(96,108,56,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Globe size={22} style={{ color: '#606C38' }} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: '#283618', margin: 0 }}>
                  {getT('chooseLanguage')}
                </h1>
                <p style={{ color: '#8a7d60', fontSize: '0.82rem', marginTop: '0.375rem' }}>
                  {getT('chooseLanguageSub')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.5rem' }}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      padding: '1rem 0.75rem',
                      borderRadius: '12px',
                      border: language === lang.code ? '2px solid #606C38' : '1.5px solid #e0d8be',
                      background: language === lang.code ? 'rgba(96,108,56,0.09)' : 'rgba(255,254,248,0.8)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700, fontSize: '1rem',
                      color: language === lang.code ? '#283618' : '#5c6245',
                    }}>{lang.label}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#a09472' }}>{lang.sub}</span>
                    {language === lang.code && (
                      <div style={{
                        marginTop: '4px', width: '20px', height: '20px', borderRadius: '50%',
                        background: '#606C38', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <Button variant="outline" onClick={() => setStep(1)} style={{ flex: 1, minHeight: '48px' }}>
                  {getT('backBtn')}
                </Button>
                <Button variant="primary" onClick={() => setStep(3)} style={{ flex: 1, minHeight: '48px' }}>
                  {getT('continue')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ——— STEP 3: PHONE ——— */}
        {step === 3 && (
          <div style={cardStyle}>
            <div style={{ padding: '1.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(188,108,37,0.12), rgba(188,108,37,0.06))',
                  border: '1.5px solid rgba(188,108,37,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Phone size={22} style={{ color: '#BC6C25' }} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: '#283618', margin: 0 }}>
                  {getT('loginTitle')}
                </h1>
                <p style={{ color: '#8a7d60', fontSize: '0.82rem', marginTop: '0.375rem' }}>
                  {getT('loginSubtitle')}
                </p>
              </div>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{getT('phoneLabel')}</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a09472' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={getT('phonePlaceholder')}
                      style={{ ...inputStyle(!!errors.phone), paddingLeft: '2.25rem' }}
                      onFocus={e => { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = errors.phone ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {errors.phone && <p style={{ color: '#c0392b', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>{errors.phone}</p>}
                </div>

                {/* Demo hint */}
                <div style={{
                  background: 'rgba(221,161,94,0.12)',
                  border: '1px solid rgba(221,161,94,0.3)',
                  borderRadius: '10px',
                  padding: '0.625rem 0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7c5020' }}>{getT('demoOtpNotice')}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                  <Button type="button" variant="outline" onClick={() => setStep(2)} style={{ flex: 1, minHeight: '48px' }}>
                    {getT('backBtn')}
                  </Button>
                  <Button type="submit" variant="primary" style={{ flex: 1, minHeight: '48px' }}>
                    {getT('sendOtp')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ——— STEP 4: OTP ——— */}
        {step === 4 && (
          <div style={cardStyle}>
            <div style={{ padding: '1.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'rgba(96,108,56,0.1)',
                  border: '1.5px solid rgba(96,108,56,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Key size={22} style={{ color: '#606C38' }} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: '#283618', margin: 0 }}>
                  {getT('verifyTitle')}
                </h1>
                <p style={{ color: '#8a7d60', fontSize: '0.82rem', marginTop: '0.375rem' }}>
                  {getT('verifySubtitle')}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{getT('otpLabel')}</label>
                  <input
                    type="tel"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={getT('otpPlaceholder')}
                    style={{
                      ...inputStyle(!!errors.otp),
                      textAlign: 'center',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.35em',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = errors.otp ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                  />
                  {errors.otp && <p style={{ color: '#c0392b', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', textAlign: 'center' }}>{errors.otp}</p>}
                </div>

                <div style={{
                  background: 'rgba(221,161,94,0.12)', border: '1px solid rgba(221,161,94,0.3)',
                  borderRadius: '10px', padding: '0.625rem 0.875rem', textAlign: 'center',
                  fontSize: '0.78rem', fontWeight: 600, color: '#7c5020',
                }}>
                  {getT('demoOtpNotice')}
                </div>

                <Button type="submit" variant="primary" style={{ width: '100%', minHeight: '50px' }}>
                  {getT('verifyOtp')}
                </Button>
                <Button
                  type="button" variant="outline"
                  onClick={() => { setOtp(''); setErrors({}); setStep(3); }}
                  style={{ width: '100%', minHeight: '46px' }}
                >
                  {getT('changePhone')}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ——— STEP 5: PROFILE ——— */}
        {step === 5 && (
          <div style={cardStyle}>
            <div style={{
              background: 'linear-gradient(135deg, #283618 0%, #606C38 100%)',
              padding: '1.25rem 1.75rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <User size={18} color="rgba(254,250,224,0.8)" />
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: '#FEFAE0', margin: 0 }}>
                  {getT('profileTitle')}
                </h1>
                <p style={{ color: 'rgba(254,250,224,0.6)', fontSize: '0.75rem', margin: 0, marginTop: '2px' }}>
                  {getT('profileSubtitle')}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>{getT('nameLabel')} *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a09472' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={getT('namePlaceholder')}
                    style={{ ...inputStyle(!!errors.name), paddingLeft: '2.25rem' }}
                    onFocus={e => { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = errors.name ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.name && <p style={{ color: '#c0392b', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>{errors.name}</p>}
              </div>

              {/* State & District */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* State */}
                <div ref={stateRef} style={{ position: 'relative' }}>
                  <label style={labelStyle}>{getT('stateLabel')} *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a09472' }} />
                    <input
                      type="text"
                      value={stateSearch}
                      onClick={() => setIsStateOpen(true)}
                      onChange={e => { setStateSearch(e.target.value); setIsStateOpen(true); if (!e.target.value) { setState(''); setDistrict(''); setDistrictSearch(''); } }}
                      placeholder="Search..."
                      style={{ ...inputStyle(!!errors.state), paddingLeft: '1.875rem', fontSize: '0.8rem' }}
                      onFocus={e => { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; setIsStateOpen(true); }}
                      onBlur={e => { e.target.style.borderColor = errors.state ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {isStateOpen && (
                    <div style={{
                      position: 'absolute', zIndex: 50, width: '100%', top: 'calc(100% + 4px)',
                      maxHeight: '200px', overflowY: 'auto',
                      background: '#fffef8', border: '1.5px solid #e0d8be',
                      borderRadius: '12px', boxShadow: '0 8px 24px rgba(40,54,24,0.12)',
                    }}>
                      {filteredStates.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#a09472' }}>No results</div>
                      ) : filteredStates.map(st => (
                        <button key={st} type="button" onClick={() => { setState(st); setStateSearch(st); setIsStateOpen(false); setDistrict(''); setDistrictSearch(''); setErrors(p => ({ ...p, state: '' })); }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            width: '100%', padding: '0.6rem 0.875rem',
                            background: state === st ? 'rgba(96,108,56,0.08)' : 'transparent',
                            border: 'none', cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: state === st ? 700 : 500,
                            color: state === st ? '#283618' : '#5c6245',
                            textAlign: 'left', transition: 'background 0.1s'
                          }}>
                          <span>{st}</span>
                          {state === st && <Check size={13} style={{ color: '#606C38' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.state && <p style={{ color: '#c0392b', fontSize: '0.68rem', fontWeight: 600, marginTop: '3px' }}>{errors.state}</p>}
                </div>

                {/* District */}
                <div ref={districtRef} style={{ position: 'relative' }}>
                  <label style={labelStyle}>{getT('districtLabel')} *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a09472' }} />
                    <input
                      type="text"
                      disabled={!state}
                      value={state ? districtSearch : ''}
                      onClick={() => state && setIsDistrictOpen(true)}
                      onChange={e => { setDistrictSearch(e.target.value); setIsDistrictOpen(true); if (!e.target.value) setDistrict(''); }}
                      placeholder={state ? 'Search...' : 'Select state first'}
                      style={{ ...inputStyle(!!errors.district), paddingLeft: '1.875rem', fontSize: '0.8rem', opacity: !state ? 0.5 : 1, cursor: !state ? 'not-allowed' : 'text' }}
                      onFocus={e => { if (state) { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; setIsDistrictOpen(true); } }}
                      onBlur={e => { e.target.style.borderColor = errors.district ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {state && isDistrictOpen && (
                    <div style={{
                      position: 'absolute', zIndex: 50, width: '100%', top: 'calc(100% + 4px)',
                      maxHeight: '200px', overflowY: 'auto',
                      background: '#fffef8', border: '1.5px solid #e0d8be',
                      borderRadius: '12px', boxShadow: '0 8px 24px rgba(40,54,24,0.12)',
                    }}>
                      {filteredDistricts.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#a09472' }}>No results</div>
                      ) : filteredDistricts.map(dst => (
                        <button key={dst} type="button" onClick={() => { setDistrict(dst); setDistrictSearch(dst); setIsDistrictOpen(false); setErrors(p => ({ ...p, district: '' })); }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            width: '100%', padding: '0.6rem 0.875rem',
                            background: district === dst ? 'rgba(96,108,56,0.08)' : 'transparent',
                            border: 'none', cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: district === dst ? 700 : 500,
                            color: district === dst ? '#283618' : '#5c6245',
                            textAlign: 'left', transition: 'background 0.1s'
                          }}>
                          <span>{dst}</span>
                          {district === dst && <Check size={13} style={{ color: '#606C38' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.district && <p style={{ color: '#c0392b', fontSize: '0.68rem', fontWeight: 600, marginTop: '3px' }}>{errors.district}</p>}
                </div>
              </div>

              {/* Village */}
              <div>
                <label style={labelStyle}>{getT('villageLabel')} *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a09472' }} />
                  <input
                    type="text"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    placeholder={getT('villagePlaceholder')}
                    style={{ ...inputStyle(!!errors.village), paddingLeft: '2.25rem' }}
                    onFocus={e => { e.target.style.borderColor = '#606C38'; e.target.style.boxShadow = '0 0 0 3px rgba(96,108,56,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = errors.village ? '#c0392b' : '#d4c9a8'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.village && <p style={{ color: '#c0392b', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>{errors.village}</p>}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                <Button type="button" variant="outline" onClick={() => setStep(4)} style={{ flex: '0 0 auto', minWidth: '90px', minHeight: '48px' }}>
                  {getT('backBtn')}
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} style={{ flex: 1, minHeight: '50px', fontSize: '0.9rem' }}>
                  {isSubmitting ? '...' : getT('completeBtn')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Bottom trust note */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: '#a09472', fontWeight: 500 }}>
          Your data is private and never shared · Digital tokens are free
        </p>
      </div>
    </div>
  );
};
