import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { connectSSEPipeline } from '../../services/api';
import { useAppStore } from '../../store/appStore';
import type { SSEEvent } from '../../types';

interface LogLine {
  id: number;
  icon: string;
  text: string;
  detail?: string;
  color?: string;
}

const EVENT_MAP: Record<string, { icon: string; color?: string; label: (e: SSEEvent) => string; detail?: (e: SSEEvent) => string | undefined }> = {
  PAPER_RECEIVED:      { icon: '📄', label: () => 'Paper received' },
  PLANNING_START:      { icon: '🔍', label: () => 'Analyzing paper structure…' },
  CLASSIFYING:         { icon: '🏷️', label: () => 'Classifying paper…' },
  EXTRACTING_MATH:     { icon: '📐', label: () => 'Extracting equations…' },
  SEQUENCING:          { icon: '🧩', label: () => 'Building concept sequence…' },
  SCENE_GRAPH_READY:   { icon: '📋', color: '#7A9BBC', label: (e) => `${e.totalScenes ?? ''} scenes mapped`, detail: (e) => e.payload?.paper_metadata?.title },
  GRAPH_READY:         { icon: '🔗', color: '#B89BD0', label: (e) => `Knowledge graph — ${(e.edges ?? []).length} edges` },
  SCENE_GENERATING:    { icon: '⚙️', label: (e) => `Generating: ${e.title ?? '…'}` },
  ARTIFACT_READY:      { icon: '🎨', label: (e) => `Artifact: ${e.sceneId ?? '…'}` },
  PROSE_READY:         { icon: '📝', label: (e) => `Prose: ${e.sceneId ?? '…'}` },
  SCENE_READY:         { icon: '✨', color: '#E08A78', label: (e) => `${e.sceneTitle ?? 'Scene'} ready`, detail: (e) => e.quality ? `quality ${e.quality}` : undefined },
  CONNECTOR_READY:     { icon: '🔗', label: (e) => `Connected: ${e.from} → ${e.to}` },
  PIPELINE_COMPLETE:   { icon: '🏁', color: '#9DB396', label: () => 'Done — opening canvas…' },
  PIPELINE_ERROR:      { icon: '❌', color: '#E08A78', label: (e) => `Error: ${e.message ?? 'unknown'}` },
  GUARDRAIL_BLOCKED:   { icon: '🛑', color: '#E08A78', label: (e) => `Blocked: ${e.reason ?? 'unsafe input'}` },
};

export function LandingScreen() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const lineId = useRef(0);
  const {
    setPaperAndScenes,
    upsertScene,
    addConnector,
    pushEvent,
    setGuardRejected,
    setGraphData,
    setPipelineActive,
  } = useAppStore();

  const addLine = (event: SSEEvent) => {
    const map = EVENT_MAP[event.type];
    if (!map) return;
    const line: LogLine = {
      id: ++lineId.current,
      icon: map.icon,
      text: map.label(event),
      detail: map.detail?.(event),
      color: map.color,
    };
    setLog((prev) => [...prev.slice(-40), line]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log.length]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setLog([]);
    setPipelineActive(true);

    try {
      await connectSSEPipeline(file, (event: SSEEvent) => {
        pushEvent(event);
        addLine(event);

        if (event.type === 'GUARDRAIL_BLOCKED') {
          setGuardRejected(true);
        }

        if (event.type === 'SCENE_GRAPH_READY' && event.payload) {
          setPaperAndScenes(
            event.payload.paper_metadata,
            event.payload.scenes ?? event.payload.concept_sequence ?? [],
            event.payload.equations ?? [],
          );
          navigate('/canvas');
        }

        if (event.type === 'GRAPH_READY' && event.edges && event.layout_hints) {
          setGraphData(event.edges, event.layout_hints);
        }

        if (event.type === 'SCENE_READY' && event.sceneId) {
          upsertScene({
            id: event.sceneId,
            title: event.sceneTitle ?? event.sceneId,
            phase: event.sceneSpec?.phase ?? 'HOOK',
            spec: event.sceneSpec ?? { id: event.sceneId, title: event.sceneTitle ?? '', phase: 'HOOK', description: '', key_insight: '', visualization_type: 'animation', color_emphasis: 'gold', canvas_x: event.position?.x ?? 200, canvas_y: event.position?.y ?? 80 },
            position: event.position ?? { x: 200, y: 80 },
            artifactHtml: event.artifactHtml ?? '',
            artifactDimensions: { w: event.sceneSpec?.artifact?.width ?? 580, h: event.sceneSpec?.artifact?.height ?? 340 },
            proseBlocks: (event.proseBlocks ?? []) as any,
            formulaBlocks: (event.formulaBlocks ?? []) as any,
            callouts: (event.callouts ?? []) as any,
            quality: event.quality ?? 0,
            fullyRendered: event.fullyRendered ?? true,
          });
        }

        if (event.type === 'CONNECTOR_READY' && event.from && event.to) {
          addConnector({
            from: event.from,
            to: event.to,
            connectorType: (event.connectorType as any) ?? 'sequential',
          });
        }

        if (event.type === 'PIPELINE_COMPLETE') {
          setPipelineActive(false);
        }
      });
    } finally {
      setLoading(false);
      setPipelineActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') setFile(droppedFile);
  };

  return (
    <div className="relative flex h-full overflow-y-auto overflow-x-hidden px-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-phase-blue/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-phase-violet/8 blur-[80px]" />

      <div className={`relative mx-auto w-full max-w-xl space-y-8 transition-all duration-500 ${loading || log.length > 0 ? 'py-12' : 'py-0 my-auto'}`}>
        <div className="space-y-3 text-center">
          <h1 className="font-display text-4xl leading-tight text-text1">
            Turn research papers into explorable knowledge graphs.
          </h1>
          <p className="mx-auto max-w-md text-sm text-text3">
            Upload a PDF and watch concepts appear as interactive artifacts on a spatial canvas.
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-phase-blue bg-phase-blue/5'
              : file
                ? 'border-phase-teal/40 bg-phase-teal/5'
                : 'border-white/10 bg-surface2/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <p className="text-sm text-text1">{file.name}</p>
              <p className="text-xs text-text3">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button
                onClick={() => setFile(null)}
                className="text-xs text-phase-rose hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-surface1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-text3">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                </svg>
              </div>
              <div>
                <label className="cursor-pointer text-sm text-phase-blue hover:underline">
                  Choose PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-text3"> or drag it here</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full rounded-xl bg-phase-blue py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing…
            </span>
          ) : (
            'Analyze Paper'
          )}
        </button>

        {/* Live build log */}
        {log.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2">
              {loading && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-phase-amber" />}
              <span className="text-[11px] uppercase tracking-widest text-text3">Build log</span>
              <span className="ml-auto text-[10px] text-text3/50">{log.length} events</span>
            </div>
            <div ref={logRef} className="max-h-48 overflow-y-auto p-3 font-mono">
              {log.map((line) => (
                <div key={line.id} className="flex items-baseline gap-2 py-0.5 text-[11px] leading-snug">
                  <span>{line.icon}</span>
                  <span style={{ color: line.color ?? 'rgba(255,255,255,0.6)' }}>{line.text}</span>
                  {line.detail && (
                    <span className="truncate text-[10px] text-text3/50">{line.detail}</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 py-0.5 text-[11px] text-text3/40">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/10 border-t-white/40" />
                  waiting…
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
