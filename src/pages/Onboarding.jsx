import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Sprout, Globe, User, Phone, MapPin, Check, Key } from 'lucide-react';
import { locationData } from '../mock/locationData';
import { getFarmer } from '../services/api';

export const Onboarding = () => {
  const { 
    language, 
    setLanguage, 
    isProfileCompleted, 
    completeRegistration, 
    loginSession, 
    profile,
    t
  } = useApp();

  // Decide initial step based on whether the farmer registration already exists.
  const [step, setStep] = useState(() => {
    return isProfileCompleted ? 3 : 1;
  });

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(isProfileCompleted ? (profile?.phone || '') : '');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [otp, setOtp] = useState('');

  // Dropdown combobox states
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);

  // References for click-outside triggers
  const stateRef = useRef(null);
  const districtRef = useRef(null);

  // Error states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languages = [
    { code: 'en', label: 'English', sub: 'English' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
    { code: 'te', label: 'తెలుగు', sub: 'Telugu' }
  ];

  // Simple localized translations for onboarding controls
  const localT = {
    en: {
      appName: "AgriQueue",
      welcomeTitle: "Welcome to AgriQueue",
      welcomeSubtitle: "Your digital companion for smarter farming and easier mandi procurement.",
      benefit1: "Find nearby mandis",
      benefit2: "Book a procurement slot",
      benefit3: "Access farmer services",
      getStarted: "Get Started",
      chooseLanguage: "Choose Your Language",
      chooseLanguageSub: "Select a language to proceed.",
      continue: "Continue",
      loginTitle: "Login to AgriQueue",
      loginSubtitle: "Enter your registered mobile number to proceed.",
      phoneLabel: "Mobile Number (10 digits)",
      phonePlaceholder: "e.g. 9876543210",
      sendOtp: "Send OTP",
      demoOtpNotice: "Prototype Demo OTP: 123456",
      verifyTitle: "Verify Mobile Number",
      verifySubtitle: "Enter the 6-digit OTP sent to your mobile number.",
      otpLabel: "6-Digit OTP",
      otpPlaceholder: "Enter 6-digit code",
      verifyOtp: "Verify OTP",
      changePhone: "Change Mobile Number",
      profileTitle: "Farmer Profile",
      profileSubtitle: "Please fill in your basic details to start using AgriQueue.",
      nameLabel: "Farmer Name",
      namePlaceholder: "Enter your full name",
      stateLabel: "State",
      districtLabel: "District",
      villageLabel: "Village",
      villagePlaceholder: "Enter your village name",
      completeBtn: "Complete Registration",
      backBtn: "Back",
      errPhoneInvalid: "Enter a valid 10-digit Indian mobile number.",
      errOtpInvalid: "Invalid OTP. Please enter the demo code 123456.",
      errNameRequired: "Farmer name is required.",
      errStateRequired: "State is required.",
      errDistrictRequired: "District is required.",
      errVillageRequired: "Village is required."
    },
    hi: {
      appName: "AgriQueue",
      welcomeTitle: "AgriQueue में आपका स्वागत है",
      welcomeSubtitle: "स्मार्ट खेती और आसान खरीद के लिए आपका डिजिटल साथी।",
      benefit1: "आस-पास की मंडियों का पता लगाएं",
      benefit2: "खरीद स्लॉट बुक करें",
      benefit3: "किसान सेवाओं तक पहुंचें",
      getStarted: "शुरू करें",
      chooseLanguage: "अपनी भाषा चुनें",
      chooseLanguageSub: "आगे बढ़ने के लिए एक भाषा चुनें।",
      continue: "जारी रखें",
      loginTitle: "AgriQueue में लॉगिन करें",
      loginSubtitle: "आगे बढ़ने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें।",
      phoneLabel: "मोबाइल नंबर (10 अंक)",
      phonePlaceholder: "जैसे: 9876543210",
      sendOtp: "ओटीपी भेजें",
      demoOtpNotice: "डेमो ओटीपी: 123456",
      verifyTitle: "मोबाइल नंबर सत्यापित करें",
      verifySubtitle: "आपके मोबाइल नंबर पर भेजा गया 6-अंकीय ओटीपी दर्ज करें।",
      otpLabel: "6-अंकीय ओटीपी",
      otpPlaceholder: "6-अंकीय कोड दर्ज करें",
      verifyOtp: "ओटीपी सत्यापित करें",
      changePhone: "मोबाइल नंबर बदलें",
      profileTitle: "किसान प्रोफाइल",
      profileSubtitle: "AgriQueue का उपयोग शुरू करने के लिए कृपया अपना विवरण भरें।",
      nameLabel: "किसान का नाम",
      namePlaceholder: "अपना पूरा नाम दर्ज करें",
      stateLabel: "राज्य",
      districtLabel: "जिला",
      villageLabel: "गांव",
      villagePlaceholder: "अपने गांव का नाम दर्ज करें",
      completeBtn: "पंजीकरण पूरा करें",
      backBtn: "पीछे जाएं",
      errPhoneInvalid: "एक वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें।",
      errOtpInvalid: "अमान्य ओटीपी। कृपया डेमो कोड 123456 दर्ज करें।",
      errNameRequired: "किसान का नाम आवश्यक है।",
      errStateRequired: "राज्य आवश्यक है।",
      errDistrictRequired: "जिला आवश्यक है।",
      errVillageRequired: "गांव आवश्यक है।"
    },
    pa: {
      appName: "AgriQueue",
      welcomeTitle: "AgriQueue ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
      welcomeSubtitle: "ਸਮਾਰਟ ਖੇਤੀ ਅਤੇ ਆਸਾਨ ਮੰਡੀ ਖਰੀਦ ਲਈ ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਸਾਥੀ।",
      benefit1: "ਨੇੜਲੀਆਂ ਮੰਡੀਆਂ ਦਾ ਪਤਾ ਲਗਾਓ",
      benefit2: "ਖਰੀਦ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
      benefit3: "ਕਿਸਾਨ ਸੇਵਾਵਾਂ ਦਾ ਲਾਭ ਲਓ",
      getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
      chooseLanguage: "ਆਪਣੀ ਭਾਸ਼า ਚੁਣੋ",
      chooseLanguageSub: "ਅੱਗੇ ਵਧਣ ਲਈ ਇੱਕ ਭਾਸ਼ਾ ਚੁਣੋ।",
      continue: "ਜਾਰੀ ਰੱਖੋ",
      loginTitle: "AgriQueue ਵਿੱਚ ਲਾਗਇਨ ਕਰੋ",
      loginSubtitle: "ਅੱਗੇ ਵਧਣ ਲਈ ਆਪਣਾ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।",
      phoneLabel: "ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ)",
      phonePlaceholder: "ਜਿਵੇਂ: 9876543210",
      sendOtp: "ਓਟੀਪੀ ਭੇਜੋ",
      demoOtpNotice: "ਡੈਮੋ ਓਟੀਪੀ: 123456",
      verifyTitle: "ਮੋਬਾਈਲ ਨੰਬਰ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
      verifySubtitle: "ਆਪਣੇ ਮੋਬਾਈਲ ਨੰਬਰ 'ਤੇ ਭੇਜਿਆ 6-ਅੰਕੀ ਓਟੀਪੀ ਦਰਜ ਕਰੋ।",
      otpLabel: "6-ਅੰਕੀ ਓਟੀਪੀ",
      otpPlaceholder: "6-ਅੰਕੀ ਕੋਡ ਦਰਜ ਕਰੋ",
      verifyOtp: "ਓਟੀਪੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
      changePhone: "ਮੋਬਾਈਲ ਨੰਬਰ ਬਦਲੋ",
      profileTitle: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      profileSubtitle: "AgriQueue ਦੀ ਵਰਤੋਂ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਵੇਰਵਾ ਭਰੋ।",
      nameLabel: "ਕਿਸਾਨ ਦਾ ਨਾਮ",
      namePlaceholder: "ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ",
      stateLabel: "ਸੂਬਾ",
      districtLabel: "ਜ਼ਿਲ੍ਹਾ",
      villageLabel: "ਪਿੰਡ",
      villagePlaceholder: "ਆਪਣੇ ਪਿੰਡ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ",
      completeBtn: "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ",
      backBtn: "ਪਿੱਛੇ ਜਾਓ",
      errPhoneInvalid: "ਸਹੀ 10-ਅੰਕਾਂ ਦਾ ਭਾਰਤੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।",
      errOtpInvalid: "ਗਲਤ ਓਟੀਪੀ। ਕਿਰਪਾ ਕਰਕੇ ਡੈਮੋ ਕੋਡ 123456 ਦਰਜ ਕਰੋ।",
      errNameRequired: "ਕਿਸਾਨ ਦਾ ਨਾਮ ਲੋੜੀਂਦਾ ਹੈ।",
      errStateRequired: "ਸੂਬਾ ਲੋੜੀਂਦਾ ਹੈ।",
      errDistrictRequired: "ਜ਼ਿਲ੍ਹਾ ਲੋੜੀਂਦਾ ਹੈ।",
      errVillageRequired: "ਪਿੰਡ ਲੋੜੀਂਦਾ ਹੈ।"
    },
    te: {
      appName: "AgriQueue",
      welcomeTitle: "AgriQueue కి స్వాగతం",
      welcomeSubtitle: "స్మార్ట్ వ్యవసాయం మరియు సులభమైన మండి కొనుగోలు కోసం మీ డిజిటల్ తోడు.",
      benefit1: "సమీప మండీలను కనుగొనండి",
      benefit2: "కొనుగోలు స్లాట్ బుక్ చేసుకోండి",
      benefit3: "రైతు సేవలను పొందండి",
      getStarted: "ప్రారంభించండి",
      chooseLanguage: "మీ భాషను ఎంచుకోండి",
      chooseLanguageSub: "కొనసాగడానికి ఒక భాషను ఎంచుకోండి.",
      continue: "కొనసాగించండి",
      loginTitle: "AgriQueue కి లాగిన్ అవ్వండి",
      loginSubtitle: "కొనసాగడానికి మీ నమోదిత మొబైల్ సంఖ్యను నమోదు చేయండి.",
      phoneLabel: "మొబైల్ సంఖ్య (10 అంకెలు)",
      phonePlaceholder: "ఉదా: 9876543210",
      sendOtp: "OTP పంపండి",
      demoOtpNotice: "డెమో OTP: 123456",
      verifyTitle: "మొబైల్ సంఖ్యను ధృవీకరించండి",
      verifySubtitle: "మీ మొబైల్ సంఖ్యకు పంపిన 6-అంకెల OTPని నమోదు చేయండి.",
      otpLabel: "6-అంకెల OTP",
      otpPlaceholder: "6-అంకెల కోడ్ నమోదు చేయండి",
      verifyOtp: "OTP ధృవీకరించండి",
      changePhone: "మొబైల్ సంఖ్యను మార్చండి",
      profileTitle: "రైతు ప్రొఫైల్",
      profileSubtitle: "AgriQueue ని ఉపయోగించడం ప్రారంభించడానికి దయచేసి మీ వివరాలను నింపండి.",
      nameLabel: "రైతు పేరు",
      namePlaceholder: "మీ పూర్తి పేరు నమోదు చేయండి",
      stateLabel: "రాష్ట్రం",
      districtLabel: "జిల్లా",
      villageLabel: "గ్రామం",
      villagePlaceholder: "మీ గ్రామం పేరు నమోదు చేయండి",
      completeBtn: "నమోదును పూర్తి చేయండి",
      backBtn: "వెనుకకు",
      errPhoneInvalid: "సరైన 10 అంకెల మొబైల్ సంఖ్యను నమోదు చేయండి.",
      errOtpInvalid: "తప్పు OTP. దయచేసి డెమో కోడ్ 123456 నమోదు చేయండి.",
      errNameRequired: "రైతు పేరు తప్పనిసరి.",
      errStateRequired: "రాష్ట్రం తప్పనిసరి.",
      errDistrictRequired: "జిల్లా తప్పనిసరి.",
      errVillageRequired: "గ్రామం తప్పనిసరి."
    }
  };

  const getT = (key) => {
    const dict = localT[language] || localT.en;
    return dict[key] || localT.en[key] || key;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setIsStateOpen(false);
      }
      if (districtRef.current && !districtRef.current.contains(e.target)) {
        setIsDistrictOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter list of states locally
  const statesList = Object.keys(locationData);
  const filteredStates = statesList.filter(s =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Filter list of districts based on selected state locally
  const districtsList = state ? (locationData[state] || []) : [];
  const filteredDistricts = districtsList.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  // Step 3: Handle Mobile verification request
  const handleSendOtp = (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrors({ phone: getT('errPhoneInvalid') });
      return;
    }
    setErrors({});
    setStep(4);
  };

  // Step 4: Verify mock OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp !== '123456') {
      setErrors({ otp: getT('errOtpInvalid') });
      return;
    }
    setErrors({});

    // Check if user has an existing profile in MySQL for this phone
    try {
      const existing = await getFarmer(phone);
      if (existing.success && existing.data) {
        // Returning user with registered profile in MySQL
        await loginSession(existing.data, phone);
        return;
      }
    } catch (err) {
      console.warn('Could not query farmer profile:', err);
    }

    if (isProfileCompleted && profile?.phone === phone && profile?.farmerId) {
      // Local profile matching current phone
      await loginSession(profile, phone);
    } else {
      // New farmer -> proceed to Step 5 to complete profile
      setStep(5);
    }
  };

  // Step 5: Profile form validation & submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = getT('errNameRequired');
    if (!state.trim()) newErrors.state = getT('errStateRequired');
    if (!district.trim()) newErrors.district = getT('errDistrictRequired');
    if (!village.trim()) newErrors.village = getT('errVillageRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await completeRegistration({ name, phone, state, district, village });
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f6] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      {/* AgriQueue Logo / Branding */}
      <div className="flex items-center gap-2 mb-6 select-none">
        <div className="p-2 bg-primary-600 rounded-xl text-white shadow-xs">
          <Sprout className="h-6 w-6" />
        </div>
        <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-800">
          Agri<span className="text-primary-600">Queue</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* Step 1: Welcome Intro */}
        {step === 1 && (
          <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CardContent className="p-6 sm:p-8 text-center space-y-8">
              <div className="space-y-3">
                <span className="text-4xl block" role="img" aria-label="Sprout emoji">🌾</span>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-800 leading-tight">
                  {getT('welcomeTitle')}
                </h1>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {getT('welcomeSubtitle')}
                </p>
              </div>

              {/* Minimal bullet items */}
              <div className="space-y-3.5 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <span className="text-xl shrink-0" role="img" aria-label="Map icon">🗺️</span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-normal">
                    {getT('benefit1')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <span className="text-xl shrink-0" role="img" aria-label="Ticket icon">🎫</span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-normal">
                    {getT('benefit2')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <span className="text-xl shrink-0" role="img" aria-label="Plant icon">🌾</span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-normal">
                    {getT('benefit3')}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm sm:text-base py-4 rounded-2xl font-bold tracking-wide shadow-md shadow-primary-500/10 cursor-pointer min-h-[50px]"
                onClick={() => setStep(2)}
              >
                {getT('getStarted')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Language Setup */}
        {step === 2 && (
          <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <Globe className="h-9 w-9 text-primary-600 mx-auto mb-1" />
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-800 leading-tight">
                  {getT('chooseLanguage')}
                </h1>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {getT('chooseLanguageSub')}
                </p>
              </div>

              {/* Custom selection grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[86px] ${
                      language === lang.code
                        ? 'border-primary-500 bg-primary-50/25 text-primary-750 shadow-2xs'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-heading font-bold text-sm sm:text-base block leading-none">
                      {lang.label}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-405 font-medium block mt-1">
                      {lang.sub}
                    </span>
                    {language === lang.code && (
                      <span className="mt-1 p-0.5 rounded-full bg-primary-600 text-white text-[8px]">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  variant="outline"
                  className="flex-1 text-sm py-3 rounded-xl text-slate-650 cursor-pointer min-h-[48px]"
                  onClick={() => setStep(1)}
                >
                  {getT('backBtn')}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 text-sm py-3 rounded-xl cursor-pointer min-h-[48px]"
                  onClick={() => setStep(3)}
                >
                  {getT('continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Mobile Number login screen */}
        {step === 3 && (
          <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto bg-slate-50 p-2.5 rounded-full w-11 h-11 flex items-center justify-center text-primary-650 border border-slate-100/80 mb-1">
                  <User className="h-5.5 w-5.5" />
                </div>
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-800 leading-tight">
                  {getT('loginTitle')}
                </h1>
                <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                  {getT('loginSubtitle')}
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="login-phone">
                    {getT('phoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      id="login-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={getT('phonePlaceholder')}
                      className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-750 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 ${
                        errors.phone ? 'border-rose-350 focus:border-rose-500' : 'border-slate-105 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-rose-600 text-xs font-bold">{errors.phone}</p>}
                </div>

                {/* Demonstration Alert banner */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center flex items-center justify-center gap-1.5 shadow-2xs">
                  <span className="text-base">💡</span>
                  <p className="text-xs font-bold text-amber-800 leading-tight">
                    {getT('demoOtpNotice')}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-sm py-3 rounded-xl text-slate-650 cursor-pointer min-h-[48px]"
                    onClick={() => setStep(2)}
                  >
                    {getT('backBtn')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 text-sm py-3 rounded-xl cursor-pointer min-h-[48px] font-bold"
                  >
                    {getT('sendOtp')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: OTP verification */}
        {step === 4 && (
          <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto bg-slate-50 p-2.5 rounded-full w-11 h-11 flex items-center justify-center text-primary-650 border border-slate-100/80 mb-1">
                  <Key className="h-5.5 w-5.5" />
                </div>
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-800 leading-tight">
                  {getT('verifyTitle')}
                </h1>
                <p className="text-xs text-slate-450 font-semibold max-w-xs mx-auto">
                  {getT('verifySubtitle')}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="login-otp">
                    {getT('otpLabel')}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      id="login-otp"
                      type="tel"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={getT('otpPlaceholder')}
                      className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-xl text-center text-lg font-heading font-bold tracking-widest text-slate-755 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 ${
                        errors.otp ? 'border-rose-350 focus:border-rose-500' : 'border-slate-105 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {errors.otp && <p className="text-rose-600 text-xs font-bold text-center">{errors.otp}</p>}
                </div>

                {/* Demo OTP Notice */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-2.5 text-center text-xs font-bold text-amber-800 shadow-2xs">
                  {getT('demoOtpNotice')}
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full text-sm py-3.5 rounded-xl cursor-pointer min-h-[48px] font-bold"
                  >
                    {getT('verifyOtp')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm py-3.5 rounded-xl cursor-pointer min-h-[48px] text-slate-550 border-slate-105"
                    onClick={() => {
                      setOtp('');
                      setErrors({});
                      setStep(3);
                    }}
                  >
                    {getT('changePhone')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Farmer Profile Details */}
        {step === 5 && (
          <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto bg-slate-50 p-2.5 rounded-full w-11 h-11 flex items-center justify-center text-primary-650 border border-slate-100/80 mb-1">
                  <User className="h-5.5 w-5.5" />
                </div>
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-800 leading-tight">
                  {getT('profileTitle')}
                </h1>
                <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                  {getT('profileSubtitle')}
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Farmer Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="register-name">
                    {getT('nameLabel')} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={getT('namePlaceholder')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-750 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 ${
                        errors.name ? 'border-rose-350 focus:border-rose-500' : 'border-slate-105 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-rose-600 text-xs font-bold">{errors.name}</p>}
                </div>

                {/* State, District searchable comboboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Searchable State Dropdown */}
                  <div ref={stateRef} className="relative space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="register-state">
                      {getT('stateLabel')} *
                    </label>
                    
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        id="register-state"
                        type="text"
                        value={stateSearch}
                        onClick={() => setIsStateOpen(true)}
                        onChange={(e) => {
                          setStateSearch(e.target.value);
                          setIsStateOpen(true);
                          if (!e.target.value) {
                            setState('');
                            setDistrict('');
                            setDistrictSearch('');
                          }
                        }}
                        placeholder={t('searchStatePlaceholder')}
                        className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-755 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 ${
                          errors.state ? 'border-rose-350 focus:border-rose-500' : 'border-slate-105 focus:border-primary-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        <span className="text-[10px]">▼</span>
                      </button>
                    </div>

                    {isStateOpen && (
                      <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto bg-white border border-slate-150 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {filteredStates.length === 0 ? (
                          <div className="px-4 py-2.5 text-xs font-semibold text-slate-400">
                            {t('noStateFound')}
                          </div>
                        ) : (
                          filteredStates.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setState(st);
                                setStateSearch(st);
                                setIsStateOpen(false);
                                setDistrict('');
                                setDistrictSearch('');
                                setErrors(prev => ({ ...prev, state: '' }));
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-700 cursor-pointer flex justify-between items-center"
                            >
                              <span>{st}</span>
                              {state === st && <Check className="h-3.5 w-3.5 text-primary-600" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {errors.state && <p className="text-rose-600 text-xs font-bold">{errors.state}</p>}
                  </div>

                  {/* Dependent Searchable District Dropdown */}
                  <div ref={districtRef} className="relative space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="register-district">
                      {getT('districtLabel')} *
                    </label>

                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        id="register-district"
                        type="text"
                        disabled={!state}
                        value={state ? districtSearch : ''}
                        onClick={() => state && setIsDistrictOpen(true)}
                        onChange={(e) => {
                          setDistrictSearch(e.target.value);
                          setIsDistrictOpen(true);
                          if (!e.target.value) {
                            setDistrict('');
                          }
                        }}
                        placeholder={state ? t('searchDistrictPlaceholder') : t('selectStateFirst')}
                        className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm font-semibold text-slate-755 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                          !state 
                            ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed select-none' 
                            : errors.district 
                              ? 'bg-slate-50 border-rose-350 focus:border-rose-500 focus:bg-white' 
                              : 'bg-slate-50 border-slate-105 focus:border-primary-500 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={!state}
                        onClick={() => setIsDistrictOpen(!isDistrictOpen)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none disabled:opacity-40"
                      >
                        <span className="text-[10px]">▼</span>
                      </button>
                    </div>

                    {state && isDistrictOpen && (
                      <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto bg-white border border-slate-150 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {filteredDistricts.length === 0 ? (
                          <div className="px-4 py-2.5 text-xs font-semibold text-slate-400">
                            {t('noDistrictFound')}
                          </div>
                        ) : (
                          filteredDistricts.map((dst) => (
                            <button
                              key={dst}
                              type="button"
                              onClick={() => {
                                setDistrict(dst);
                                setDistrictSearch(dst);
                                setIsDistrictOpen(false);
                                setErrors(prev => ({ ...prev, district: '' }));
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-700 cursor-pointer flex justify-between items-center"
                            >
                              <span>{dst}</span>
                              {district === dst && <Check className="h-3.5 w-3.5 text-primary-600" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {errors.district && <p className="text-rose-600 text-xs font-bold">{errors.district}</p>}
                  </div>

                </div>

                {/* Village free-text field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="register-village">
                    {getT('villageLabel')} *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      id="register-village"
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder={getT('villagePlaceholder')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-750 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 ${
                        errors.village ? 'border-rose-350 focus:border-rose-500' : 'border-slate-105 focus:border-primary-500'
                      }`}
                    />
                  </div>
                  {errors.village && <p className="text-rose-600 text-xs font-bold">{errors.village}</p>}
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-sm py-3 rounded-xl text-slate-650 cursor-pointer min-h-[48px]"
                    onClick={() => setStep(4)}
                  >
                    {getT('backBtn')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="flex-1 text-sm py-3 rounded-xl cursor-pointer min-h-[48px] font-bold"
                  >
                    {isSubmitting ? '...' : getT('completeBtn')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
