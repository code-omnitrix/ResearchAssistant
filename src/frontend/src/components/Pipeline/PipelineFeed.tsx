import { useEffect, useMemo, useRef } from 'react';

import { useAppStore } from '../../store/appStore';

const EVENT_ICONS: Record<string, string> = {
  PAPER_RECEIVED: '📄',
  PLANNING_START: '🔍',
  CLASSIFYING: '🏷️',
  EXTRACTING_MATH: '📐',
  SEQUENCING: '🧩',
  SCENE_GRAPH_READY: '📋',
  GRAPH_READY: '🔗',
  SCENE_GENERATING: '⚙️',
  ARTIFACT_READY: '🎨',
  PROSE_READY: '📝',
  SCENE_READY: '✨',
  CONNECTOR_READY: '🔗',
  PIPELINE_COMPLETE: '🏁',
  PIPELINE_ERROR: '❌',
  GUARDRAIL_BLOCKED: '🛑',
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
    <aside className="slide-in-right absolute right-0 top-0 z-30 flex h-full w-[300px] flex-col border-l border-white/8 bg-surface1/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2">
          {pipelineActive && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-phase-amber" />
          )}
          <span className="font-display text-sm text-text1">Pipeline</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-text3">
            {progressEvents.length}
          </span>
        </div>
        <button
          onClick={() => setPipelineFeedOpen(false)}
          className="rounded-md p-1 text-text3 transition hover:bg-white/5 hover:text-text1"
        >
          ✕
        </button>
      </div>

      {/* Events list */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-3">
        {latest.map((event, i) => {
          const icon = EVENT_ICONS[event.type] ?? '•';
          const isError = event.type === 'GUARDRAIL_BLOCKED' || event.type === 'PIPELINE_ERROR';
          const isDone = event.type === 'PIPELINE_COMPLETE';

          return (
            <div
              key={`${event.type}-${i}`}
              className={`rounded-lg border px-3 py-2 text-xs ${
                isError
                  ? 'border-phase-rose/20 bg-phase-rose/5'
                  : isDone
                    ? 'border-phase-teal/20 bg-phase-teal/5'
                    : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px]">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text2">{event.type.replace(/_/g, ' ')}</p>
                  <p className="mt-0.5 truncate text-text3">
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
            Processing…
          </div>
        )}
      </div>
    </aside>
  );
}
