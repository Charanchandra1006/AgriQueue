# 🌾 AgriQueue — Smart Agricultural Mandi Queue Management System

> Digitizing India's Agricultural Procurement Chain

AgriQueue is a full-stack web platform that empowers farmers to digitally register, browse verified Mandi centers, book procurement slots, track farm-to-Mandi transport, monitor live market prices, and interact with a **Gemini-powered multilingual AI voice assistant** — all in their preferred language (English, Hindi, Punjabi, Telugu).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🪪 **Farmer Registration** | Phone-based onboarding with language preference |
| 🗺️ **Mandi Map** | Interactive Leaflet map of verified procurement centers |
| 📋 **Mandi Centers** | Searchable, filterable list with district/mandal hierarchy |
| 📅 **Slot Booking** | Real-time slot availability and QR token generation |
| 🚛 **Transport Booking** | Farm-to-Mandi haulage requests with live driver tracking |
| 📈 **Market Prices** | Live AGMARKNET data from Government of India (data.gov.in) |
| 🤖 **AI Voice Agent** | Gemini Live multilingual voice booking assistant |
| 🌦️ **Weather Alerts** | Localized farm weather warnings |
| 🏛️ **Govt. Schemes** | PM-Kisan, PMFBY and other scheme browser |
| 🌱 **Crop Doctor** | AI-powered crop disease identification |

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 8, TailwindCSS 4, React Router 7, Recharts, Leaflet, lucide-react
- **Backend:** Node.js 22, Express.js 4, WebSockets (ws)
- **Database:** TiDB Serverless (MySQL-compatible) via `mysql2`
- **AI:** Google Gemini Live API (`gemini-2.5-flash-native-audio-latest`)
- **Data Source:** Government of India — AGMARKNET / data.gov.in

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A free [TiDB Serverless](https://tidbcloud.com/) cluster (or any MySQL 8+ server)
- (Optional) A [data.gov.in](https://data.gov.in) API key for live Mandi prices
- (Optional) A Google [Gemini API key](https://aistudio.google.com/) for the Voice Agent

### 1. Clone & Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment

**Frontend** — copy and fill `d:\AgriQueue\.env`:
```bash
cp .env.example .env
```
```env
VITE_API_URL=http://localhost:5000/api
VITE_ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX   # Optional
```

**Backend** — copy and fill `server/.env`:
```bash
cp server/.env.example server/.env
```
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# TiDB Serverless (or any MySQL 8+)
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_tidb_username
DB_PASSWORD=your_tidb_password
DB_NAME=test
DB_SSL=true

# Optional: Live Mandi prices from Government of India
# Register at https://data.gov.in to get your key
DATA_GOV_API_KEY=

# Optional: Gemini AI Voice Agent
GEMINI_API_KEY=
```

### 3. Initialize the Database

```bash
cd server

# Test your DB connection first
npm run test-db

# Create all 6 tables (farmers, mandis, bookings, etc.)
npm run db:init

# Seed the 56 verified Karimnagar Mandi centers
npm run db:import-karimnagar

# (Optional) Import national Mandi data — requires DATA_GOV_API_KEY
npm run db:import-mandis

# Audit database integrity
npm run db:check-integrity
```

### 4. Start the Application

Open **two** terminal windows:

```bash
# Terminal 1: Start Backend (Express on port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend (Vite on port 5173)
npm run dev
```

Open your browser at **http://localhost:5173**

---

## 📁 Project Structure

```
AgriQueue/
├── src/                        # React Frontend
│   ├── pages/                  # 14 full-page views
│   ├── components/             # Reusable UI components
│   ├── context/AppContext.jsx  # Global state management
│   ├── services/api.js         # HTTP client for backend API
│   └── i18n/                   # Multilingual support (en/hi/pa/te)
│
├── server/                     # Express Backend
│   ├── index.js                # Entry point + WebSocket
│   ├── config/db.js            # TiDB connection pool
│   ├── routes/                 # 7 REST API route files
│   ├── services/               # Gemini AI + market prices logic
│   └── database/               # Schema, seeders, integrity checker
│
├── .env.example                # Frontend env template
├── server/.env.example         # Backend env template
└── package.json
```

---

## 🗄️ Database Schema

6 tables with full relational integrity:

```
farmers ──────────┐
                  ├──► bookings ──────────┐
mandis ──► mandi_slots ──────────────────┘
                                          └──► transport_bookings
market_prices (independent)
```

---

## 🌐 API Endpoints

| Group | Base Path | Endpoints |
|---|---|---|
| Health | `/api/health` | `GET /` |
| Farmers | `/api/farmers` | `POST /`, `GET /:id`, `PUT /:id` |
| Mandis | `/api/mandis` | `GET /`, `GET /:id`, `GET /:id/slots`, `GET /hierarchy/karimnagar` |
| Bookings | `/api/bookings` | `POST /`, `GET /active/:id`, `GET /history/:id`, `POST /:id/cancel` |
| Market Prices | `/api/market-prices` | `GET /`, `GET /trends`, `POST /sync` |
| Transport | `/api/transport` | `POST /book`, `GET /active/:id`, `POST /:id/assign-driver` |
| Voice AI | `/api/voice` | `POST /session`, `GET /status` |

---

## 🤖 AI Voice Agent

The AgriQueue Voice Agent uses **Gemini Live** to provide real-time multilingual voice booking:
- Speaks in the farmer's preferred language (English, Hindi, Punjabi, Telugu)
- Can search mandis, check slot availability, and book slots — all via voice
- Features an **UNBREAKABLE confirmation gate** — never books without explicit farmer verbal consent

> Requires a valid `GEMINI_API_KEY` in `server/.env`

---

## 🔒 Security

- All API keys and DB credentials are in server-side `.env` files (gitignored)
- TiDB Cloud connection uses SSL encryption (`DB_SSL=true`)
- CORS is restricted to the frontend URL only
- Gemini API key never reaches the browser — all AI calls are proxied through the backend

---

## 📦 Available Scripts

### Root (Frontend)
| Script | Action |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run Oxlint |

### Server (Backend)
| Script | Action |
|---|---|
| `npm run dev` | Start Express with hot-reload |
| `npm run test-db` | Test TiDB connection |
| `npm run db:init` | Create all database tables |
| `npm run db:import-mandis` | Import from data.gov.in |
| `npm run db:import-karimnagar` | Seed Karimnagar centers |
| `npm run db:check-integrity` | Audit DB data quality |

---

## 📄 License

This project is an open initiative to digitize India's agricultural mandi procurement and queue management system.