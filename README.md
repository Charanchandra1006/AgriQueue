# AgriQueue

**Smart Agricultural Mandi Queue & Procurement Management System**

AgriQueue is a full-stack web platform and algorithmic scheduling engine that digitizes agricultural procurement workflows. It enables farmers to register profiles, browse verified Mandi centres, book time-slotted procurement tokens, coordinate farm-to-mandi transport, track live AGMARKNET market prices, and interact with a multilingual AI voice assistant in English, Hindi, Punjabi, and Telugu.

---

## Overview

Traditional agricultural procurement centres often suffer from unscheduled arrivals, 6–14 hour waiting queues, and uneven utilization of weighing and storage infrastructure. AgriQueue addresses these bottlenecks by digitizing the end-to-end procurement lifecycle (`registration -> token -> slot -> weigh-in -> dispatch`) and pairing it with scheduling, routing, and demand-forecasting algorithms.

### Key Capabilities

- **Digital Slot & Token Booking:** Real-time slot availability per Mandi with transactional row-locking to prevent overbooking, duplicate-booking protection, and QR-coded digital passes.
- **Multilingual Voice Assistant:** Real-time bidirectional voice booking powered by the Google Gemini Live API over WebSockets (`/ws/voice`), with explicit verbal confirmation before any booking is committed.
- **Live Market Prices:** Integration with Government of India Open Government Data (AGMARKNET / `data.gov.in`) for daily commodity rates and historical price trends.
- **Farm-to-Mandi Transport:** Coordinated haulage requests linked to confirmed Mandi bookings with status lifecycle tracking.
- **Algorithmic Engine:** Python package implementing queue scheduling, graph-based route optimization, and ML waiting-time/arrival forecasting.

---

## Architecture & Tech Stack

| Layer                | Technologies                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Frontend**         | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Leaflet, `lucide-react`, `qrcode.react` |
| **Backend**          | Node.js, Express 4, WebSockets (`ws`), `mysql2`                                                     |
| **Database**         | MySQL 8+ / TiDB Serverless (SSL-enabled)                                                            |
| **Algorithm Engine** | Python 3.11+, NumPy, pandas, scikit-learn, XGBoost                                                  |
| **AI & Data APIs**   | Google Gemini Live API (`@google/genai`), AGMARKNET (`data.gov.in`)                                 |

---

## Algorithmic Engine (`algorithms/`)

The `algorithms/` Python package implements core scheduling, routing, and forecasting models with PEP-484 type annotations.

### 1. Queue Scheduling (`algorithms/queue_optimizer.py`)

| Class                     | Algorithm                | Complexity             | Purpose                                          |
| ------------------------- | ------------------------ | ---------------------- | ------------------------------------------------ |
| `PriorityQueueScheduler`  | Min-Heap Priority Queue  | `O(log n)` push/pop    | Prioritizes perishable and high-moisture produce |
| `FCFSScheduler`           | First-Come-First-Served  | `O(1)` enqueue/dequeue | Baseline fair queue ordering                     |
| `SPTScheduler`            | Shortest Processing Time | `O(n log n)` sort      | Minimizes average waiting time (Smith's Rule)    |
| `GreedyResourceScheduler` | Least-Loaded Assignment  | `O(k)` per assignment  | Balances load across `k` weighing stations       |

Priority score formula used by `FarmerToken`:

```text
score = arrival_ts - (moisture_pct * 60) - (50 if perishable else 0) + (quantity_kg * 0.01)
```

### 2. Route Optimization (`algorithms/route_optimizer.py`)

| Class            | Algorithm                | Complexity         | Purpose                                            |
| ---------------- | ------------------------ | ------------------ | -------------------------------------------------- |
| `DijkstraRouter` | Dijkstra's Shortest Path | `O((V + E) log V)` | Shortest farm-to-mandi road path                   |
| `VRPSolver`      | Nearest-Neighbour VRP    | `O(n^2)`           | Capacity-constrained multi-farm collection routing |

### 3. ML Prediction Engine (`algorithms/demand_forecaster.py`)

| Class                  | Model                                                           | Target                            |
| ---------------------- | --------------------------------------------------------------- | --------------------------------- |
| `WaitingTimePredictor` | Random Forest Regressor (200 trees, max depth 8)                | Estimated waiting time in minutes |
| `DemandForecaster`     | XGBoost Regressor (300 rounds, lr 0.05; Random Forest fallback) | Daily farmer arrival count        |

---

## Project Structure

```text
AgriQueue/
├── algorithms/               # Python scheduling, routing, and ML forecasting engine
│   ├── __init__.py
│   ├── queue_optimizer.py
│   ├── route_optimizer.py
│   └── demand_forecaster.py
├── backend/                  # Express REST API & WebSocket server
│   ├── config/db.js          # MySQL / TiDB connection pool
│   ├── database/             # SQL schema, seeders, and integrity checks
│   ├── routes/               # REST API route handlers
│   ├── services/             # Gemini Live, booking transactions, AGMARKNET sync
│   └── index.js              # Application entry point
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/       # UI, dashboard, booking, and voice components
│   │   ├── context/          # Global application state (AppContext)
│   │   ├── i18n/             # Translations (en, hi, pa, te)
│   │   ├── pages/            # Route views
│   │   ├── services/api.js   # Backend API client
│   │   └── utils/            # Localization and formatting helpers
│   └── package.json
├── tests/                    # pytest suite for algorithms
├── .env.example              # Environment variable reference
├── package.json              # Root workspace scripts
└── requirements.txt          # Python dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **MySQL 8+** or a **TiDB Serverless** cluster
- _(Optional)_ **Google Gemini API key** for the voice assistant
- _(Optional)_ **data.gov.in API key** for syncing live AGMARKNET market prices

### 1. Install Dependencies

```bash
# Install backend and frontend Node.js dependencies
npm run install:all

# Install Python dependencies for the algorithm engine
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment files and populate your credentials:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

**`frontend/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX
```

**`backend/.env`**

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=agriqueue
DB_SSL=false
DATA_GOV_API_KEY=
GEMINI_API_KEY=
```

> Set `DB_SSL=true` when connecting to TiDB Serverless or any SSL-enforced cloud MySQL instance.

### 3. Initialize the Database

```bash
cd backend
npm run test-db               # Verify database connectivity
npm run db:init               # Create schema tables
npm run db:import-karimnagar  # Seed verified Karimnagar Mandi centres
npm run db:check-integrity    # Audit database integrity
```

### 4. Run the Application

From the repository root:

```bash
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`

### 5. Run Algorithm Tests

```bash
pytest tests/ -v --tb=short
```

---

## Database Schema

Six relational tables defined in `backend/database/schema.sql`:

- `farmers` — Registered farmer profiles (`AGQ-26-XXXX` IDs, phone, location, preferred language)
- `mandis` — Verified Mandi / procurement centres with coordinates and operating hours
- `mandi_slots` — Per-date hourly slot capacities and availability status
- `bookings` — Confirmed procurement slot tokens linked to farmers, mandis, and slots
- `transport_bookings` — Farm-to-mandi haulage requests and dispatch status
- `market_prices` — Daily commodity min/max/modal rates from AGMARKNET

---

## API Reference

| Resource      | Base Path            | Endpoints                                                                                                                                                    |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Health        | `/api/health`        | `GET /`                                                                                                                                                      |
| Farmers       | `/api/farmers`       | `POST /`, `GET /:farmerId`, `PUT /:farmerId`                                                                                                                 |
| Mandis        | `/api/mandis`        | `GET /`, `GET /:id`, `GET /:id/slots`, `GET /hierarchy/karimnagar`, `GET /meta/locations`                                                                    |
| Bookings      | `/api/bookings`      | `POST /`, `GET /active/:farmerId`, `GET /history/:farmerId`, `POST /:id/cancel`                                                                              |
| Market Prices | `/api/market-prices` | `GET /`, `GET /trends`, `POST /sync`                                                                                                                         |
| Transport     | `/api/transport`     | `POST /book`, `GET /active/:farmerId`, `GET /history/:farmerId`, `POST /:bookingId/assign-driver`, `POST /:bookingId/step-status`, `POST /:bookingId/cancel` |
| Voice AI      | `/api/voice`         | `GET /status`, `POST /session` (plus WebSocket at `/ws/voice`)                                                                                               |

---

## Available Scripts

### Root

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run install:all`  | Install dependencies for both `backend` and `frontend` |
| `npm run dev`          | Run backend and frontend dev servers concurrently      |
| `npm run dev:backend`  | Run only the backend dev server                        |
| `npm run dev:frontend` | Run only the frontend dev server                       |

### Backend (`backend/`)

| Command                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| `npm start`                    | Start Express server                     |
| `npm run dev`                  | Start Express server with `--watch`      |
| `npm run test-db`              | Verify MySQL / TiDB connection           |
| `npm run db:init`              | Create all database tables               |
| `npm run db:import-mandis`     | Import national Mandi dataset            |
| `npm run db:import-karimnagar` | Import verified Karimnagar Mandi centres |
| `npm run db:check-integrity`   | Run database integrity checks            |

### Frontend (`frontend/`)

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start Vite development server |
| `npm run build`   | Build production bundle       |
| `npm run lint`    | Run `oxlint`                  |
| `npm run preview` | Preview production build      |

### Python Tests

| Command                          | Description                    |
| -------------------------------- | ------------------------------ |
| `pytest tests/ -v`               | Run all algorithm unit tests   |
| `pytest tests/ --cov=algorithms` | Run tests with coverage report |

---

## Security

- Credentials and API keys (`DB_PASSWORD`, `GEMINI_API_KEY`, `DATA_GOV_API_KEY`) are loaded exclusively on the server via `.env` files (gitignored).
- All Gemini Live AI calls are proxied through the backend; API keys are never exposed to the browser.
- CORS is restricted to the configured `FRONTEND_URL` and local development origins.
- Production `POST /api/market-prices/sync` requests require local origin or an `x-sync-secret` header.

---

