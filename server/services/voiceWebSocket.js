import { WebSocketServer, WebSocket } from 'ws';
import { createGeminiLiveStreamingSession } from './geminiLiveService.js';
import {
  findAvailableMandis,
  checkAvailableSlots,
  executeMandiBooking
} from './mandiBookingService.js';

let wssInstance = null;

/**
 * Initializes and mounts the WebSocket server for Gemini Live voice communication
 * @param {import('http').Server} server - The HTTP server instance
 */
export const setupVoiceWebSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: '/ws/voice'
  });

  wssInstance = wss;

  console.log('🎙️ Voice WebSocket server listening on /ws/voice');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[Voice WS] Client connected from ${clientIp}`);

    let geminiLiveSession = null;
    let isSessionInitialized = false;
    let currentFarmerContext = null;

    // Helper to safely send JSON to the connected client
    const sendToClient = (payload) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(payload));
        } catch (err) {
          console.error('[Voice WS] Error sending to client:', err.message);
        }
      }
    };

    // Clean up Gemini session
    const cleanupSession = () => {
      if (geminiLiveSession) {
        try {
          geminiLiveSession.close();
        } catch {
          // ignore
        }
        geminiLiveSession = null;
      }
      isSessionInitialized = false;
      currentFarmerContext = null;
    };

    // Handler for tool calls issued by Gemini Live
    const handleToolCall = async (toolCall) => {
      if (!toolCall || !toolCall.functionCalls) return;

      const functionResponses = [];

      for (const call of toolCall.functionCalls) {
        const { name, args, id } = call;
        console.log(`[Voice WS] Executing controlled tool: ${name}`, args);

        sendToClient({
          type: 'tool_call',
          name,
          args
        });

        let result = null;

        try {
          switch (name) {
            case 'FIND_AVAILABLE_MANDIS': {
              result = await findAvailableMandis({
                farmerId: args?.farmerId || currentFarmerContext?.farmerId,
                state: args?.state || currentFarmerContext?.state,
                district: args?.district || currentFarmerContext?.district,
                mandiSearch: args?.mandiSearch,
                crop: args?.crop
              });
              break;
            }

            case 'CHECK_AVAILABLE_SLOTS': {
              result = await checkAvailableSlots({
                mandiId: args?.mandiId,
                crop: args?.crop,
                date: args?.date
              });
              break;
            }

            case 'PREPARE_BOOKING_SUMMARY': {
              result = { success: true, readyForConfirmation: true };
              sendToClient({
                type: 'booking_preview',
                data: {
                  mandiId: args?.mandiId,
                  mandiName: args?.mandiName,
                  cropName: args?.cropName,
                  estimatedQuantity: args?.estimatedQuantity,
                  slotDate: args?.slotDate,
                  timeSlot: args?.timeSlot
                }
              });
              break;
            }

            case 'SHOW_MY_QR': {
              result = { success: true, message: 'Showing QR code' };
              sendToClient({
                type: 'navigate_to_qr',
                data: { openPass: true }
              });
              break;
            }

            case 'BOOK_MANDI_SLOT': {
              result = await executeMandiBooking({
                farmerId: args?.farmerId || currentFarmerContext?.farmerId,
                mandiId: args?.mandiId,
                slotId: args?.slotId,
                timeSlot: args?.timeSlot,
                cropName: args?.cropName,
                estimatedQuantity: args?.estimatedQuantity,
                slotDate: args?.slotDate
              });

              if (result.success) {
                console.log(`[Voice WS] Real booking created: Token ${result.tokenNumber}, ID ${result.bookingId}`);
                sendToClient({
                  type: 'booking_confirmed',
                  data: result
                });
              }
              break;
            }

            default:
              result = { success: false, error: `Unknown tool: ${name}` };
              break;
          }
        } catch (err) {
          console.error(`[Voice WS] Tool execution error for ${name}:`, err.message);
          result = { success: false, error: err.message };
        }

        // Send tool_result to client for progress UI feedback
        sendToClient({
          type: 'tool_result',
          name,
          args,
          result
        });

        functionResponses.push({
          id,
          name,
          response: {
            output: result
          }
        });
      }

      if (geminiLiveSession && functionResponses.length > 0) {
        geminiLiveSession.sendToolResponse(functionResponses);
      }
    };

    ws.on('message', async (messageData) => {
      try {
        let msg;
        try {
          msg = JSON.parse(messageData.toString());
        } catch {
          // Non-JSON message, ignore
          return;
        }

        switch (msg.type) {
          case 'init': {
            if (isSessionInitialized) {
              cleanupSession();
            }

            const farmerContext = {
              farmerId: msg.farmerId || 'Unknown',
              farmerName: msg.farmerName || 'Farmer',
              language: msg.language || 'en',
              district: msg.district || '',
              state: msg.state || ''
            };
            currentFarmerContext = farmerContext;

            sendToClient({
              type: 'state',
              state: 'connecting',
              message: 'Connecting to Gemini Live...'
            });

            try {
              geminiLiveSession = await createGeminiLiveStreamingSession({
                farmerContext,
                onStateChange: (state) => {
                  sendToClient({ type: 'state', state });
                },
                onAudioChunk: ({ mimeType, data }) => {
                  sendToClient({
                    type: 'audio',
                    mimeType,
                    data
                  });
                },
                onTextChunk: (text) => {
                  sendToClient({
                    type: 'transcript',
                    text
                  });
                },
                onTurnComplete: () => {
                  sendToClient({
                    type: 'turn_complete'
                  });
                },
                onToolCall: (toolCall) => {
                  handleToolCall(toolCall);
                },
                onError: (err) => {
                  console.error('[Voice WS Gemini Error]:', err.message);
                  sendToClient({
                    type: 'error',
                    message: err.message
                  });
                },
                onClose: (e) => {
                  console.log(`[Voice WS Gemini Closed]: code ${e?.code}`);
                  sendToClient({
                    type: 'session_closed',
                    code: e?.code
                  });
                }
              });

              isSessionInitialized = true;
              sendToClient({
                type: 'session_ready',
                language: farmerContext.language,
                farmerId: farmerContext.farmerId
              });
            } catch (initErr) {
              console.error('[Voice WS Init Failed]:', initErr.message);
              sendToClient({
                type: 'error',
                message: `Failed to initialize voice session: ${initErr.message}`
              });
              sendToClient({
                type: 'state',
                state: 'disconnected'
              });
            }
            break;
          }

          case 'audio': {
            // Forward base64 PCM chunk to Gemini Live
            if (geminiLiveSession && msg.data) {
              geminiLiveSession.sendAudioChunk(msg.data);
            }
            break;
          }

          case 'text': {
            // Optional text input directly sent to Gemini Live
            if (geminiLiveSession && msg.text) {
              sendToClient({ type: 'state', state: 'thinking' });
              geminiLiveSession.sendTextTurn(msg.text);
            }
            break;
          }

          case 'end': {
            console.log('[Voice WS] Client requested end call');
            cleanupSession();
            sendToClient({
              type: 'state',
              state: 'disconnected',
              message: 'Call disconnected'
            });
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[Voice WS Message Processing Error]:', err.message);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[Voice WS] Client disconnected (${code} - ${reason || 'normal'})`);
      cleanupSession();
    });

    ws.on('error', (err) => {
      console.error('[Voice WS Client Error]:', err.message);
      cleanupSession();
    });
  });

  return wss;
};

/**
 * Cleanly closes the WebSocket server during application shutdown
 */
export const closeVoiceWebSocket = async () => {
  if (wssInstance) {
    return new Promise((resolve) => {
      wssInstance.close(() => {
        console.log('✅ Voice WebSocket server closed.');
        wssInstance = null;
        resolve();
      });
    });
  }
};
