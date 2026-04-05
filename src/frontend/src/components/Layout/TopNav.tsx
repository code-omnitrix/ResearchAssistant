import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { paper, pipelineFeedOpen, setPipelineFeedOpen, progressEvents, reset } = useAppStore();
  const isCanvas = location.pathname === '/canvas';

  return (
    <header className="relative z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-white/8 bg-surface1/75 px-4 backdrop-blur-xl sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-phase-blue/40 to-transparent" />

      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => { reset(); navigate('/'); }}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(124,168,255,0.18),rgba(255,143,102,0.1))] font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-phase-amber shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
            UQ
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-text3">
              Uptiq Research Studio
            </span>
            <span className="block truncate font-display text-xl text-text1 transition group-hover:text-phase-amber">
              Spatial Canvas
            </span>
          </span>
        </button>
        {paper && isCanvas && (
          <>
            <span className="h-6 w-px bg-white/8" />
            <span className="max-w-[320px] truncate rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-text2">
              {paper.title}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isCanvas && (
          <button
            onClick={() => setPipelineFeedOpen(!pipelineFeedOpen)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text2 transition hover:border-phase-blue/35 hover:bg-white/[0.05] hover:text-text1"
          >
            {pipelineFeedOpen ? 'Hide pipeline' : 'Pipeline'}
            {progressEvents.length > 0 && (
              <span className="rounded-full bg-phase-blue/15 px-2 py-0.5 text-[10px] text-phase-blue">
                {progressEvents.length}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
