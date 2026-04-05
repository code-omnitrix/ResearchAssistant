# AI Research Canvas App

Full-stack research assistant that ingests a PDF, decomposes it into pedagogical concepts, generates interactive HTML artifacts, and streams progress via SSE.

## Quick Start

### Backend
1. Create and activate a Python 3.11+ environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`.
4. Run the API:
```bash
   cd src/backend
   uvicorn main:app --reload --port 3001
```
### Frontend
1. Install dependencies:
```bash
   cd src/frontend
   npm install
```

2. Start dev server:
```bash
   npm run dev
```

## API Endpoints
- `POST /api/analyze` (multipart PDF upload, SSE stream)
- `POST /api/interact` (chat/tutor interaction)
- `GET /api/health` (health check)

## Project Docs
- `ARCHITECTURE.md`
- `DIAGRAMS.md`
- `plan.md`
