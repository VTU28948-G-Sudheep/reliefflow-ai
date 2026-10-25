# ReliefFlow AI 🚨

**AI-Assisted Disaster Assessment and Relief Planning System**

ReliefFlow AI is an emergency response decision support prototype designed to assist emergency operations centers (EOC), disaster logistics coordinators, and humanitarian field response teams. It features an **explainable rule-based danger prioritization engine**, **NetworkX shortest route calculation with hazard avoidance**, **Leaflet spatial mapping**, and **inventory allocation with negative-stock prevention**.

---

> ### ⚠️ Prototype & Safety Notice
> **ReliefFlow AI is a demonstration prototype and training system, NOT an official emergency dispatch service.**
> - All danger assessments are computed via deterministic, explainable heuristic scoring; they are **NOT** medically validated or clinically trained models.
> - **Unverified emergencies must remain available for human operator review** before dispatch of tactical rescue units or life-saving supplies.
> - Shortest path route calculations use a simulated graph; **never assume a route is safe simply because it is the shortest path**.
> - An absence of disaster reports in an area does **NOT** imply that the sector is safe or undamaged.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS |
| **UI Components** | Lucide Icons, Custom accessible UI modals & badges |
| **Data Visualizations** | Recharts (Severity distributions, hazard breakdowns) |
| **Spatial Mapping** | Leaflet with OpenStreetMap tiles (SSR-safe dynamic loader with offline fallback) |
| **Backend API** | Python 3.12+ / 3.14, FastAPI, Pydantic v2 |
| **Database** | PostgreSQL (Production) / SQLite zero-friction fallback via SQLAlchemy |
| **Algorithms** | Explainable rule-based danger assessment & NetworkX Dijkstra route planning |

---

## 🎨 Design System Palette

- **Navy:** `#142B3B` (Sidebar, structural headers, high-contrast text)
- **Teal:** `#178F8B` (Action buttons, brand accents, moderate tier)
- **Emergency Red:** `#D94841` (Critical code red tier, active hazards, alerts)
- **Background:** `#F4F7FA` (Clean neutral backdrop)
- **Amber:** `#F2A93B` (High priority tier, road closure warnings)
- **Green:** `#25845B` (Low priority tier, nominal stock indicators)

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+ & npm**
- *(Optional)* PostgreSQL server (SQLite is enabled out-of-the-box by default)

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run unit tests (13/13 passing)
python -m pytest -v

# Start FastAPI server (runs on http://localhost:8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
# Optional: Set to PostgreSQL connection string. Defaults to sqlite:///./reliefflow.db if omitted.
DATABASE_URL=postgresql://postgres:password@localhost:5432/reliefflow_db

# Port & Host configuration
PORT=8000
HOST=0.0.0.0
```

### Frontend (`frontend/.env.local`)
```env
# URL pointing to the FastAPI backend API root
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 🧪 Features & Verification

1. **Dashboard (`/`)**
   - Real-time KPI metrics: Active incidents, Critical tier alerts, affected populations, resource levels.
   - Interactive Recharts severity distribution & multi-hazard breakdown.
   - Live stream of recent reports tagged clearly with `DEMO DATA`.

2. **Incident Reporting & Triage (`/incidents`)**
   - Submit new incidents with live heuristic danger assessment preview.
   - Multi-parameter filtering by hazard type, priority category, and operational status.
   - Inspection drawer displaying complete explainable reason point breakdown, uncertainty level, and one-click field personnel verification.

3. **Disaster Map (`/map`)**
   - Leaflet OpenStreetMap view with custom pulsing SVG pins for Critical, High, Moderate, and Low priorities.
   - Relief depot markers showing available supplies on click.
   - Dashed hazard corridors displaying impassable roads and flooded bridges.

4. **Resource Management (`/resources`)**
   - Catalog of drinking water, trauma medical kits, MREs, blankets, rescue boats, and generators.
   - Real-time low-stock alerts when stock drops below threshold.
   - Strict allocation guard prevents negative stock and over-allocation.

5. **Route Planning (`/routes`)**
   - NetworkX Dijkstra shortest path calculation between relief depots and incident coordinates.
   - Automated detours around known road closures (e.g. flooded causeways, landslides).
   - Turn-by-turn navigation instructions with road condition statuses.
   - Prominent tactical route safety advisory notice.

6. **Reports & CSV Export (`/reports`)**
   - High-level response telemetry and operational readiness statistics.
   - One-click CSV report export via `/api/v1/reports/export-csv`.
   - Repeatable demo data reset trigger via `/api/v1/seed`.

---

## ☁️ Deployment

- **Frontend (Vercel):**
  - Set Root Directory to `frontend`.
  - Set Build Command to `npm run build`.
  - Set Environment Variable `NEXT_PUBLIC_API_URL` to your production backend URL.
- **Backend (Render / Railway / AWS / GCP Cloud Run):**
  - Deploy from `backend` folder using `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  - Provide a managed PostgreSQL database URL as `DATABASE_URL`.
