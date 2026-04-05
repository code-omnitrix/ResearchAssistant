import { useEffect, useRef, useState } from 'react';

import { useAppStore } from '../../store/appStore';
import type { SSEEvent } from '../../types';

const EVENT_META: Record<string, { label: string; color: string }> = {
  PAPER_RECEIVED:      { label: 'Paper received',        color: '#a78bfa' },
  EXTRACTING_CONCEPTS: { label: 'Extracting concepts…',  color: '#60a5fa' },
  CONCEPTS_READY:      { label: 'Concepts ready',        color: '#34d399' },
  GENERATING_START:    { label: 'Generating artifact',   color: '#f59e0b' },
  VALIDATING:          { label: 'Validating',            color: '#f59e0b' },
  REPAIRING:           { label: 'Repairing artifact',    color: '#fb923c' },
  CONCEPT_READY:       { label: 'Artifact ready',        color: '#4ade80' },
  PIPELINE_COMPLETE:   { label: 'Pipeline complete',     color: '#22d3ee' },
  PIPELINE_ERROR:      { label: 'Error',                 color: '#f87171' },
  GUARD_REJECTED:      { label: 'Guard rejected',        color: '#f87171' },
};

function formatLine(ev: SSEEvent): string {
  const meta = EVENT_META[ev.type];
  const base = meta?.label ?? ev.type;
  if (ev.conceptTitle) return `${base}: ${ev.conceptTitle}`;
  if (ev.message) return `${base} — ${ev.message}`;
  return base;
}

export function AgentLog() {
  const progressEvents = useAppStore((s) => s.progressEvents);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [progressEvents.length]);

  if (progressEvents.length === 0) return null;

  const last = progressEvents[progressEvents.length - 1]?.type;
  const latestEvent = progressEvents[progressEvents.length - 1];
  const isActive = last !== 'PIPELINE_COMPLETE' && last !== 'PIPELINE_ERROR';
  const visible = progressEvents.slice(-6);

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 overflow-hidden rounded-lg border border-white/10 bg-black/80 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left ${
          collapsed ? '' : 'border-b border-white/10'
        }`}
      >
        <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isActive ? 'animate-pulse bg-[#FF4500]' : 'bg-emerald-400'
          }`}
        />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Agent Log
        </span>
        </div>
        <span className="font-mono text-[10px] text-white/35">{collapsed ? 'open' : 'close'}</span>
      </button>

      {collapsed ? (
        <div className="border-t border-white/10 px-3 pb-2 pt-1">
          <p className="truncate font-mono text-[11px] text-white/60">
            {latestEvent ? formatLine(latestEvent) : 'Waiting for events...'}
          </p>
        </div>
      ) : null}

      {/* Log lines */}
      {!collapsed ? (
        <div
          ref={scrollRef}
          className="max-h-36 space-y-1 overflow-y-auto px-3 py-2"
        >
          {visible.map((ev, i) => {
            const meta = EVENT_META[ev.type];
            return (
              <div key={i} className="flex items-start gap-1.5 font-mono text-[11px] leading-snug">
                <span className="mt-px shrink-0 text-white/20">›</span>
                <span style={{ color: meta?.color ?? '#9ca3af' }}>
                  {formatLine(ev)}
                  {ev.quality !== undefined && (
                    <span className="ml-1 text-white/30">q={ev.quality}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
