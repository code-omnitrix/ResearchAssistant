import { useEffect, useMemo, useRef } from 'react';

import { useAppStore } from '../../store/appStore';

const EVENT_ICONS: Record<string, string> = {
  PAPER_RECEIVED: 'PDF',
  PLANNING_START: 'PLAN',
  CLASSIFYING: 'TAG',
  EXTRACTING_MATH: 'MATH',
  SEQUENCING: 'FLOW',
  SCENE_GRAPH_READY: 'MAP',
  GRAPH_READY: 'EDGE',
  SCENE_GENERATING: 'SCN',
  ARTIFACT_READY: 'ART',
  PROSE_READY: 'TXT',
  SCENE_READY: 'DONE',
  CONNECTOR_READY: 'LINK',
  PIPELINE_COMPLETE: 'LIVE',
  PIPELINE_ERROR: 'ERR',
  GUARDRAIL_BLOCKED: 'STOP',
};

export function PipelineFeed() {
  const { progressEvents, pipelineFeedOpen, setPipelineFeedOpen, pipelineActive } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = useMemo(() => progressEvents.slice(-30), [progressEvents]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [latest.length]);

  if (!pipelineFeedOpen) return null;

  return (
    <aside className="slide-in-right absolute right-0 top-0 z-30 flex h-full w-[320px] flex-col border-l border-white/8 bg-surface1/90 shadow-[-24px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <div className="flex items-center gap-2">
          {pipelineActive && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-phase-amber" />
          )}
          <span className="font-display text-xl text-text1">Pipeline</span>
          <span className="rounded-full bg-phase-blue/15 px-2 py-0.5 text-[10px] text-phase-blue">
            {progressEvents.length}
          </span>
        </div>
        <button
          onClick={() => setPipelineFeedOpen(false)}
          className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text3 transition hover:border-white/20 hover:text-text1"
        >
          Close
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-3">
        {latest.map((event, i) => {
          const icon = EVENT_ICONS[event.type] ?? '•';
          const isError = event.type === 'GUARDRAIL_BLOCKED' || event.type === 'PIPELINE_ERROR';
          const isDone = event.type === 'PIPELINE_COMPLETE';

          return (
            <div
              key={`${event.type}-${i}`}
              className={`rounded-[22px] border px-4 py-3 text-xs ${
                isError
                  ? 'border-phase-rose/20 bg-phase-rose/8'
                  : isDone
                    ? 'border-phase-teal/20 bg-phase-teal/8'
                    : 'border-white/6 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text2">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text1">{event.type.replace(/_/g, ' ')}</p>
                  <p className="mt-1 truncate text-text3">
                    {event.message ?? event.sceneTitle ?? event.title ?? event.reason ?? ''}
                  </p>
                </div>
                {event.stage && (
                  <span className="flex-shrink-0 text-[10px] text-text3">{event.stage}/4</span>
                )}
              </div>
            </div>
          );
        })}

        {pipelineActive && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-text3">
            <div className="h-3 w-3 animate-spin rounded-full border border-phase-blue border-t-transparent" />
            Processing...
          </div>
        )}
      </div>
    </aside>
  );
}
