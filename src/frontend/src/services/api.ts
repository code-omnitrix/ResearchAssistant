import type { ChatMessage, PaperMetadata, SceneSpec, SSEEvent, ViewportContext } from '../types';
import { logger } from '../utils/logger';

const API_BASE = 'http://localhost:3001/api';

// ── SSE Pipeline ────────────────────────────────────────────────────────────

export async function connectSSEPipeline(
  file: File,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  logger.info('pipeline.connect.start', { name: file.name, size: file.size, type: file.type });
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });
  logger.info('pipeline.connect.response', { status: response.status, ok: response.ok });

  if (!response.ok || !response.body) {
    logger.error('pipeline.connect.failed', { status: response.status });
    throw new Error('Unable to start analysis stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload) as SSEEvent;
        logger.debug('pipeline.event', { type: parsed.type, stage: parsed.stage, sceneId: parsed.sceneId });
        onEvent(parsed);
      } catch (err) {
        logger.warn('pipeline.event.parse_failed', { payload, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  logger.info('pipeline.connect.done');
}

// ── Interact (Tutor) ────────────────────────────────────────────────────────

interface InteractPayload {
  message: string;
  paperMetadata: PaperMetadata | null;
  currentScene: SceneSpec | null;
  allScenes: SceneSpec[];
  viewport: ViewportContext;
  history: ChatMessage[];
}

export async function postInteract(payload: InteractPayload): Promise<{ response?: string; guardrail_blocked?: boolean; reason?: string }> {
  logger.info('interact.request', { messageLen: payload.message.length, historyLen: payload.history.length });
  const response = await fetch(`${API_BASE}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.error('interact.failed', { status: response.status });
    throw new Error('Unable to fetch tutor response');
  }

  const data = await response.json();
  logger.info('interact.done', { blocked: Boolean(data?.guardrail_blocked), hasResponse: Boolean(data?.response) });
  return data;
}

// ── Canvas Extension ────────────────────────────────────────────────────────

interface ExtendPayload {
  query: string;
  type?: string;
  parentSceneIds?: string[];
  paperMetadata?: PaperMetadata | null;
  scenes?: SceneSpec[];
  equations?: unknown[];
  paperExcerpt?: string;
}

export interface ExtendResult {
  sceneId: string;
  sceneSpec: SceneSpec;
  artifactHtml: string;
  proseBlocks: unknown[];
  formulaBlocks: unknown[];
  callouts: unknown[];
  quality: number;
  position: { x: number; y: number };
  parentSceneIds: string[];
  guardrail_blocked?: boolean;
  reason?: string;
}

export async function postExtend(payload: ExtendPayload): Promise<ExtendResult> {
  logger.info('extend.request', { type: payload.type ?? 'comparison', queryLen: payload.query.length });
  const response = await fetch(`${API_BASE}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.error('extend.failed', { status: response.status });
    throw new Error('Unable to extend canvas');
  }

  const data = await response.json();
  logger.info('extend.done', { sceneId: data?.sceneId, quality: data?.quality });
  return data;
}

// ── Query Artifact (V2 compat) ──────────────────────────────────────────────

interface QueryArtifactPayload {
  query: string;
  paperIds?: string[];
  parentConceptIds?: string[];
  type?: string;
  paperMetadata?: PaperMetadata | null;
  concepts?: SceneSpec[];
}

export async function postQueryArtifact(payload: QueryArtifactPayload): Promise<{ html?: string; quality?: number; position?: { x: number; y: number }; guardrail_blocked?: boolean; reason?: string }> {
  logger.info('query_artifact.request', { type: payload.type ?? 'query', queryLen: payload.query.length });
  const response = await fetch(`${API_BASE}/query-artifact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.error('query_artifact.failed', { status: response.status });
    throw new Error('Unable to generate query artifact');
  }

  const data = await response.json();
  logger.info('query_artifact.done', { quality: data?.quality });
  return data;
}
