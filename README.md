# 🔍 TinySleuth

**Know the Real Price Before You Pay.**

TinySleuth uses a TinyFish web agent to inspect a shopping or booking checkout, then a Python
backend validates the data and compares the initial price with the final displayed total.
The agent never submits payment and stops at login, OTP or card-detail steps.
If evidence is incomplete, the result is reported as **Inconclusive**, not as misleading.

## Structure

```
tinysleuth/
├── backend/            FastAPI + Pydantic
│   └── app/
│       ├── api/        routes (/api/health, /api/audit)
│       ├── core/       settings (.env)
│       ├── models/     Pydantic schemas
│       └── services/   tinyfish_client.py, parser.py
├── frontend/           React + Vite + TypeScript + Tailwind + Motion
└── scripts/            tinyfish_poc.py (standalone API test)
```

## Setup

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then put your TinyFish API key in .env
uvicorn app.main:app --reload --port 8000
```
Check: http://localhost:8000/api/health

### 2. TinyFish proof of concept (do this first)
```bash
cd backend
python ../scripts/tinyfish_poc.py https://some-product-url
```
Look at the raw response: are the price and checkout charges extracted reliably?

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Notes
- Keep your API key only in `backend/.env` (it is git-ignored). Never put it in the frontend.
- TinyFish endpoint used: `POST https://agent.tinyfish.ai/v1/automation/run` with the `X-API-Key` header.
  Verify against https://docs.tinyfish.ai if anything changes.

## Roadmap
1. Project setup ✅
2. Frontend UI (landing, dashboard)
3. TinyFish integration (tune the goal prompt per site)
4. Detection engine (price diff, mandatory vs optional, preselected add-ons)
5. Results dashboard (findings, evidence, progress tracker)
6. Testing and deployment
