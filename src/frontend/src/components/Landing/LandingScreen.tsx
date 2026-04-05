import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { connectSSEPipeline } from '../../services/api';
import { useAppStore } from '../../store/appStore';
import type { SSEEvent } from '../../types';

interface LogLine {
  id: number;
  badge: string;
  text: string;
  detail?: string;
  color?: string;
}

const EVENT_MAP: Record<string, { icon: string; color?: string; label: (e: SSEEvent) => string; detail?: (e: SSEEvent) => string | undefined }> = {
  PAPER_RECEIVED:    { icon: 'PDF', label: () => 'Paper received' },
  PLANNING_START:    { icon: 'PLAN', label: () => 'Analyzing paper structure...' },
  CLASSIFYING:       { icon: 'TAG', label: () => 'Classifying paper...' },
  EXTRACTING_MATH:   { icon: 'MATH', label: () => 'Extracting equations...' },
  SEQUENCING:        { icon: 'FLOW', label: () => 'Building scene sequence...' },
  SCENE_GRAPH_READY: { icon: 'MAP', color: '#7CA8FF', label: (e) => `${e.totalScenes ?? 0} scenes mapped`, detail: (e) => e.payload?.paper_metadata?.title },
  GRAPH_READY:       { icon: 'EDGE', color: '#B49CFF', label: (e) => `Knowledge graph with ${(e.edges ?? []).length} edges` },
  SCENE_GENERATING:  { icon: 'SCN', label: (e) => `Generating ${e.title ?? 'scene'}` },
  ARTIFACT_READY:    { icon: 'ART', label: (e) => `Artifact ready for ${e.sceneId ?? 'scene'}` },
  PROSE_READY:       { icon: 'TXT', label: (e) => `Narrative ready for ${e.sceneId ?? 'scene'}` },
  SCENE_READY:       { icon: 'DONE', color: '#FF8F66', label: (e) => `${e.sceneTitle ?? 'Scene'} ready`, detail: (e) => e.quality ? `quality ${e.quality}` : undefined },
  CONNECTOR_READY:   { icon: 'LINK', label: (e) => `Connected ${e.from} to ${e.to}` },
  PIPELINE_COMPLETE: { icon: 'LIVE', color: '#73D2B4', label: () => 'Canvas is ready' },
  PIPELINE_ERROR:    { icon: 'ERR', color: '#FF8F66', label: (e) => `Error: ${e.message ?? 'unknown'}` },
  GUARDRAIL_BLOCKED: { icon: 'STOP', color: '#FF8F66', label: (e) => `Blocked: ${e.reason ?? 'unsafe input'}` },
};

const STATUS_CARDS = [
  {
    eyebrow: 'Spatial layout',
    title: 'Free-flow scenes',
    text: 'Concepts spread across the canvas instead of stacking into one vertical strip.',
  },
  {
    eyebrow: 'Live generation',
    title: 'Streamed build log',
    text: 'Artifacts, prose, and graph edges appear as soon as each stage completes.',
  },
  {
    eyebrow: 'Tutor context',
    title: 'Viewport-aware help',
    text: 'The tutor tracks what you are focusing on instead of replying blind.',
  },
];

const PIPELINE_PREVIEW = [
  { step: '01', title: 'Parse and classify', text: 'Read the PDF, extract structure, and map the paper type.' },
  { step: '02', title: 'Sequence the paper', text: 'Break the argument into scenes, equations, and knowledge links.' },
  { step: '03', title: 'Render the canvas', text: 'Generate artifacts and place them in a readable spatial layout.' },
];

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
      badge: map.icon,
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
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_20%_12%,rgba(124,168,255,0.15),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,143,102,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%,transparent_76%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-[1380px] flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:items-center">
          <section className="max-w-3xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-phase-blue">
              Research studio for dense technical PDFs
            </div>

            <div className="space-y-6">
              <h1 className="font-display text-5xl leading-[0.94] tracking-[-0.04em] text-text1 sm:text-6xl lg:text-[4.7rem]">
                Turn difficult papers into a canvas you can actually explore.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-text2 sm:text-lg">
                Upload one PDF and the system will pull apart the argument, render the math, and place each idea on a spatial canvas instead of collapsing everything into a single stacked report.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {STATUS_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text3">{card.eyebrow}</p>
                  <h2 className="mt-3 font-display text-2xl text-text1">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-text2">{card.text}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-surface1/70 shadow-[0_32px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-phase-amber">Upload paper</p>
                  <h2 className="mt-2 text-lg font-semibold text-text1">Start from a single PDF</h2>
                </div>
                {file && (
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text2 transition hover:border-phase-rose/35 hover:text-text1"
                  >
                    Remove file
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div
                  className={`rounded-[26px] border border-dashed p-6 text-left transition sm:p-8 ${
                    dragOver
                      ? 'border-phase-blue bg-phase-blue/8'
                      : file
                        ? 'border-phase-teal/40 bg-phase-teal/6'
                        : 'border-white/12 bg-black/10'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-phase-blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-text1">
                          {file ? file.name : 'Choose a PDF or drop it here'}
                        </p>
                        <p className="max-w-xl text-sm leading-6 text-text2">
                          {file
                            ? `${(file.size / 1024 / 1024).toFixed(1)} MB loaded. The pipeline will classify the paper, extract equations, and generate the first canvas scenes immediately.`
                            : 'Large theory papers, methods sections, and math-heavy PDFs all work better when they are decomposed into scenes instead of a plain transcript.'}
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-text1 transition hover:border-phase-blue/35 hover:bg-white/[0.06]">
                      Choose PDF
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-sm leading-6 text-text3">
                    The canvas opens as soon as the scene graph is planned, so you can start exploring while later artifacts are still streaming in.
                  </p>

                  <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#7CA8FF,#FF8F66)] px-6 py-3 text-sm font-semibold text-[#07111f] shadow-[0_18px_40px_rgba(124,168,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                        Building canvas...
                      </span>
                    ) : (
                      'Analyze paper'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-surface1/72 p-5 shadow-[0_28px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-phase-blue">Live build</p>
                  <h2 className="mt-2 text-lg font-semibold text-text1">Pipeline status</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${loading ? 'bg-phase-teal/15 text-phase-teal' : 'bg-white/[0.05] text-text3'}`}>
                  {loading ? 'Streaming' : 'Ready'}
                </span>
              </div>

              {log.length === 0 ? (
                <div className="mt-5 grid gap-3">
                  {PIPELINE_PREVIEW.map((item) => (
                    <div
                      key={item.step}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-phase-blue/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-phase-blue">
                          {item.step}
                        </span>
                        <h3 className="text-sm font-semibold text-text1">{item.title}</h3>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-text2">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div ref={logRef} className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {log.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                          style={{
                            color: line.color ?? 'var(--text-secondary)',
                            borderColor: line.color ?? 'rgba(255,255,255,0.08)',
                            background: line.color ? `${line.color}18` : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          {line.badge}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text1">{line.text}</p>
                          {line.detail && (
                            <p className="mt-1 truncate text-xs text-text3">{line.detail}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-phase-amber">Canvas behavior</p>
                <p className="mt-3 text-sm leading-6 text-text2">
                  Scenes are placed with phase-aware spacing and deconflicted so artifacts do not pile on top of each other.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-phase-teal">Study mode</p>
                <p className="mt-3 text-sm leading-6 text-text2">
                  Keep the paper spatial, ask questions in context, and move through mechanisms without losing your place.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
