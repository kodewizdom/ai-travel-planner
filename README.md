# Agentic AI Travel Planner (React + FastAPI)

A modern full-stack travel planner for domestic Indian travel featuring a **React (Vite + Tailwind CSS)** frontend and a **FastAPI** backend powered by **Groq** (`openai/gpt-oss-120b`), **OpenStreetMap Photon**, and **Wikipedia REST API**.

---

## Project Structure

```text
travel_agent_project/
├── backend/                  # FastAPI Python backend
│   ├── app.py                # REST API (/api/plan, /api/chat, /api/cities, /api/health)
│   ├── agent.py              # Groq function-calling travel agent
│   ├── tools.py              # Indian aviation, hotel, dining, & attraction engines
│   ├── prompt.py             # System prompt & formatting rules
│   ├── log.py                # Logger configuration
│   ├── requirements.txt      # Backend dependencies
│   └── .env.example          # Environment template
├── frontend/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx           # Main React application
│   │   ├── index.css         # Tailwind CSS + responsive styles & dark/light themes
│   │   └── main.jsx
│   ├── vite.config.js        # Vite config with API proxy
│   ├── index.html
│   └── package.json
├── .env.example              # Root environment template
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Key Features
- **India Domestic Focus**: Supports 37+ major Indian destinations with built-in multi-airport selection for Goa (`GOI` / `GOX`), Delhi (`DEL` / `HDO`), Mumbai (`BOM` / `NMI`), Hyderabad (`HYD` / `BPM`), and Bengaluru (`BLR` / `HAL`).
- **Hotel Preferences**: Choose between **City Center** (near tourist landmarks) or **Airport Transit** (near terminals).
- **Interactive Follow-Up Chat**: Conversational follow-up bar unlocks after generating an itinerary for asking questions about budget, timings, or packing.
- **Responsive Design**: Desktop collapsible sidebar and mobile/tablet slide-over drawer.
- **Themes & Export**: Switch between System, Light, and Dark modes, or print/save the itinerary to PDF via the options menu.

---

## Local Development

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to backend/.env
uvicorn app:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React app runs at `http://localhost:5173` and automatically proxies `/api` requests to `http://localhost:8000`.
