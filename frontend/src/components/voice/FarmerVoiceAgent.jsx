import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  X,
  Sparkles,
  ShieldCheck,
  Radio,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Ticket,
  QrCode,
  MapPin,
  Wheat,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getVoiceStatus } from '../../services/api';
import { BookingQRCode } from '../booking/BookingQRCode';

/**
 * Multilingual UI translations for the Voice Assistant modal.
 * Pure UTF-8 strings for English, Hindi, Punjabi, and Telugu.
 */
const VOICE_I18N = {
  en: {
    title: 'AgriQueue Voice Assistant',
    subtitle: 'AI Farmer Voice Companion',
    farmerBadge: 'Farmer ID',
    langBadge: 'English',
    connecting: 'Connecting...',
    ready: 'Connected • Ready',
    listening: 'Listening... Speak in English',
    thinking: 'Thinking...',
    speaking: 'Assistant is speaking...',
    muted: 'Microphone muted',
    callEnded: 'Call disconnected',
    startCall: 'Start Voice Call',
    endCall: 'End Call',
    mute: 'Mute',
    unmute: 'Unmute',
    close: 'Close',
    hintTitle: 'Try saying:',
    hint1: 'What is today\'s paddy rate in my mandi?',
    hint2: 'Check my active token queue position',
    hint3: 'Book a mandi slot for tomorrow',
    securityNote: 'Private & secure. Database IDs & mandi names preserved.',
    // Progress steps
    progressFindingMandis: 'Finding nearby mandis...',
    progressMandisFound: 'Mandis found',
    progressCheckingSlots: 'Checking available slots...',
    progressSlotsFound: 'Slot available',
    progressPreparingBooking: 'Preparing booking details...',
    progressWaitingConfirmation: 'Waiting for your verbal confirmation...',
    progressBookingSlot: 'Confirming your mandi slot...',
    progressBookingConfirmed: 'Booking confirmed!',
    progressShowingQr: 'Opening QR pass...',
    // Summary Card before confirmation
    summaryTitle: 'Confirm Mandi Slot Details',
    mandiLabel: 'Mandi',
    cropLabel: 'Crop',
    quantityLabel: 'Quantity',
    dateLabel: 'Date',
    timeLabel: 'Time',
    slotLabel: 'Slot',
    quintals: 'Qtl',
    confirmQuestion: 'Say "Yes" to confirm or "No" to cancel',
    // Booking Confirmed Card
    bookingConfirmedTitle: 'Booking Confirmed',
    tokenNumberLabel: 'Token Number',
    bookingIdLabel: 'Booking ID',
    estimatedWaitLabel: 'Est. Wait',
    farmersAheadLabel: 'Ahead in Queue',
    showQrAtCenter: 'Show this QR code at the mandi gate.',
    // Action buttons
    btnShowMyQr: 'Show QR Code',
    btnHideQr: 'Hide QR Code',
    btnOpenMyBooking: 'Open My Booking'
  },
  hi: {
    title: 'एग्रीकतार आवाज़ सहायक',
    subtitle: 'किसान आवाज़ साथी',
    farmerBadge: 'किसान आईडी',
    langBadge: 'हिन्दी (Hindi)',
    connecting: 'कॉल जुड़ रही है...',
    ready: 'जुड़ गया • तैयार',
    listening: 'सुन रहे हैं... हिन्दी में बोलें',
    thinking: 'सोच रहे हैं...',
    speaking: 'सहायक बोल रहा है...',
    muted: 'माइक म्यूट है',
    callEnded: 'कॉल समाप्त',
    startCall: 'आवाज़ कॉल शुरू करें',
    endCall: 'कॉल समाप्त करें',
    mute: 'म्यूट',
    unmute: 'अनम्यूट',
    close: 'बंद करें',
    hintTitle: 'आप ऐसे बोल सकते हैं:',
    hint1: 'मेरी मंडी में धान का आज का भाव क्या है?',
    hint2: 'मेरा टोकन नंबर और कतार स्थिति क्या है?',
    hint3: 'कल के लिए मंडी का स्लॉट बुक करें',
    securityNote: 'सुरक्षित एवं निजी। मंडी और किसान विवरण सुरक्षित।',
    // Progress steps
    progressFindingMandis: 'नज़दीकी मंडियां खोज रहे हैं...',
    progressMandisFound: 'मंडी मिल गई',
    progressCheckingSlots: 'उपलब्ध स्लॉट देख रहे हैं...',
    progressSlotsFound: 'स्लॉट उपलब्ध है',
    progressPreparingBooking: 'बुकिंग विवरण तैयार कर रहे हैं...',
    progressWaitingConfirmation: 'आपकी मौखिक पुष्टि की प्रतीक्षा है...',
    progressBookingSlot: 'मंडी स्लॉट पक्का कर रहे हैं...',
    progressBookingConfirmed: 'बुकिंग पक्की हो गई!',
    progressShowingQr: 'QR पास खोल रहे हैं...',
    // Summary Card before confirmation
    summaryTitle: 'मंडी स्लॉट विवरण की पुष्टि करें',
    mandiLabel: 'मंडी',
    cropLabel: 'फसल',
    quantityLabel: 'मात्रा',
    dateLabel: 'तारीख',
    timeLabel: 'समय',
    slotLabel: 'स्लॉट',
    quintals: 'क्विंटल',
    confirmQuestion: 'पुष्टि के लिए "हाँ" बोलें या रद्द करने के लिए "नहीं"',
    // Booking Confirmed Card
    bookingConfirmedTitle: 'बुकिंग पक्की हो गई',
    tokenNumberLabel: 'टोकन नंबर',
    bookingIdLabel: 'बुकिंग आईडी',
    estimatedWaitLabel: 'अनुमानित समय',
    farmersAheadLabel: 'आगे किसान',
    showQrAtCenter: 'मंडी गेट पर यह QR कोड दिखाएं।',
    // Action buttons
    btnShowMyQr: 'QR कोड देखें',
    btnHideQr: 'QR कोड छुपाएं',
    btnOpenMyBooking: 'मेरी बुकिंग खोलें'
  },
  pa: {
    title: 'ਐਗਰੀਕਿਊ ਆਵਾਜ਼ ਸਹਾਇਕ',
    subtitle: 'ਕਿਸਾਨ ਆਵਾਜ਼ ਸਾਥੀ',
    farmerBadge: 'ਕਿਸਾਨ ਆਈਡੀ',
    langBadge: 'ਪੰਜਾਬੀ (Punjabi)',
    connecting: 'ਕਾਲ ਜੁੜ ਰਹੀ ਹੈ...',
    ready: 'ਜੁੜ ਗਿਆ • ਤਿਆਰ',
    listening: 'ਸੁਣ ਰਹੇ ਹਾਂ... ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ',
    thinking: 'ਸੋਚ ਰਹੇ ਹਾਂ...',
    speaking: 'ਸਹਾਇਕ ਬੋਲ ਰਿਹਾ ਹੈ...',
    muted: 'ਮਾਈਕ ਮਿਊਟ ਹੈ',
    callEnded: 'ਕਾਲ ਖਤਮ ਹੋ ਗਈ',
    startCall: 'ਆਵਾਜ਼ ਕਾਲ ਸ਼ੁਰੂ ਕਰੋ',
    endCall: 'ਕਾਲ ਖਤਮ ਕਰੋ',
    mute: 'ਮਿਊਟ',
    unmute: 'ਅਨਮਿਊਟ',
    close: 'ਬੰਦ ਕਰੋ',
    hintTitle: 'ਤੁਸੀਂ ਇਸ ਤਰ੍ਹਾਂ ਬੋਲ ਸਕਦੇ ਹੋ:',
    hint1: 'ਮੇਰੀ ਮੰਡੀ ਵਿੱਚ ਕਣਕ ਦਾ ਅੱਜ ਦਾ ਭਾਅ ਕੀ ਹੈ?',
    hint2: 'ਮੇਰਾ ਟੋਕਨ ਨੰਬਰ ਅਤੇ ਕਤਾਰ ਦੀ ਸਥਿਤੀ ਕੀ ਹੈ?',
    hint3: 'ਕੱਲ੍ਹ ਲਈ ਮੰਡੀ ਦਾ ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
    securityNote: 'ਸੁਰੱਖਿਅਤ ਅਤੇ ਨਿੱਜੀ। ਮੰਡੀ ਅਤੇ ਕਿਸਾਨ ਵੇਰਵੇ ਸੁਰੱਖਿਅਤ।',
    // Progress steps
    progressFindingMandis: 'ਨੇੜਲੀਆਂ ਮੰਡੀਆਂ ਲੱਭ ਰਹੇ ਹਾਂ...',
    progressMandisFound: 'ਮੰਡੀ ਲੱਭ ਗਈ',
    progressCheckingSlots: 'ਉਪਲਬਧ ਸਲਾਟ ਚੈੱਕ ਕਰ ਰਹੇ ਹਾਂ...',
    progressSlotsFound: 'ਸਲਾਟ ਉਪਲਬਧ ਹੈ',
    progressPreparingBooking: 'ਬੁਕਿੰਗ ਵੇਰਵੇ ਤਿਆਰ ਕਰ ਰਹੇ ਹਾਂ...',
    progressWaitingConfirmation: 'ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਦੀ ਉਡੀਕ ਹੈ...',
    progressBookingSlot: 'ਮੰਡੀ ਸਲਾਟ ਪੱਕਾ ਕਰ ਰਹੇ ਹਾਂ...',
    progressBookingConfirmed: 'ਬੁਕਿੰਗ ਪੱਕੀ ਹੋ ਗਈ!',
    progressShowingQr: 'QR ਪਾਸ ਖੋਲ੍ਹ ਰਹੇ ਹਾਂ...',
    // Summary Card before confirmation
    summaryTitle: 'ਮੰਡੀ ਸਲਾਟ ਵੇਰਵੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    mandiLabel: 'ਮੰਡੀ',
    cropLabel: 'ਫ਼ਸਲ',
    quantityLabel: 'ਮਾਤਰਾ',
    dateLabel: 'ਮਿਤੀ',
    timeLabel: 'ਸਮਾਂ',
    slotLabel: 'ਸਲਾਟ',
    quintals: 'ਕੁਇੰਟਲ',
    confirmQuestion: 'ਪੁਸ਼ਟੀ ਲਈ "ਹਾਂ" ਬੋਲੋ ਜਾਂ ਰੱਦ ਕਰਨ ਲਈ "ਨਹੀਂ"',
    // Booking Confirmed Card
    bookingConfirmedTitle: 'ਬੁਕਿੰਗ ਪੱਕੀ ਹੋ ਗਈ',
    tokenNumberLabel: 'ਟੋਕਨ ਨੰਬਰ',
    bookingIdLabel: 'ਬੁਕਿੰਗ ਆਈਡੀ',
    estimatedWaitLabel: 'ਅੰਦਾਜ਼ਨ ਸਮਾਂ',
    farmersAheadLabel: 'ਅੱਗੇ ਕਿਸਾਨ',
    showQrAtCenter: 'ਮੰਡੀ ਦੇ ਗੇਟ \'ਤੇ ਇਹ QR ਕੋਡ ਦਿਖਾਓ।',
    // Action buttons
    btnShowMyQr: 'QR ਕੋਡ ਦੇਖੋ',
    btnHideQr: 'QR ਕੋਡ ਛੁਪਾਓ',
    btnOpenMyBooking: 'ਮੇਰੀ ਬੁਕਿੰਗ ਖੋਲ੍ਹੋ'
  },
  te: {
    title: 'అగ్రి-క్యూ వాయిస్ అసిస్టెంట్',
    subtitle: 'రైతు వాయిస్ సహచరి',
    farmerBadge: 'రైతు ఐడీ',
    langBadge: 'తెలుగు (Telugu)',
    connecting: 'కాల్ కనెక్ట్ అవుతోంది...',
    ready: 'కనెక్ట్ అయింది • సిద్ధం',
    listening: 'వింటున్నాము... తెలుగులో మాట్లాడండి',
    thinking: 'ఆలోచిస్తోంది...',
    speaking: 'సహాయకుడు మాట్లాడుతున్నారు...',
    muted: 'మైక్ మ్యూట్ చేయబడింది',
    callEnded: 'కాల్ ముగిసింది',
    startCall: 'వాయిస్ కాల్ ప్రారంభించండి',
    endCall: 'కాల్ ముగించండి',
    mute: 'మ్యూట్',
    unmute: 'అన్‌మ్యూట్',
    close: 'మూసివేయి',
    hintTitle: 'మీరు ఇలా అడగవచ్చు:',
    hint1: 'మా మార్కెట్లో ఈరోజు వరి ధర ఎంత?',
    hint2: 'నా టోకెన్ మరియు క్యూ స్థానం తెలుసుకోండి',
    hint3: 'రేపటి కోసం మార్కెట్ స్లాట్ బుక్ చేయండి',
    securityNote: 'సురక్షితం & గోప్యమైనది. మార్కెట్, రైతు వివరాలు భద్రం.',
    // Progress steps
    progressFindingMandis: 'సమీప మార్కెట్లను వెతుకుతున్నాము...',
    progressMandisFound: 'మార్కెట్ కనుగొనబడింది',
    progressCheckingSlots: 'అందుబాటులో ఉన్న స్లాట్‌లను చూస్తున్నాము...',
    progressSlotsFound: 'స్లాట్ అందుబాటులో ఉంది',
    progressPreparingBooking: 'బుకింగ్ వివరాలు సిద్ధం చేస్తున్నాము...',
    progressWaitingConfirmation: 'మీ మౌఖిక నిర్ధారణ కోసం వేచి చూస్తున్నాము...',
    progressBookingSlot: 'మార్కెట్ స్లాట్ ఖరారు చేస్తున్నాము...',
    progressBookingConfirmed: 'బుకింగ్ పూర్తయింది!',
    progressShowingQr: 'QR పాస్ తెరుస్తున్నాము...',
    // Summary Card before confirmation
    summaryTitle: 'మార్కెట్ స్లాట్ వివరాలను నిర్ధారించండి',
    mandiLabel: 'మార్కెట్',
    cropLabel: 'పంట',
    quantityLabel: 'పరిమాణం',
    dateLabel: 'తేదీ',
    timeLabel: 'సమయం',
    slotLabel: 'స్లాట్',
    quintals: 'క్వింటాళ్ళు',
    confirmQuestion: 'ఖరారు చేయడానికి "అవును" లేదా రద్దు చేయడానికి "వద్దు" అని చెప్పండి',
    // Booking Confirmed Card
    bookingConfirmedTitle: 'బుకింగ్ పూర్తయింది',
    tokenNumberLabel: 'టోకెన్ నంబర్',
    bookingIdLabel: 'బుకింగ్ ఐడీ',
    estimatedWaitLabel: 'అంచనా వేచి ఉండే సమయం',
    farmersAheadLabel: 'ముందున్న రైతులు',
    showQrAtCenter: 'మార్కెట్ గేటు వద్ద ఈ QR కోడ్ చూపించండి.',
    // Action buttons
    btnShowMyQr: 'QR కోడ్ చూపించు',
    btnHideQr: 'QR కోడ్ దాచండి',
    btnOpenMyBooking: 'నా బుకింగ్ తెరవండి'
  }
};

/**
 * Audio format conversion utilities
 */
const floatTo16BitPCM = (float32Array) => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Uint8Array(buffer);
};

const base64ToFloat32Array = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

const uint8ToBase64 = (uint8Array) => {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
};

/**
 * FarmerVoiceAgent
 * Multilingual bidirectional voice assistant with real-time Gemini Live communication,
 * visual action progress panel, pre-confirmation booking preview, and verified QR code pass.
 */
export const FarmerVoiceAgent = ({ onOpenTokenPass }) => {
  const navigate = useNavigate();
  const { profile, language } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [callState, setCallState] = useState('idle'); // 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [backendReady, setBackendReady] = useState(null);
  const [audioLevel, setAudioLevel] = useState(1);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Voice action progress panel state
  const [activeActionStep, setActiveActionStep] = useState(null);
  // Pre-confirmation booking preview state
  const [bookingPreview, setBookingPreview] = useState(null);
  // Post-booking confirmed state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  // QR display toggle inside voice agent
  const [showQrCode, setShowQrCode] = useState(false);

  const currentLang = language && VOICE_I18N[language] ? language : 'en';
  const i18n = VOICE_I18N[currentLang];

  // Streaming and audio refs
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const inputAudioCtxRef = useRef(null);
  const playbackAudioCtxRef = useRef(null);
  const processorNodeRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const nextStartTimeRef = useRef(0);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  /**
   * Check backend Gemini Live health on mount
   */
  useEffect(() => {
    let isMounted = true;
    getVoiceStatus()
      .then(res => {
        if (isMounted) {
          setBackendReady(res.success && res.connected);
        }
      })
      .catch(() => {
        if (isMounted) setBackendReady(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Cleanly stop all audio capture, playback, and release the microphone
   */
  const stopAudio = useCallback(() => {
    // 1. Release microphone hardware tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    // 2. Disconnect and close input audio processor
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      processorNodeRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      try {
        inputAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      inputAudioCtxRef.current = null;
    }

    // 3. Stop all playing audio sources
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    // 4. Close playback audio context
    if (playbackAudioCtxRef.current && playbackAudioCtxRef.current.state !== 'closed') {
      try {
        playbackAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      playbackAudioCtxRef.current = null;
    }

    // 5. Close WebSocket connection
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'end' }));
        }
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    setAudioLevel(1);
  }, []);

  /**
   * Schedule incoming 24kHz PCM chunk for seamless playback
   */
  const playAudioChunk = useCallback((base64Pcm) => {
    try {
      const float32Data = base64ToFloat32Array(base64Pcm);
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!playbackAudioCtxRef.current || playbackAudioCtxRef.current.state === 'closed') {
        playbackAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      }

      const audioCtx = playbackAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setCallState('speaking');
      setStatusMessage(i18n.speaking);
      setAudioLevel(2.5);

      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx !== -1) {
          activeSourcesRef.current.splice(idx, 1);
        }
        if (activeSourcesRef.current.length === 0) {
          setCallState('listening');
          setStatusMessage(i18n.listening);
          setAudioLevel(1);
        }
      };
    } catch (err) {
      console.error('[Voice Playback Error]:', err);
    }
  }, [i18n]);

  /**
   * Start microphone capture and stream 16kHz PCM chunks to WebSocket
   */
  const startMicrophoneCapture = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Calculate RMS audio level for UI feedback
        let sum = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sum += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sum / inputChannel.length);
        if (rms > 0.015) {
          setAudioLevel(Math.min(3.8, Math.max(1.2, 1 + rms * 18)));
        }

        // Send 16kHz PCM audio chunk to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcmBytes = floatTo16BitPCM(inputChannel);
          const base64Data = uint8ToBase64(pcmBytes);
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            data: base64Data
          }));
        }
      };
    } catch (err) {
      console.error('[Microphone Permission / Setup Error]:', err);
      setStatusMessage('Microphone access denied or unavailable');
    }
  }, []);

  /**
   * Starts a voice agent session with the backend WebSocket
   */
  const handleStartCall = useCallback(async () => {
    stopAudio();
    setCallState('connecting');
    setStatusMessage(i18n.connecting);
    setLiveTranscript('');
    setActiveActionStep(null);
    setBookingPreview(null);
    setConfirmedBooking(null);
    setShowQrCode(false);
    setIsMuted(false);

    const farmerId = profile?.farmerId || profile?.phone || 'ANONYMOUS_FARMER';
    const farmerName = profile?.name || 'Farmer';
    const district = profile?.district || '';
    const state = profile?.state || '';

    // Determine WebSocket URL from frontend API configuration
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws/voice';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'init',
          farmerId,
          farmerName,
          language: currentLang,
          district,
          state
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'session_ready': {
              setCallState('listening');
              setStatusMessage(i18n.listening);
              startMicrophoneCapture();
              break;
            }

            // 1. Agent Action / Progress Events
            case 'tool_call': {
              setCallState('thinking');
              if (msg.name === 'FIND_AVAILABLE_MANDIS') {
                setActiveActionStep('finding_mandis');
                setStatusMessage(i18n.progressFindingMandis);
              } else if (msg.name === 'CHECK_AVAILABLE_SLOTS') {
                setActiveActionStep('checking_slots');
                setStatusMessage(i18n.progressCheckingSlots);
              } else if (msg.name === 'PREPARE_BOOKING_SUMMARY') {
                setActiveActionStep('preparing_booking');
                setStatusMessage(i18n.progressPreparingBooking);
              } else if (msg.name === 'BOOK_MANDI_SLOT') {
                setActiveActionStep('booking_slot');
                setStatusMessage(i18n.progressBookingSlot);
              } else if (msg.name === 'SHOW_MY_QR') {
                setActiveActionStep('showing_qr');
                setStatusMessage(i18n.progressShowingQr);
              }
              break;
            }

            case 'tool_result': {
              if (msg.name === 'FIND_AVAILABLE_MANDIS') {
                setStatusMessage(i18n.progressMandisFound);
              } else if (msg.name === 'CHECK_AVAILABLE_SLOTS') {
                setStatusMessage(i18n.progressSlotsFound);
              } else if (msg.name === 'PREPARE_BOOKING_SUMMARY') {
                setActiveActionStep('waiting_confirmation');
                setStatusMessage(i18n.progressWaitingConfirmation);
              } else if (msg.name === 'BOOK_MANDI_SLOT') {
                if (msg.result?.success) {
                  setActiveActionStep('booking_confirmed');
                  setStatusMessage(i18n.progressBookingConfirmed);
                }
              }
              break;
            }

            // 2. Booking Preview before verbal confirmation
            case 'booking_preview': {
              if (msg.data) {
                setBookingPreview(msg.data);
                setActiveActionStep('waiting_confirmation');
                setStatusMessage(i18n.progressWaitingConfirmation);
              }
              break;
            }

            // 3. Successful Booking Event
            case 'booking_confirmed': {
              if (msg.data) {
                setConfirmedBooking(msg.data);
                setBookingPreview(null);
                setActiveActionStep('booking_confirmed');
                setStatusMessage(i18n.progressBookingConfirmed);
                setShowQrCode(true);
              }
              break;
            }

            // 4. Navigate / Show QR Code Event
            case 'navigate_to_qr': {
              setShowQrCode(true);
              setActiveActionStep('showing_qr');
              setStatusMessage(i18n.progressShowingQr);
              if (onOpenTokenPass) {
                onOpenTokenPass();
              }
              break;
            }

            case 'state': {
              if (msg.state === 'connecting') {
                setCallState('connecting');
                setStatusMessage(i18n.connecting);
              } else if (msg.state === 'listening') {
                if (activeSourcesRef.current.length === 0) {
                  setCallState('listening');
                  setStatusMessage(i18n.listening);
                }
              } else if (msg.state === 'thinking') {
                setCallState('thinking');
                setStatusMessage(i18n.thinking);
              } else if (msg.state === 'speaking') {
                setCallState('speaking');
                setStatusMessage(i18n.speaking);
              } else if (msg.state === 'disconnected') {
                setCallState('ended');
                setStatusMessage(i18n.callEnded);
                stopAudio();
              }
              break;
            }

            case 'audio': {
              if (msg.data) {
                playAudioChunk(msg.data);
              }
              break;
            }

            case 'transcript': {
              if (msg.text) {
                setLiveTranscript(prev => (prev ? `${prev} ${msg.text}` : msg.text));
              }
              break;
            }

            case 'turn_complete': {
              if (activeSourcesRef.current.length === 0) {
                setCallState('listening');
                setStatusMessage(i18n.listening);
                setAudioLevel(1);
              }
              break;
            }

            case 'error': {
              console.error('[Voice Error]:', msg.message);
              setStatusMessage(msg.message || 'Error occurred');
              break;
            }

            case 'session_closed': {
              setCallState('ended');
              setStatusMessage(i18n.callEnded);
              stopAudio();
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error('[Voice Message Parse Error]:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Voice WS Connection Error]:', err);
        setCallState('ended');
        setStatusMessage('Connection failed. Please ensure the server is running.');
      };

      ws.onclose = () => {
        if (callState !== 'idle' && callState !== 'ended') {
          setCallState('ended');
          setStatusMessage(i18n.callEnded);
        }
      };
    } catch (err) {
      console.error('[Voice Start Error]:', err);
      setCallState('ended');
      setStatusMessage(err.message || 'Connection error');
    }
  }, [profile, currentLang, i18n, stopAudio, startMicrophoneCapture, playAudioChunk, callState, onOpenTokenPass]);

  /**
   * End the current call cleanly
   */
  const handleEndCall = () => {
    stopAudio();
    setCallState('ended');
    setStatusMessage(i18n.callEnded);
  };

  /**
   * Toggle mute state
   */
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      setStatusMessage(i18n.muted);
    } else {
      setStatusMessage(i18n.listening);
    }
  };

  /**
   * Open the voice panel and start call if idle
   */
  const handleOpenPanel = () => {
    setIsOpen(true);
    if (callState === 'idle' || callState === 'ended') {
      handleStartCall();
    }
  };

  /**
   * Close modal (ends audio stream)
   */
  const handleClosePanel = () => {
    stopAudio();
    setIsOpen(false);
    if (callState !== 'idle') {
      setCallState('ended');
    }
  };

  /**
   * Handles opening the farmer's full booking screen/pass
   */
  const handleOpenMyBooking = () => {
    if (onOpenTokenPass) {
      onOpenTokenPass();
    }
    handleClosePanel();
    navigate('/');
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const isCallActive = callState === 'listening' || callState === 'speaking' || callState === 'thinking' || callState === 'connecting';

  return (
    <>
      {/* 
        ===================================================================
        FLOATING FARMER VOICE AGENT BUTTON
        - Visible on main Dashboard
        - NOT added to sidebar
        - Large, high contrast, easy touch target for farmers (w-16 h-16)
        - Clear active (pulsing green glow) vs inactive state
        - Accessible label
        ===================================================================
      */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Floating tooltip/label for farmers */}
        {!isOpen && (
          <div
            onClick={handleOpenPanel}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-emerald-200 text-xs font-semibold text-emerald-900 cursor-pointer hover:shadow-xl transition-all select-none animate-fade-in"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span> {i18n.title}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenPanel}
          id="agriqueue-voice-agent-fab"
          aria-label="AgriQueue Voice Assistant"
          title="AgriQueue Voice Assistant"
          className={`relative group flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 ${
            isCallActive
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 shadow-emerald-600/50'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-white shadow-emerald-700/40 hover:scale-105'
          }`}
        >
          {/* Animated pulsing wave when in active call */}
          {isCallActive && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping pointer-events-none" />
          )}

          {/* Active green indicator pip */}
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isCallActive ? 'bg-emerald-500 animate-pulse' : backendReady ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
            />
          </span>

          {/* High contrast telephone icon */}
          {isCallActive ? (
            <PhoneCall className="w-8 h-8 animate-bounce text-white drop-shadow-sm" />
          ) : (
            <Phone className="w-8 h-8 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* 
        ===================================================================
        VOICE AGENT PANEL / MODAL
        - Accessible modal dialog
        - AgriQueue Voice Assistant header
        - Farmer ID & selected language context badges
        - Microphone / listening / thinking / speaking indicator
        - Progress steps / actions indicator
        - Booking preview card before confirmation
        - Confirmed booking details card with verified QR Code
        - "Open My Booking" direct navigation
        - Mute / end-call / reconnect controls
        - Close button
        ===================================================================
      */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Accent Strip */}
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />

            {/* Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="voice-modal-title" className="font-heading font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    {i18n.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {i18n.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Farmer badge */}
                {profile?.farmerId && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {profile.farmerId}
                  </span>
                )}
                {/* Language badge */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {i18n.langBadge}
                </span>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClosePanel}
                  aria-label={i18n.close}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-center">
              {/* Dynamic Animated Disc */}
              <div className="relative flex items-center justify-center py-2">
                {/* Animated Pulsing Rings based on state & audio volume */}
                {isCallActive && !isMuted && (
                  <>
                    <div
                      className={`absolute rounded-full transition-all duration-300 ${
                        callState === 'speaking'
                          ? 'bg-teal-400/25'
                          : callState === 'thinking'
                          ? 'bg-amber-400/25'
                          : 'bg-emerald-400/20'
                      }`}
                      style={{
                        width: `${120 * audioLevel}px`,
                        height: `${120 * audioLevel}px`,
                        animationDuration: callState === 'speaking' ? '1.2s' : '2s'
                      }}
                    />
                    <div
                      className={`absolute rounded-full animate-pulse ${
                        callState === 'speaking'
                          ? 'bg-teal-500/35'
                          : callState === 'thinking'
                          ? 'bg-amber-500/35'
                          : 'bg-emerald-500/30'
                      }`}
                      style={{
                        width: `${100 * audioLevel}px`,
                        height: `${100 * audioLevel}px`
                      }}
                    />
                  </>
                )}

                {/* Central Disc */}
                <div
                  className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
                    isCallActive
                      ? isMuted
                        ? 'bg-amber-500 text-white ring-8 ring-amber-100 shadow-amber-500/30'
                        : callState === 'speaking'
                        ? 'bg-teal-600 text-white ring-8 ring-teal-100 shadow-teal-600/40 animate-pulse'
                        : callState === 'thinking'
                        ? 'bg-amber-600 text-white ring-8 ring-amber-100 shadow-amber-600/40'
                        : 'bg-emerald-600 text-white ring-8 ring-emerald-100 shadow-emerald-600/40'
                      : callState === 'connecting'
                      ? 'bg-emerald-700 text-white ring-8 ring-emerald-100 animate-pulse'
                      : 'bg-slate-200 text-slate-500 ring-8 ring-slate-100'
                  }`}
                >
                  {isCallActive ? (
                    isMuted ? (
                      <MicOff className="w-10 h-10" />
                    ) : callState === 'speaking' ? (
                      <Radio className="w-10 h-10 animate-pulse" />
                    ) : callState === 'thinking' ? (
                      <Sparkles className="w-10 h-10 animate-spin" />
                    ) : (
                      <Mic className="w-10 h-10 animate-pulse" />
                    )
                  ) : callState === 'connecting' ? (
                    <Radio className="w-10 h-10 animate-spin" />
                  ) : (
                    <Phone className="w-10 h-10" />
                  )}
                </div>
              </div>

              {/* Status Badges & Spoken Message */}
              <div className="space-y-1.5 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2">
                  {callState === 'listening' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      {i18n.listening}
                    </span>
                  ) : callState === 'speaking' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold animate-pulse">
                      <Radio className="w-3.5 h-3.5 text-teal-600" />
                      {i18n.speaking}
                    </span>
                  ) : callState === 'thinking' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      {i18n.thinking}
                    </span>
                  ) : callState === 'connecting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold animate-pulse">
                      <Radio className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      {i18n.connecting}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                      {i18n.callEnded}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-800 min-h-[1.5rem]">
                  {statusMessage || (isCallActive ? i18n.ready : i18n.callEnded)}
                </p>

                {liveTranscript && (
                  <p className="text-xs text-emerald-900 bg-emerald-50/90 rounded-xl p-2.5 border border-emerald-200 max-h-20 overflow-y-auto italic">
                    "{liveTranscript}"
                  </p>
                )}
              </div>

              {/* 
                ===================================================================
                1. AGENT ACTION / PROGRESS PANEL
                - Friendly non-technical status indicators
                - Shows active progress steps
                ===================================================================
              */}
              {activeActionStep && (
                <div className="w-full bg-slate-50/90 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    {activeActionStep === 'finding_mandis' && (
                      <>
                        <span className="text-base"></span>
                        <span>{i18n.progressFindingMandis}</span>
                      </>
                    )}
                    {activeActionStep === 'checking_slots' && (
                      <>
                        <span className="text-base"></span>
                        <span>{i18n.progressCheckingSlots}</span>
                      </>
                    )}
                    {activeActionStep === 'preparing_booking' && (
                      <>
                        <span className="text-base"></span>
                        <span>{i18n.progressPreparingBooking}</span>
                      </>
                    )}
                    {activeActionStep === 'waiting_confirmation' && (
                      <>
                        <span className="text-base animate-pulse"></span>
                        <span className="text-amber-700 font-bold">{i18n.progressWaitingConfirmation}</span>
                      </>
                    )}
                    {activeActionStep === 'booking_slot' && (
                      <>
                        <span className="text-base animate-spin"></span>
                        <span className="text-emerald-700 font-bold">{i18n.progressBookingSlot}</span>
                      </>
                    )}
                    {activeActionStep === 'booking_confirmed' && (
                      <>
                        <span className="text-base"></span>
                        <span className="text-emerald-800 font-bold">{i18n.progressBookingConfirmed}</span>
                      </>
                    )}
                    {activeActionStep === 'showing_qr' && (
                      <>
                        <span className="text-base"></span>
                        <span>{i18n.progressShowingQr}</span>
                      </>
                    )}
                  </div>

                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              {/* 
                ===================================================================
                2. BOOKING PREVIEW CARD (BEFORE VERBAL CONFIRMATION)
                - Appears when PREPARE_BOOKING_SUMMARY tool is executed
                - Farmer must still verbally confirm ("Yes" / "No")
                ===================================================================
              */}
              {bookingPreview && !confirmedBooking && (
                <div className="w-full bg-amber-50/90 rounded-2xl p-4 border border-amber-300 text-left space-y-3 animate-fade-in shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{i18n.summaryTitle}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold animate-pulse">
                       Pending Confirmation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">{i18n.mandiLabel}:</span>
                        <span className="font-bold text-slate-900">{bookingPreview.mandiName}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Wheat className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">{i18n.cropLabel}:</span>
                        <span className="font-bold text-slate-900">{bookingPreview.cropName}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">{i18n.quantityLabel}:</span>
                        <span className="font-bold text-slate-900">{bookingPreview.estimatedQuantity} {i18n.quintals}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">{i18n.dateLabel}:</span>
                        <span className="font-bold text-slate-900">{bookingPreview.slotDate || new Date().toISOString().slice(0, 10)}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-start gap-1.5 pt-1 border-t border-amber-100">
                      <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">{i18n.slotLabel}:</span>
                        <span className="font-bold text-slate-900">{bookingPreview.timeSlot || '09:00 AM – 10:00 AM'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-amber-900 font-semibold text-center bg-amber-100/80 py-1.5 px-2 rounded-lg">
                     {i18n.confirmQuestion}
                  </p>
                </div>
              )}

              {/* 
                ===================================================================
                3. REAL CONFIRMED BOOKING CARD WITH QR PASS & BUTTONS
                - Appears when BOOK_MANDI_SLOT completes successfully
                - Displays real database token & booking ID
                - Reuses canonical BookingQRCode component
                ===================================================================
              */}
              {confirmedBooking && (
                <div className="w-full bg-emerald-50 rounded-2xl p-4 border border-emerald-300 text-left space-y-3 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{i18n.bookingConfirmedTitle}</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs shadow-sm">
                      {confirmedBooking.tokenNumber}
                    </span>
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white/90 p-3 rounded-xl border border-emerald-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.bookingIdLabel}:</span>
                      <span className="font-mono font-bold text-slate-900">{confirmedBooking.bookingId}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.timeLabel}:</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.timeSlot}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.mandiLabel}:</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.mandiName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.cropLabel} & {i18n.quantityLabel}:</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.cropName} • {confirmedBooking.estimatedQuantity} {i18n.quintals}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.farmersAheadLabel}:</span>
                      <span className="font-semibold text-slate-900"> {confirmedBooking.farmersAhead ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{i18n.estimatedWaitLabel}:</span>
                      <span className="font-semibold text-emerald-700">⏱️ {confirmedBooking.estimatedWait || '0 min'}</span>
                    </div>
                  </div>

                  {/* 4. Standards-Compliant QR Code Rendering */}
                  {showQrCode && (
                    <div className="pt-2 pb-1 flex flex-col items-center bg-white p-3 rounded-2xl border border-emerald-200 animate-fade-in shadow-inner">
                      <BookingQRCode
                        bookingId={confirmedBooking.bookingId}
                        tokenNumber={confirmedBooking.tokenNumber}
                        size={210}
                        theme="light"
                      />
                      <p className="text-[11px] text-slate-500 mt-2 text-center">
                        {i18n.showQrAtCenter}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons: Toggle QR & Open My Booking */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQrCode(prev => !prev)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{showQrCode ? i18n.btnHideQr : i18n.btnShowMyQr}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenMyBooking}
                      id="voice-open-my-booking-btn"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{i18n.btnOpenMyBooking}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Suggestions Card */}
              {!bookingPreview && !confirmedBooking && (
                <div className="w-full text-left bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{i18n.hintTitle}</span>
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>"{i18n.hint1}"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>"{i18n.hint2}"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>"{i18n.hint3}"</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Security & Database preservation note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{i18n.securityNote}</span>
              </div>
            </div>

            {/* Bottom Call Controls */}
            <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-around gap-4">
              {isCallActive ? (
                <>
                  {/* Mute / Unmute Button */}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={isMuted ? i18n.unmute : i18n.mute}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 ${
                      isMuted
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-600" />}
                    <span>{isMuted ? i18n.unmute : i18n.mute}</span>
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={handleEndCall}
                    aria-label={i18n.endCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span>{i18n.endCall}</span>
                  </button>
                </>
              ) : (
                /* Reconnect / Start Call Button */
                <button
                  type="button"
                  onClick={handleStartCall}
                  aria-label={i18n.startCall}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>{i18n.startCall}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FarmerVoiceAgent;
