# Plan: AI Research Canvas App — Full-Stack Build

## Overview
Full-stack research assistant. User uploads PDF → 4-agent backend pipeline decomposes it into concept modules → streams HTML artifacts one-by-one via SSE → frontend renders a spatial canvas with floating nodes. Design matches Stitch/Architect dark theme from frontend design files.

---

## Tech Stack
- **Backend**: Python 3.11+, FastAPI, LangChain, OpenRouter (API provider), python-multipart (PDF upload), SSE via `sse-starlette`
- **Frontend**: Vite + React + TypeScript, TailwindCSS, Zustand (state), React Router
- **Guardrails**: LangChain callbacks + custom guard modules for both input and output
- **Repo layout**: flat root — `src/` (all code), `data/`, `evaluation/`, docs at root

---

## Project Structure
```
d:\om\Uptiq_ResearchAssistant\
│
├── src/                                          # All source code
│   ├── backend/
│   │   ├── main.py                               # FastAPI app entry point, CORS, routes mount
│   │   ├── routes/
│   │   │   ├── pipeline.py                       # POST /api/analyze → SSE stream
│   │   │   └── interact.py                       # POST /api/interact → tutor response
│   │   ├── agents/
│   │   │   ├── paper_analyst.py                  # Agent 1 — LangChain concept extraction
│   │   │   ├── html_generator.py                 # Agent 2 — HTML artifacts (3 prompt tiers)
│   │   │   ├── validator.py                      # Agent 3 — quality validation
│   │   │   ├── repair_agent.py                   # Agent 3b — surgical HTML repair
│   │   │   └── tutor.py                          # Agent 4 — interactive tutor
│   │   ├── pipeline/
│   │   │   └── orchestrator.py                   # Fail-proof agentic loop, SSE emitter
│   │   ├── guardrails/
│   │   │   ├── input_guard.py                    # Detect prompt injection + harmful/irrelevant queries
│   │   │   └── output_guard.py                   # Prevent hallucinations + unsafe responses
│   │   ├── prompts/
│   │   │   ├── agent1_prompts.py                 # Paper analysis system prompt + templates
│   │   │   ├── agent2_prompts.py                 # HTML generator prompts (full/simplified/minimal)
│   │   │   ├── agent3_prompts.py                 # Validator + repair prompts
│   │   │   └── agent4_prompts.py                 # Tutor system prompt + 6 mode templates
│   │   └── utils/
│   │       ├── openrouter_client.py              # LangChain ChatOpenAI pointed at OpenRouter
│   │       ├── json_extractor.py                 # Robust JSON extraction + repair (4 strategies)
│   │       └── html_sanitizer.py                 # Extract HTML from code fences, structure check
│   │
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx                           # Router: / → Landing, /canvas → Canvas
│       │   ├── components/
│       │   │   ├── Layout/
│       │   │   │   ├── Sidebar.tsx               # Left sidebar (w-64, nav items)
│       │   │   │   └── TopNav.tsx                # Fixed top nav with Stitch branding
│       │   │   ├── Landing/
│       │   │   │   └── LandingScreen.tsx         # Welcome + PDF upload + query chips
│       │   │   ├── Canvas/
│       │   │   │   ├── CanvasScreen.tsx          # Dot-grid canvas with floating nodes
│       │   │   │   ├── ArtifactNode.tsx          # Glassmorphic floating node card
│       │   │   │   └── ProgressOverlay.tsx       # SSE progress events displayed
│       │   │   ├── Focus/
│       │   │   │   └── FocusScreen.tsx           # Fullscreen mode — iframe + metadata sidebar
│       │   │   └── Chat/
│       │   │       └── ChatPanel.tsx             # Right sidebar AI tutor chat
│       │   ├── store/
│       │   │   └── appStore.ts                   # Zustand (paper, concepts, artifacts, activeNode)
│       │   ├── services/
│       │   │   └── api.ts                        # SSE consumer + REST calls to backend
│       │   ├── types/
│       │   │   └── index.ts                      # All TypeScript interfaces
│       │   └── styles/
│       │       └── globals.css                   # Design system vars + dot-grid + glassmorphism
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── data/                                         # Sample PDFs, test fixtures, cached artifacts
│
├── evaluation/                                   # Eval scripts + quality benchmarks
│   ├── eval_pipeline.py                          # End-to-end pipeline accuracy tests
│   ├── eval_guardrails.py                        # Guardrail detection accuracy tests
│   └── fixtures/                                 # Input/output pairs for regression testing
│
├── .env                                          # OPENROUTER_API_KEY (never committed)
├── .env.example
├── requirements.txt                              # Python dependencies
├── README.md
├── ARCHITECTURE.md
└── DIAGRAMS.md
```

---

## Phase 1: Project Scaffolding
1. Create repo root files: `requirements.txt`, `.env.example`, `README.md`, `ARCHITECTURE.md`, `DIAGRAMS.md`
2. Create `src/frontend/package.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`
3. Create `data/` and `evaluation/` directories with placeholder files
4. Python deps (`requirements.txt`): `fastapi`, `uvicorn[standard]`, `sse-starlette`, `python-multipart`, `langchain`, `langchain-openai`, `langchain-community`, `pydantic`, `python-dotenv`, `pypdf`, `tenacity`, `beautifulsoup4`
5. Frontend deps (`package.json`): `react`, `react-dom`, `react-router-dom`, `zustand`, `tailwindcss`, `@types/react`, `vite`, `typescript`

## Phase 2: Backend — Prompts Layer (foundation for all agents)
6. `src/backend/prompts/agent1_prompts.py` — Full Agent 1 system prompt from Agent_instructions.md; returned as `SystemMessage` / `HumanMessagePromptTemplate` for LangChain
7. `src/backend/prompts/agent2_prompts.py` — Full, Simplified, and Minimal generator prompt templates (3 tiers)
8. `src/backend/prompts/agent3_prompts.py` — Validator + Repair prompt templates
9. `src/backend/prompts/agent4_prompts.py` — Tutor system prompt + 6 response mode templates

## Phase 3: Backend — Utils + Guardrails
10. `src/backend/utils/openrouter_client.py` — LangChain `ChatOpenAI` configured with `base_url="https://openrouter.ai/api/v1"` and `OPENROUTER_API_KEY`; model selector (e.g. `openai/gpt-4o`, swappable); `tenacity` retry decorator with exponential backoff (1s/2s/4s) and rate-limit pause (60s)
11. `src/backend/utils/json_extractor.py` — 4-strategy JSON rescue: ① extract from code fences ② `json.loads` direct ③ regex key extraction ④ minimal concept struct fallback
12. `src/backend/utils/html_sanitizer.py` — Extract HTML from code fences, check DOCTYPE + balanced tags, return sanitized string or fallback
13. `src/backend/guardrails/input_guard.py` — **Input Guardrails**: LangChain chain that screens every incoming user message and PDF text for: ① prompt injection patterns (ignore previous instructions, jailbreak markers) ② harmful / off-topic queries (violence, self-harm, non-research content). Returns `{safe: bool, reason: str, category: str}`. Blocks pipeline on `safe=False`, returns guardrail error SSE event.
14. `src/backend/guardrails/output_guard.py` — **Output Guardrails**: Post-generation chain that screens every LLM output for: ① hallucination indicators (claims not grounded in provided paper text — via self-consistency check prompt) ② unsafe/misleading content (medical/legal advice presented as fact, fabricated citations). Returns `{safe: bool, flagged_segments: list[str], corrected: str | None}`. On flag: attempts LLM self-correction pass; on second flag: falls back to minimal safe response.

## Phase 4: Backend — Agent Modules
15. `src/backend/agents/paper_analyst.py` — Agent 1: reads uploaded PDF bytes via `pypdf`, builds LangChain chain (`SystemMessage` + `HumanMessage` with extracted text), calls OpenRouter, parses response through `json_extractor`; runs input guard on PDF text first
16. `src/backend/agents/html_generator.py` — Agent 2: 3-tier LangChain chain (full → simplified → minimal prompt); output passed through `html_sanitizer` then `output_guard`
17. `src/backend/agents/validator.py` — Agent 3: LangChain chain returning structured `ValidationReport` (Pydantic model); always produces valid JSON via `JsonOutputParser`
18. `src/backend/agents/repair_agent.py` — Agent 3b: takes HTML + `ValidationReport`, calls OpenRouter with repair prompt, output through `html_sanitizer` + `output_guard`
19. `src/backend/agents/tutor.py` — Agent 4: LangChain `ConversationChain` with memory; user message runs through `input_guard` first; response through `output_guard`

## Phase 5: Backend — Pipeline Orchestrator + Routes
20. `src/backend/pipeline/orchestrator.py` — `agentic_generate()` async generator: per-concept retry loop (3 attempts), repair-before-retry, `PIPELINE_EVENTS` dict, per-concept error isolation so one failure never aborts the stream
21. `src/backend/routes/pipeline.py` — FastAPI `StreamingResponse` with `EventSourceResponse`; accepts `UploadFile` PDF, runs input guard on filename+size, yields SSE events from orchestrator
22. `src/backend/routes/interact.py` — FastAPI POST `/api/interact`; runs input guard → tutor agent → output guard → returns `{response}`
23. `src/backend/main.py` — FastAPI app, CORS (`localhost:5173`), mounts routes, 50MB upload limit, `/api/health`

## Phase 6: Frontend — Core Infrastructure
24. `src/frontend/src/types/index.ts` — TypeScript types for `PaperMetadata`, `Concept`, `Artifact`, `SSEEvent`, `ChatMessage`, `GuardrailResult`
25. `src/frontend/src/styles/globals.css` — Design system CSS vars + dot-grid + glassmorphism utilities
26. `src/frontend/src/store/appStore.ts` — Zustand: paper, concepts, artifacts map (by conceptId), activeConceptId, chatHistory, guardRejected flag
27. `src/frontend/src/services/api.ts` — `connectSSEPipeline()` EventSource wrapper + `postInteract()`; surfaces guardrail block events as toast notifications

## Phase 7: Frontend — Layout Components
28. `src/frontend/src/components/Layout/Sidebar.tsx` — Architect branding, nav items, active state
29. `src/frontend/src/components/Layout/TopNav.tsx` — Stitch logo, share/export stubs, account icon

## Phase 8: Frontend — Landing Screen (matches Image 4)
30. `src/frontend/src/components/Landing/LandingScreen.tsx` — Hero text, PDF upload, query chips, drafting textarea, Solve button, ambient blobs

## Phase 9: Frontend — Canvas Screen (matches Image 6)
31. `src/frontend/src/components/Canvas/ArtifactNode.tsx` — Glassmorphic card with node title, mini status badge, click opens Focus
32. `src/frontend/src/components/Canvas/ProgressOverlay.tsx` — Live SSE progress log overlay (slides in from right during generation); shows guardrail block banners inline
33. `src/frontend/src/components/Canvas/CanvasScreen.tsx` — Dot-grid with positioned nodes, FAB button, chat toggle, staggered grid layout via CSS transforms

## Phase 10: Frontend — Focus Mode (matches Image 2)
34. `src/frontend/src/components/Focus/FocusScreen.tsx` — Full-screen overlay, artifact in `<iframe sandbox="allow-scripts">`, metadata sidebar (params, entropy, export buttons), nav arrows, "Close" to return to canvas

## Phase 11: Frontend — Chat Panel (matches Image 6 right sidebar)
35. `src/frontend/src/components/Chat/ChatPanel.tsx` — Messages list, user/AI bubbles, input field, send button, calls `/api/interact`; shows inline guardrail rejection message if input blocked

## Phase 12: App Routing + Evaluation
36. `src/frontend/src/App.tsx` — React Router: `/` → Landing, `/canvas` → Canvas; FocusScreen renders as overlay when `activeConceptId` is set
37. `evaluation/eval_pipeline.py` — End-to-end tests: upload fixture PDFs, assert ≥6 concepts returned, assert each artifact is valid HTML, assert quality score ≥60
38. `evaluation/eval_guardrails.py` — Precision/recall tests for input guard (prompt injection samples, benign queries) and output guard (hallucination test pairs)

---

## Backend API Design
| Endpoint | Method | Input | Output |
|---|---|---|---|
| `/api/analyze` | POST | `multipart/form-data` PDF | SSE stream of `PIPELINE_EVENTS` |
| `/api/interact` | POST | `{message, paperMetadata, currentConcept, allConcepts, history}` | `{response}` or `{guardrail_blocked: true, reason}` |
| `/api/health` | GET | — | `{status: "ok"}` |

## SSE Event Schema
```
data: {"type": "EXTRACTING_CONCEPTS",  "message": "...",           "stage": 1}
data: {"type": "CONCEPTS_READY",       "payload": {paper_metadata, concept_sequence}}
data: {"type": "GENERATING_START",     "conceptId": "concept_001", "conceptTitle": "..."}
data: {"type": "CONCEPT_READY",        "conceptId": "concept_001", "html": "...",  "quality": 82}
data: {"type": "GUARDRAIL_BLOCKED",    "stage": "input|output",    "reason": "...", "category": "prompt_injection|harmful|hallucination|unsafe"}
data: {"type": "PIPELINE_COMPLETE",    "totalConcepts": 8}
data: {"type": "PIPELINE_ERROR",       "message": "..."}
```

---

## Design System Tokens (from Image 7.markdown)
- Background: `#0e0e0e` (Level 0 canvas), `#1a1919` (Level 1 sidebar), glassmorphic cards `rgba(26,25,25,0.8)` + `backdrop-filter: blur(20px)`
- Primary accent: `#FF4500` (orange — FAB, active nav, CTA buttons, borders on hover)
- Text: `#f0f0f0` / `rgba(240,240,240,0.7)` (secondary)
- Ghost borders: `rgba(240,240,240,0.15)` only
- Fonts: Space Grotesk (ui/display), Inter (body) — Google Fonts
- Artifact inner design system: Playfair Display, Source Serif 4, DM Sans, JetBrains Mono (different from app UI); accent gold `#f0a500`

---

## Fail-proof Mechanism Summary
- **Agent 1**: Robust JSON extraction with 4 fallback strategies (code fence → `json.loads` → regex → minimal struct)
- **Agent 2**: 3 LangChain prompt tiers (Full → Simplified → Minimal); repair-before-retry loop; fallback HTML always returned
- **Agent 3**: `JsonOutputParser` + Pydantic `ValidationReport` model — output is always valid JSON
- **Agent 3b**: Surgical patching only — preserves working features, adds null guards + missing function stubs
- **Global**: `tenacity` retry with exponential backoff (1s/2s/4s), 60s rate-limit pause, per-concept error isolation

## Guardrails Detail

### Input Guardrails (`src/backend/guardrails/input_guard.py`)
Runs before every LLM call. Detects:
- **Prompt injection**: patterns like "ignore previous instructions", "you are now", "system:", "forget your instructions", base64-encoded instructions, role-play overrides
- **Harmful queries**: violence, self-harm, illegal content, hate speech — via keyword + LLM classifier
- **Irrelevant queries**: off-topic requests unrelated to research/study (e.g. "write me code", "plan my vacation") — lightweight intent classifier

On block → emits `GUARDRAIL_BLOCKED` SSE event with `category` and `reason`; pipeline skips to next concept or returns error to chat

### Output Guardrails (`src/backend/guardrails/output_guard.py`)
Runs on every LLM response before delivery. Detects:
- **Hallucinations**: claims statements not supported by the paper text using a self-consistency check ("Is this claim directly supported by the provided paper context? Answer yes/no.") — on `no`, triggers LLM self-correction pass
- **Unsafe responses**: fabricated citations, absolute medical/legal/financial advice presented as fact, dangerous instructions embedded in HTML artifacts
- **Misleading content**: false comparisons, cherry-picked statistics not in source

On flag → attempts one LLM self-correction pass; on second flag → falls back to minimal safe templated response

---

## Verification Steps
1. `cd src/backend && uvicorn main:app --reload --port 3001` → server starts; `GET /api/health` returns `{status: "ok"}`
2. `cd src/frontend && npm run dev` → landing screen loads at port 5173
3. Upload a sample PDF → canvas populates concept nodes one-by-one as SSE events fire
4. Click a node → Focus Mode opens with rendered iframe artifact
5. Ask a question in the chat → tutor responds using paper context
6. Send a prompt-injection string → `GUARDRAIL_BLOCKED` banner appears, pipeline is unaffected
7. `python evaluation/eval_guardrails.py` → precision ≥90% on injection/harmful detection, <5% false-positive rate on benign queries
8. Kill `/api/analyze` mid-stream → remaining concepts show error badges; pipeline doesn't freeze
