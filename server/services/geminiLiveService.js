import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

/**
 * Official Gemini Live model for real-time multimodal bidirectional communication
 */
export const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-latest';

/**
 * Language labels for prompt context
 */
const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  te: 'Telugu'
};

/**
 * Confirmation questions in all 4 supported languages
 */
const CONFIRMATION_QUESTIONS = {
  en: 'Shall I confirm this booking?',
  hi: 'क्या मैं यह बुकिंग पक्की कर दूं?',
  pa: 'ਕੀ ਮੈਂ ਇਹ ਬੁਕਿੰਗ ਪੱਕੀ ਕਰ ਦੇਵਾਂ?',
  te: 'నేను ఈ బుకింగ్ ఖరారు చేయమంటారా?'
};

/**
 * Natural spoken action phrases in all 4 supported languages
 */
export const SPOKEN_PHRASES = {
  en: {
    checkingSlots: 'Let me check available mandi slots.',
    slotFound: 'I found an available slot.',
    needConfirmation: 'Please confirm before I book it.',
    bookingConfirmed: 'Your mandi slot is booked.',
    showingQR: 'I am showing your QR code now.'
  },
  te: {
    checkingSlots: 'Available mandi slots check chestunnanu.',
    slotFound: 'Slot dorikindi.',
    needConfirmation: 'Book cheyyadaniki mundu mee confirmation kavali.',
    bookingConfirmed: 'Mee mandi slot book ayyindi.',
    showingQR: 'Idigo mee QR code.'
  },
  hi: {
    checkingSlots: 'Main available mandi slots check kar raha hoon.',
    slotFound: 'Slot mil gaya hai.',
    needConfirmation: 'Booking se pehle aapki confirmation chahiye.',
    bookingConfirmed: 'Aapka mandi slot book ho gaya hai.',
    showingQR: 'Main aapka QR code dikha raha hoon.'
  },
  pa: {
    checkingSlots: 'Main available mandi slots check kar reha haan.',
    slotFound: 'Slot mil gaya hai.',
    needConfirmation: 'Booking ton pehlan tuhadi confirmation chahidi hai.',
    bookingConfirmed: 'Tuhada mandi slot book ho gaya hai.',
    showingQR: 'Main tuhadda QR code dikha reha haan.'
  }
};

/**
 * Controlled Gemini function / tool declarations for AgriQueue Mandi Booking System
 */
export const MANDI_BOOKING_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'FIND_AVAILABLE_MANDIS',
        description: 'Finds available mandis/procurement centers in the farmer\'s registered district and state with optional search text or crop filter.',
        parameters: {
          type: 'OBJECT',
          properties: {
            farmerId: { type: 'STRING', description: 'The registered farmer identifier' },
            state: { type: 'STRING', description: 'State name (e.g. Telangana, Punjab, Haryana)' },
            district: { type: 'STRING', description: 'District name (e.g. Karimnagar, Patiala)' },
            mandiSearch: { type: 'STRING', description: 'Optional search text for mandi name or location' },
            crop: { type: 'STRING', description: 'Optional crop name (e.g. Paddy, Wheat, Cotton, Maize)' }
          },
          required: ['district']
        }
      },
      {
        name: 'CHECK_AVAILABLE_SLOTS',
        description: 'Checks real-time available procurement slots and remaining capacity for a specific mandi and date.',
        parameters: {
          type: 'OBJECT',
          properties: {
            mandiId: { type: 'INTEGER', description: 'The unique numeric ID of the mandi' },
            crop: { type: 'STRING', description: 'Name of the crop being brought (e.g. Paddy, Wheat)' },
            date: { type: 'STRING', description: 'Date in YYYY-MM-DD format (e.g. 2026-09-24)' }
          },
          required: ['mandiId']
        }
      },
      {
        name: 'PREPARE_BOOKING_SUMMARY',
        description: 'Presents the collected booking details on the farmer\'s screen before asking for their confirmation. Invoke this tool as soon as you have identified the mandi, crop, quantity, date, and slot time, right before asking the verbal confirmation question.',
        parameters: {
          type: 'OBJECT',
          properties: {
            mandiId: { type: 'INTEGER', description: 'Numeric ID of the mandi' },
            mandiName: { type: 'STRING', description: 'Real name of the mandi center' },
            cropName: { type: 'STRING', description: 'Name of the crop' },
            estimatedQuantity: { type: 'NUMBER', description: 'Estimated crop quantity in quintals' },
            slotDate: { type: 'STRING', description: 'Date in YYYY-MM-DD or readable format' },
            timeSlot: { type: 'STRING', description: 'Time slot label (e.g. 09:00 AM – 10:00 AM)' }
          },
          required: ['mandiName', 'cropName', 'estimatedQuantity']
        }
      },
      {
        name: 'SHOW_MY_QR',
        description: 'Opens and displays the farmer\'s procurement booking QR code on their screen. Call this tool when the farmer asks to show, display, or open their QR code or booking token (e.g. "Show my QR", "QR chupinchu", "मेरी QR दिखाओ", "ਮੇਰਾ QR ਦਿਖਾਓ").',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: { type: 'STRING', description: 'Reason for opening QR code' }
          }
        }
      },
      {
        name: 'BOOK_MANDI_SLOT',
        description: 'Books a confirmed procurement slot in the database. CRITICAL: NEVER invoke this tool until the farmer has explicitly replied YES/CONFIRM to your verbal confirmation question.',
        parameters: {
          type: 'OBJECT',
          properties: {
            farmerId: { type: 'STRING', description: 'Registered farmer ID' },
            mandiId: { type: 'INTEGER', description: 'Mandi numeric ID' },
            slotId: { type: 'STRING', description: 'Slot ID or timeSlot label (e.g. "09:00 AM – 10:00 AM")' },
            timeSlot: { type: 'STRING', description: 'Time slot label (e.g. "09:00 AM – 10:00 AM")' },
            cropName: { type: 'STRING', description: 'Name of the crop' },
            estimatedQuantity: { type: 'NUMBER', description: 'Estimated crop quantity in quintals' },
            slotDate: { type: 'STRING', description: 'Date in YYYY-MM-DD format' }
          },
          required: ['farmerId', 'mandiId', 'cropName', 'estimatedQuantity']
        }
      }
    ]
  }
];

/**
 * Instantiates the GoogleGenAI client using the server-side environment key.
 * Throws an informative error if GEMINI_API_KEY is missing.
 */
export const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PASTE_MY_KEY_HERE' || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Builds the system instruction for AgriQueue Farmer Voice Agent.
 * Enforces dynamic farmer context, 4-language support, database entity preservation,
 * and the strict verbal confirmation gateway for booking.
 */
export const buildSystemInstruction = ({ farmerId, farmerName, language, district, state }) => {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const confirmQuestion = CONFIRMATION_QUESTIONS[language] || 'Shall I confirm this booking?';
  const phrases = SPOKEN_PHRASES[language] || SPOKEN_PHRASES.en;

  return `You are the AgriQueue Farmer Voice Assistant (आवाज़ सहायक), an empathetic, reliable, and helpful agricultural assistant in India.

CURRENT LOGGED-IN FARMER CONTEXT:
- Farmer ID: ${farmerId || 'Unknown'}
- Name: ${farmerName || 'Farmer'}
- Registered District: ${district || 'Karimnagar'}
- Registered State: ${state || 'Telangana'}
- Active Language: ${langName}

CRITICAL RULES:
1. Always converse politely in ${langName}. If the farmer speaks in another language, respond in their language or ${langName}.
2. DO NOT ASK the farmer for their Farmer ID. You already know it is ${farmerId || 'the logged-in farmer'}.
3. LOCATION: Always prioritize the farmer's registered district (${district || 'Karimnagar'}) and state (${state || 'Telangana'}). Do not hardcode; search dynamically based on the farmer's location.
4. DO NOT TRANSLATE database entities or identification values:
   - Farmer names (e.g. keep "Ramesh Kumar", "Balwinder Singh" as is)
   - Mandi / procurement center names (e.g. keep "Choppadandi AMC", "V.Saidapur APMC", "Patiala New Anaj Mandi" as is)
   - Village and District names (e.g. keep "Karimnagar", "Thimmapur", "Kunjpura" as is)
   - Booking IDs and Token numbers (e.g. keep "BK-2026-8849", "#A102", "#C105" as is)
   - Slot IDs and formatted times (e.g. keep "09:00 AM – 10:00 AM" as is)
5. Keep spoken replies short, natural, friendly, and easy to hear over a phone call in a rural setting.

EXPLAINING ACTIONS VERBALLY TO THE FARMER (Always speak these natural phrases in ${langName}):
- When checking slots: "${phrases.checkingSlots}"
- When an available slot is found: "${phrases.slotFound}"
- When asking for confirmation: "${phrases.needConfirmation} ${confirmQuestion}"
- When booking succeeds: "${phrases.bookingConfirmed}"
- When showing the QR code: "${phrases.showingQR}"

MANDI BOOKING WORKFLOW (CONTROLLED TOOLS):
You have 5 tools: FIND_AVAILABLE_MANDIS, CHECK_AVAILABLE_SLOTS, PREPARE_BOOKING_SUMMARY, BOOK_MANDI_SLOT, and SHOW_MY_QR.

Step 1: When a farmer wants to book a mandi slot or sell their harvest:
- Call FIND_AVAILABLE_MANDIS with district: "${district || 'Karimnagar'}" and state: "${state || 'Telangana'}".
- If multiple mandis exist or the choice is ambiguous, recite the top 2-3 options and ask the farmer which one they prefer. Never guess the mandi!

Step 2: Check live slot availability:
- Say: "${phrases.checkingSlots}"
- Call CHECK_AVAILABLE_SLOTS for the chosen mandiId and date.
- When slot is available, say: "${phrases.slotFound}"
- If no slots are available on the date, tell the farmer clearly and offer an alternative slot or date.
- If crop name is missing, ask the farmer which crop they are bringing.
- If estimated quantity is missing, ask how many quintals they plan to bring.
- If date is missing, propose today or ask for their preferred date.

Step 2.5: Prepare visual booking summary for farmer:
- Once you know the mandi, crop, quantity, date, and slot time, call PREPARE_BOOKING_SUMMARY with these details so they display clearly on the farmer's visual screen.

Step 3: **UNBREAKABLE VERBAL CONFIRMATION RULE**:
Before executing BOOK_MANDI_SLOT, you MUST verbally summarize all 5 details:
1. Mandi name
2. Crop name
3. Date
4. Slot time
5. Estimated quantity (in quintals)

And explicitly ask the confirmation phrase and question in ${langName}:
"${phrases.needConfirmation} ${confirmQuestion}"

**ABSOLUTE PROHIBITION**:
DO NOT call BOOK_MANDI_SLOT in the same turn that you ask for confirmation!
You MUST pause, stop tool calls, speak the summary and confirmation question, and wait for the farmer's reply.

Step 4: After the farmer speaks:
- If the farmer clearly says YES (e.g. "Yes", "Confirm", "Aunu", "Haan", "Theek hai", "Proceed", "Kardo", "Ha ji"):
  NOW invoke BOOK_MANDI_SLOT.
- If the farmer says NO (e.g. "No", "Cancel", "Stop", "Vadhu", "Nahi", "Nako", "Ruk jao"):
  DO NOT call BOOK_MANDI_SLOT. Respect their choice, confirm that no booking was made, and ask how else you can help.

Step 5: When BOOK_MANDI_SLOT succeeds:
Say "${phrases.bookingConfirmed}" and "${phrases.showingQR}".
Read back the REAL returned Token Number (e.g. #C101), Booking ID (e.g. BK-xxxxxx-xxx), Mandi name, and Slot time clearly so the farmer can note it down.

Step 6: When the farmer asks to see or show their QR code (e.g. "Show my QR", "QR chupinchu", "मेरी QR दिखाओ", "ਮੇਰਾ QR ਦਿਖਾਓ"):
Say "${phrases.showingQR}" and invoke the tool SHOW_MY_QR so the QR pass is opened on their screen.`;
};

/**
 * Verifies that the backend can connect to the Gemini Live service.
 * Confirms connection setup and cleanly closes.
 */
export const verifyGeminiLiveConnection = async () => {
  const ai = getGenAIClient();
  let liveSession = null;

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (liveSession && liveSession.close) {
          try { liveSession.close(); } catch { /* ignore */ }
        }
        reject(new Error('Connection to Gemini Live timed out after 10 seconds'));
      }
    }, 10000);

    ai.live.connect({
      model: GEMINI_LIVE_MODEL,
      config: {
        responseModalities: ['AUDIO'],
        tools: MANDI_BOOKING_TOOLS
      },
      callbacks: {
        onopen: () => {
          // Socket opened
        },
        onmessage: (msg) => {
          if (!resolved && (msg.setupComplete || msg.serverContent)) {
            resolved = true;
            clearTimeout(timeout);
            setTimeout(() => {
              if (liveSession && liveSession.close) {
                try { liveSession.close(); } catch { /* ignore */ }
              }
            }, 100);
            resolve({
              connected: true,
              model: GEMINI_LIVE_MODEL,
              message: 'Gemini Live connection verified successfully'
            });
          }
        },
        onerror: (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(err?.message || 'Gemini Live connection error'));
          }
        },
        onclose: (e) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (e && e.code === 1008) {
              reject(new Error(`Gemini Live connection rejected (code 1008): ${e.reason || 'Model not supported'}`));
            } else {
              reject(new Error(`Gemini Live closed prematurely (code ${e?.code || 'unknown'})`));
            }
          }
        }
      }
    }).then(session => {
      liveSession = session;
    }).catch(err => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
};

/**
 * Prepares and registers an active voice session context for a farmer.
 */
export const createVoiceSessionContext = ({ farmerId, farmerName, language = 'en', district, state }) => {
  const ai = getGenAIClient();
  const systemInstruction = buildSystemInstruction({ farmerId, farmerName, language, district, state });
  const sessionId = `voice_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    sessionId,
    status: 'ready',
    model: GEMINI_LIVE_MODEL,
    language,
    languageName: LANGUAGE_NAMES[language] || 'English',
    farmerId: farmerId || null,
    systemInstruction,
    hasApiKey: !!ai,
    createdAt: new Date().toISOString()
  };
};

/**
 * Creates and manages a live bidirectional Gemini streaming session with controlled mandi tools.
 */
export const createGeminiLiveStreamingSession = async ({
  farmerContext,
  onAudioChunk,
  onTextChunk,
  onTurnComplete,
  onStateChange,
  onToolCall,
  onError,
  onClose
}) => {
  const ai = getGenAIClient();
  const systemInstruction = buildSystemInstruction(farmerContext || {});

  let session = null;
  let isClosed = false;

  session = await ai.live.connect({
    model: GEMINI_LIVE_MODEL,
    config: {
      responseModalities: ['AUDIO'],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      tools: MANDI_BOOKING_TOOLS
    },
    callbacks: {
      onopen: () => {
        if (onStateChange) onStateChange('connected');
      },
      onmessage: (msg) => {
        if (isClosed) return;

        if (msg.setupComplete) {
          if (onStateChange) onStateChange('listening');
        }

        // Handle tool calls from Gemini
        if (msg.toolCall && onToolCall) {
          onToolCall(msg.toolCall);
        }

        if (msg.serverContent) {
          const parts = msg.serverContent.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.text && onTextChunk) {
              onTextChunk(part.text);
            }
            if (part.inlineData?.data && onAudioChunk) {
              if (onStateChange) onStateChange('speaking');
              onAudioChunk({
                mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                data: part.inlineData.data
              });
            }
          }

          if (msg.serverContent.turnComplete) {
            if (onTurnComplete) onTurnComplete();
            if (onStateChange) onStateChange('listening');
          }

          if (msg.serverContent.interrupted) {
            if (onStateChange) onStateChange('listening');
          }
        }
      },
      onerror: (err) => {
        if (onError) onError(err);
      },
      onclose: (e) => {
        isClosed = true;
        if (onClose) onClose(e);
      }
    }
  });

  return {
    sendAudioChunk: (base64PcmData) => {
      if (isClosed || !session) return;
      try {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64PcmData
          }
        });
      } catch (err) {
        console.error('[Gemini Live Send Error]:', err.message);
      }
    },
    sendTextTurn: (text) => {
      if (isClosed || !session) return;
      try {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true
        });
      } catch (err) {
        console.error('[Gemini Live Send Client Content Error]:', err.message);
      }
    },
    sendToolResponse: (functionResponses) => {
      if (isClosed || !session) return;
      try {
        session.sendToolResponse({ functionResponses });
      } catch (err) {
        console.error('[Gemini Live Send Tool Response Error]:', err.message);
      }
    },
    close: () => {
      if (isClosed) return;
      isClosed = true;
      try {
        if (session && session.close) {
          session.close();
        }
      } catch (e) {
        // ignore
      }
    }
  };
};
