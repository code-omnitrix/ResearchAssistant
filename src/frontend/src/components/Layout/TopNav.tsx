import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { paper, pipelineFeedOpen, setPipelineFeedOpen, progressEvents, reset } = useAppStore();
  const isCanvas = location.pathname === '/canvas';

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/6 bg-surface1/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { reset(); navigate('/'); }}
          className="font-display text-sm tracking-wide text-text1 transition hover:text-phase-blue"
        >
          Uptiq Canvas
        </button>
        {paper && isCanvas && (
          <>
            <span className="text-text3/40">/</span>
            <span className="max-w-[300px] truncate text-xs text-text2">{paper.title}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isCanvas && (
          <button
            onClick={() => setPipelineFeedOpen(!pipelineFeedOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 px-3 py-1.5 text-[11px] text-text3 transition hover:border-white/15 hover:text-text2"
          >
            Pipeline
            {progressEvents.length > 0 && (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">{progressEvents.length}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
