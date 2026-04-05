import { create } from 'zustand';

import type {
  ChatMessage,
  Connector,
  GraphEdge,
  LayoutHint,
  PaperEntry,
  PaperMetadata,
  Scene,
  SceneSpec,
  SSEEvent,
  ViewportContext,
} from '../types';
import { applyFreeFlowLayout } from '../utils/layout';

// ── State shape ─────────────────────────────────────────────────────────────

interface AppState {
  // Paper data
  paper: PaperMetadata | null;
  papers: PaperEntry[];
  equations: unknown[];

  // Scene graph (V3)
  scenes: Record<string, Scene>;
  sceneOrder: string[];  // ordered scene IDs for sequential navigation
  connectors: Connector[];

  // Knowledge graph overlay
  edges: GraphEdge[];
  layoutHints: Record<string, LayoutHint>;

  // Canvas state
  panX: number;
  panY: number;
  zoom: number;

  // Selection / focus
  activeSceneId: string | null;
  selectedElementId: string | null;
  viewport: ViewportContext;

  // Chat
  chatHistory: ChatMessage[];

  // Pipeline progress
  progressEvents: SSEEvent[];
  guardRejected: boolean;
  pipelineActive: boolean;
  pipelineFeedOpen: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────

  // Paper
  setPaperAndScenes: (paper: PaperMetadata, scenes: SceneSpec[], equations: unknown[], paperId?: string) => void;

  // Graph
  setGraphData: (edges: GraphEdge[], layoutHints: Record<string, LayoutHint>) => void;

  // Scenes
  upsertScene: (scene: Scene) => void;
  addConnector: (c: Connector) => void;
  updateSceneArtifact: (sceneId: string, html: string, dims: { w: number; h: number }) => void;
  updateSceneProse: (sceneId: string, data: Pick<Scene, 'proseBlocks' | 'formulaBlocks' | 'callouts'>) => void;

  // Canvas
  setPan: (x: number, y: number) => void;
  setZoom: (z: number) => void;

  // Selection
  setActiveSceneId: (id: string | null) => void;
  setSelectedElementId: (id: string | null) => void;
  setViewport: (v: ViewportContext) => void;

  // Chat
  pushChat: (message: ChatMessage) => void;
  clearChat: () => void;

  // Pipeline progress
  pushEvent: (event: SSEEvent) => void;
  setGuardRejected: (value: boolean) => void;
  setPipelineActive: (value: boolean) => void;
  setPipelineFeedOpen: (value: boolean) => void;

  // Reset
  reset: () => void;
}

// ── Initial state ───────────────────────────────────────────────────────────

const INITIAL: Pick<
  AppState,
  | 'paper' | 'papers' | 'equations'
  | 'scenes' | 'sceneOrder' | 'connectors'
  | 'edges' | 'layoutHints'
  | 'panX' | 'panY' | 'zoom'
  | 'activeSceneId' | 'selectedElementId' | 'viewport'
  | 'chatHistory' | 'progressEvents'
  | 'guardRejected' | 'pipelineActive' | 'pipelineFeedOpen'
> = {
  paper: null,
  papers: [],
  equations: [],
  scenes: {},
  sceneOrder: [],
  connectors: [],
  edges: [],
  layoutHints: {},
  panX: 0,
  panY: 0,
  zoom: 1,
  activeSceneId: null,
  selectedElementId: null,
  viewport: { visibleSceneIds: [], mostProminentSceneId: null, visibleElementIds: [], selectedElementId: null },
  chatHistory: [],
  progressEvents: [],
  guardRejected: false,
  pipelineActive: false,
  pipelineFeedOpen: false,
};

// ── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  ...INITIAL,

  setPaperAndScenes: (paper, sceneSpecs, equations, paperId = 'p1') =>
    set((state) => {
      const paperEntry: PaperEntry = {
        id: paperId,
        title: paper.title,
        color: state.papers.length === 0 ? '#7A9BBC' : '#B89BD0',
        concepts: sceneSpecs.map((s) => s.id),
      };
      // Create placeholder scenes from specs
      const scenes: Record<string, Scene> = { ...state.scenes };
      const order: string[] = [];
      for (const spec of sceneSpecs) {
        order.push(spec.id);
        if (!scenes[spec.id]) {
          scenes[spec.id] = {
            id: spec.id,
            title: spec.title,
            phase: spec.phase,
            spec,
            position: { x: spec.canvas_x ?? 200, y: spec.canvas_y ?? 80 },
            artifactHtml: '',
            artifactDimensions: { w: spec.artifact?.width ?? 580, h: spec.artifact?.height ?? 340 },
            proseBlocks: [],
            formulaBlocks: [],
            callouts: [],
            quality: 0,
            fullyRendered: false,
          };
        }
      }
      const laidOutScenes = applyFreeFlowLayout(scenes, order, state.layoutHints);
      return {
        paper,
        equations,
        papers: [...state.papers.filter((p) => p.id !== paperId), paperEntry],
        scenes: laidOutScenes,
        sceneOrder: order,
      };
    }),

  setGraphData: (edges, layoutHints) =>
    set((state) => ({
      edges,
      layoutHints,
      scenes: applyFreeFlowLayout(state.scenes, state.sceneOrder, layoutHints),
    })),

  upsertScene: (scene) =>
    set((state) => {
      const nextSceneOrder = state.sceneOrder.includes(scene.id)
        ? state.sceneOrder
        : [...state.sceneOrder, scene.id];
      const nextScenes = { ...state.scenes, [scene.id]: scene };

      return {
        scenes: applyFreeFlowLayout(nextScenes, nextSceneOrder, state.layoutHints),
        sceneOrder: nextSceneOrder,
      };
    }),

  addConnector: (c) =>
    set((state) => ({
      connectors: [...state.connectors.filter((e) => !(e.from === c.from && e.to === c.to)), c],
    })),

  updateSceneArtifact: (sceneId, html, dims) =>
    set((state) => {
      const prev = state.scenes[sceneId];
      if (!prev) return state;
      return {
        scenes: {
          ...state.scenes,
          [sceneId]: { ...prev, artifactHtml: html, artifactDimensions: dims },
        },
      };
    }),

  updateSceneProse: (sceneId, data) =>
    set((state) => {
      const prev = state.scenes[sceneId];
      if (!prev) return state;
      return {
        scenes: {
          ...state.scenes,
          [sceneId]: { ...prev, ...data },
        },
      };
    }),

  setPan: (x, y) => set({ panX: x, panY: y }),
  setZoom: (z) => set({ zoom: z }),

  setActiveSceneId: (id) => set({ activeSceneId: id }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setViewport: (v) => set({ viewport: v }),

  pushChat: (message) =>
    set((state) => ({ chatHistory: [...state.chatHistory, message] })),

  clearChat: () => set({ chatHistory: [] }),

  pushEvent: (event) =>
    set((state) => ({ progressEvents: [...state.progressEvents, event] })),

  setGuardRejected: (value) => set({ guardRejected: value }),

  setPipelineActive: (value) =>
    set({ pipelineActive: value, pipelineFeedOpen: value ? true : undefined }),

  setPipelineFeedOpen: (value) => set({ pipelineFeedOpen: value }),

  reset: () => set({ ...INITIAL }),
}));
