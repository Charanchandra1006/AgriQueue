# AgriQueue — Smart Agricultural Mandi Queue Management System

> Digitizing India's Agricultural Procurement Chain

AgriQueue is a full-stack web platform combined with a rigorous algorithmic engine that empowers farmers to digitally register, browse verified Mandi centres, book procurement slots, track farm-to-Mandi transport, monitor live market prices, and interact with a **Gemini-powered multilingual AI voice assistant** — all in their preferred language (English, Hindi, Punjabi, Telugu).

---

## Problem Statement

India's agricultural procurement system suffers from severe inefficiencies: farmers arrive at Mandi centres without appointment, wait 6–14 hours in unstructured queues, and often return home with unsold perishable produce. Resources — weighing machines, staff, and cold storage — sit idle for hours then overflow unpredictably.

**AgriQueue solves this by:** digitising the full procurement lifecycle (registration → token → slot → weigh → quality check → payment) and applying classical scheduling, graph-based routing, and machine-learning algorithms to eliminate congestion, minimise waiting time, and maximise resource utilisation.

---

## Core Algorithmic Engine

All algorithms are implemented in the **`algorithms/`** Python package with full type annotations (PEP-484) and structured docstrings.

### 1. Queue Scheduling (`algorithms/queue_optimizer.py`)

| Algorithm | Class | Complexity | Use Case |
|---|---|---|---|
| **Priority Queue / Min-Heap** | `PriorityQueueScheduler` | Push/Pop O(log n) | Prioritise perishable / high-moisture produce |
| **FCFS** | `FCFSScheduler` | O(1) enqueue/dequeue | Baseline fair scheduling |
| **Shortest Processing Time (SPT)** | `SPTScheduler` | O(n log n) | Minimise average flow time (Smith's Rule) |
| **Greedy Resource Assignment** | `GreedyResourceScheduler` | O(k) per assignment | Load-balance across k weighing stations |

Priority score formula (Priority Queue):
```
score = arrival_time
      − moisture_pct × 60          # high moisture → earlier service
      − 50 if commodity is perishable
      + quantity_kg × 0.01         # larger lots get slight delay
```

### 2. Route Optimisation (`algorithms/route_optimizer.py`)

| Algorithm | Class | Complexity | Use Case |
|---|---|---|---|
| **Dijkstra's Algorithm** | `DijkstraRouter` | O((V+E) log V) | Shortest farm-to-mandi road path |
| **VRP (Nearest Neighbour)** | `VRPSolver` | O(n²) | Multi-farm produce collection routing |

- `DijkstraRouter.shortest_path(source, destination)` — finds least-distance route in the agricultural road network
- `VRPSolver.solve()` — assigns farms to collection vehicles respecting capacity constraints, minimising total fleet distance

### 3. ML Prediction Engine (`algorithms/demand_forecaster.py`)

| Model | Class | Algorithm | Target |
|---|---|---|---|
| **Waiting-Time Predictor** | `WaitingTimePredictor` | Random Forest (200 trees, depth 8) | Minutes until a farmer is served |
| **Demand Forecaster** | `DemandForecaster` | XGBoost (300 rounds, lr=0.05) | Daily farmer arrival count |

**WaitingTimePredictor features:**
`[hour_of_day, day_of_week, queue_length, avg_quantity_kg, num_stations, moisture_avg, is_peak_season, load_per_station]`

**DemandForecaster features:**
`[day_of_year, day_of_week, month, year, lag_1, lag_7, lag_30, rolling_mean_7, rolling_std_7, is_harvest_month]`

---

## SDG 12: Responsible Consumption & Production

AgriQueue directly supports **UN SDG 12.2** — *"Achieve sustainable management and efficient use of natural resources"* — through three mechanisms:

1. **Queue Optimisation** → eliminates unnecessary trips and reduces idle vehicle time (fuel waste).
2. **VRP Route Minimisation** → reduces fleet travel distance, cutting transport energy consumption.
3. **Demand Forecasting** → prevents resource over-provisioning (staff, machinery, cold storage) by predicting peak arrival days, reducing energy and operational waste.

> Validated by the LoopCode Autonomous Audit: **SDG 12 Social Impact Score: 75.05%**

---

## Tech Stack

### Frontend
- **React 19**, Vite 8, React Router 7, Recharts, Leaflet, lucide-react

### Backend
- **Node.js 22**, Express.js 4, WebSockets (`ws`)

### Algorithm Engine
- **Python 3.11+**, NumPy, scikit-learn (Random Forest), XGBoost

### Database
- **TiDB Serverless** (MySQL 8-compatible) via `mysql2`

### AI
- **Google Gemini Live API** (`gemini-2.5-flash-native-audio-latest`) — multilingual voice booking assistant

### Data Source
- **Government of India — AGMARKNET / data.gov.in** — official daily mandi prices

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A free [TiDB Serverless](https://tidbcloud.com/) cluster (or MySQL 8+)
- (Optional) A [data.gov.in](https://data.gov.in) API key
- (Optional) A Google [Gemini API key](https://aistudio.google.com/)

### 1. Clone & Install

**All services from root:**
```bash
# Install Node.js deps for both frontend and backend
npm run install:all

# Install Python algorithm engine deps
pip install -r requirements.txt
```

### 2. Configure Environment

Copy and fill environment files:
```bash
cp .env.example frontend/.env
cp .env.example backend/.env
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX
```

**Backend** (`backend/.env`):
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_HOST=your_tidb_host
DB_PORT=4000
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=agriqueue
DB_SSL=true
DATA_GOV_API_KEY=
GEMINI_API_KEY=
```

### 3. Initialize the Database

```bash
cd backend
npm run test-db           # verify DB connection
npm run db:init           # create all 6 tables
npm run db:import-karimnagar  # seed 56 verified Karimnagar Mandi centres
npm run db:check-integrity    # audit data quality
```

### 4. Start the Application

```bash
# Start both frontend (port 5173) + backend (port 5000) concurrently
npm run dev
```

Open your browser at **http://localhost:5173**

### 5. Run Algorithm Tests

```bash
pytest tests/ -v --tb=short
```

---

## 📁 Project Structure

```
AgriQueue/
│
├── algorithms/                 # Python algorithmic engine
│   ├── __init__.py
│   ├── queue_optimizer.py      # Priority Queue, FCFS, SPT, Greedy
│   ├── route_optimizer.py      # Dijkstra, VRP
│   └── demand_forecaster.py    # Random Forest, XGBoost
│
├── tests/                      # pytest test suites
│   ├── conftest.py             # Shared fixtures
│   ├── test_queue_optimizer.py # 25 queue scheduling tests
│   ├── test_route_optimizer.py # 15 routing algorithm tests
│   └── test_demand_forecaster.py # 20 ML prediction tests
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/              # 14 full-page views
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Global state (AppContext)
│   │   ├── services/api.js     # HTTP client for backend API
│   │   └── i18n/               # en / hi / pa / te translations
│   ├── public/
│   └── package.json
│
├── backend/                    # Express.js REST API
│   ├── index.js                # Entry point + WebSocket server
│   ├── config/db.js            # TiDB connection pool
│   ├── routes/                 # 7 REST route files
│   ├── services/               # Gemini AI + market prices logic
│   └── database/               # Schema, seeders, integrity checker
│
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
└── package.json                # Root monorepo runner
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

The AgriQueue Voice Agent uses **Gemini Live** for real-time multilingual voice booking:
- Speaks in the farmer's preferred language (English, Hindi, Punjabi, Telugu)
- Can search mandis, check slot availability, and book slots — all via voice
- Features an **UNBREAKABLE confirmation gate** — never books without explicit verbal consent

> Requires a valid `GEMINI_API_KEY` in `backend/.env`

---

## 🔒 Security

- All API keys and DB credentials live in server-side `.env` files (gitignored)
- TiDB Cloud connection uses SSL encryption (`DB_SSL=true`)
- CORS restricted to the frontend URL only
- Gemini API key never reaches the browser — all AI calls proxied through backend
- Zero plain-text secrets in the repository (verified by LoopCode audit)

---

## 📦 Available Scripts

### Root (`D:\AgriQueue`)
| Script | Action |
|---|---|
| `npm run install:all` | Install deps for both frontend and backend |
| `npm run dev` | Start both Vite and Express concurrently |

### Python Algorithm Engine
| Command | Action |
|---|---|
| `pip install -r requirements.txt` | Install Python deps |
| `pytest tests/ -v` | Run full test suite |
| `pytest tests/ --cov=algorithms` | Run tests with coverage report |

### Frontend (`frontend/`)
| Script | Action |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |

### Backend (`backend/`)
| Script | Action |
|---|---|
| `npm run dev` | Start Express with hot-reload |
| `npm run db:init` | Create all database tables |
| `npm run db:import-karimnagar` | Seed Karimnagar centres |
| `npm run db:check-integrity` | Audit DB data quality |

---

## 📄 License

This project is an open initiative to digitize India's agricultural mandi procurement and queue management system, with alignment to UN Sustainable Development Goals (SDG 12: Responsible Consumption and Production).