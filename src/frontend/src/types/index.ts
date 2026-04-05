// ── Paper & Classification ──────────────────────────────────────────────────

export interface PaperMetadata {
  title: string;
  authors: string[];
  year: string;
  domain: string;
  type: string;
  mathematical_intensity?: string;
  difficulty: string;
  estimated_study_time?: string;
  core_contribution: string;
  why_it_matters?: string;
}

// ── Scene Graph (Phase A output) ────────────────────────────────────────────

export type ScenePhase =
  | 'HOOK'
  | 'FOUNDATION'
  | 'MECHANISM'
  | 'EVIDENCE'
  | 'IMPLICATIONS'
  | 'SYNTHESIS'
  | 'COMPARISON'
  | 'DERIVATION'
  | 'SIMULATION'
  | 'DEFINITION'
  | 'QUERY';

export interface SceneSpec {
  id: string;
  title: string;
  subtitle?: string;
  phase: ScenePhase;
  description: string;
  key_insight: string;
  real_world_analogy?: string;
  visualization_type: string;
  color_emphasis: string;
  canvas_x: number;
  canvas_y: number;
  artifact?: {
    width: number;
    height: number;
    layout_template?: string;
  };
  prose_outline?: {
    topics_to_cover: string[];
    analogy_hint?: string;
  };
  equations?: string[];
  connects_to?: string[];
}

// ── Scene Elements (Phase B output) ─────────────────────────────────────────

export interface ProseBlock {
  id: string;
  markdown: string;
  estimated_height: number;
}

export interface FormulaBlock {
  id: string;
  latex: string;
  label: string;
  annotation?: string;
  estimated_height: number;
}

export interface CalloutData {
  id: string;
  variant: 'key-insight' | 'warning' | 'tip' | 'definition' | 'example';
  icon: string;
  content: string;
}

export interface ArtifactDimensions {
  w: number;
  h: number;
}

// ── Fully-assembled scene ───────────────────────────────────────────────────

export interface Scene {
  id: string;
  title: string;
  phase: ScenePhase;
  spec: SceneSpec;
  position: { x: number; y: number };
  artifactHtml: string;
  artifactDimensions: ArtifactDimensions;
  proseBlocks: ProseBlock[];
  formulaBlocks: FormulaBlock[];
  callouts: CalloutData[];
  quality: number;
  fullyRendered: boolean;
}

export interface Connector {
  from: string;
  to: string;
  connectorType: 'sequential' | 'branch' | 'comparison' | 'cross_paper';
}

// ── Graph (knowledge graph overlay) ─────────────────────────────────────────

export interface GraphEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'validates' | 'extends' | 'contrasts' | 'cross_paper';
  label: string;
}

export interface LayoutHint {
  layer: number;
  column: number;
}

// ── Viewport Context (sent to tutor) ────────────────────────────────────────

export interface ViewportContext {
  visibleSceneIds: string[];
  mostProminentSceneId: string | null;
  visibleElementIds: string[];
  selectedElementId: string | null;
}

// ── SSE Event Schema V3 ────────────────────────────────────────────────────

export interface SSEEvent {
  type: string;
  message?: string;
  stage?: number;
  paperId?: string;

  // SCENE_GRAPH_READY
  payload?: {
    paper_metadata: PaperMetadata;
    concept_sequence: SceneSpec[];
    equations: unknown[];
    scenes: SceneSpec[];
  };
  totalScenes?: number;

  // SCENE_GENERATING
  sceneId?: string;
  title?: string;

  // ARTIFACT_READY
  artifactHtml?: string;
  dimensions?: ArtifactDimensions;

  // PROSE_READY
  proseBlocks?: ProseBlock[];
  formulaBlocks?: FormulaBlock[];
  callouts?: CalloutData[];

  // SCENE_READY
  sceneTitle?: string;
  quality?: number;
  position?: { x: number; y: number };
  sceneSpec?: SceneSpec;
  fullyRendered?: boolean;

  // CONNECTOR_READY
  from?: string;
  to?: string;
  connectorType?: string;

  // GRAPH_READY
  nodes?: string[];
  edges?: GraphEdge[];
  layout_hints?: Record<string, LayoutHint>;

  // PIPELINE_COMPLETE
  totalConcepts?: number;

  // PIPELINE_ERROR / GUARDRAIL_BLOCKED
  reason?: string;
  category?: string;
}

// ── Chat & Interaction ──────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GuardrailResult {
  safe: boolean;
  reason: string;
  category: string;
}

// ── V2 compat aliases ───────────────────────────────────────────────────────
export type Concept = SceneSpec;
export type ConceptPhase = ScenePhase;
export type NodePosition = { x: number; y: number };
export type Artifact = {
  conceptId: string;
  conceptTitle: string;
  html: string;
  quality: number;
  paperId?: string;
};
export interface PaperEntry {
  id: string;
  title: string;
  color: string;
  concepts: string[];
}
