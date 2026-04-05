# Architecture

## Backend
- FastAPI app with SSE route for pipeline streaming.
- Agent modules for analysis, generation, validation, repair, and tutoring.
- Guardrails applied before and after model generation.

## Frontend
- React + TypeScript + Vite.
- Zustand global store for paper, concepts, artifacts, and chat history.
- Landing, Canvas, Focus overlay, and Tutor chat panel.

## Data Flow
1. User uploads PDF.
2. Backend extracts concepts.
3. Per-concept HTML artifacts are generated and validated.
4. SSE emits progress and artifact payloads.
5. Frontend updates canvas in real-time.
