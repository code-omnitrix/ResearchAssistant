import { useMemo, useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { postInteract } from '../../services/api';
import { useAppStore } from '../../store/appStore';

const QUICK_ACTIONS = ['Go deeper', 'Simplify', 'Prove it', 'Show alternatives', 'Quiz me'];

export function TutorPanel() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const paper = useAppStore((s) => s.paper);
  const scenes = useAppStore((s) => s.scenes);
  const sceneOrder = useAppStore((s) => s.sceneOrder);
  const activeSceneId = useAppStore((s) => s.activeSceneId);
  const viewport = useAppStore((s) => s.viewport);
  const chatHistory = useAppStore((s) => s.chatHistory);
  const pushChat = useAppStore((s) => s.pushChat);
  const setGuardRejected = useAppStore((s) => s.setGuardRejected);

  const activeScene = useMemo(() => {
    if (activeSceneId) return scenes[activeSceneId] ?? null;
    // Fall back to most prominent scene in viewport
    if (viewport.mostProminentSceneId) return scenes[viewport.mostProminentSceneId] ?? null;
    return null;
  }, [activeSceneId, viewport.mostProminentSceneId, scenes]);

  const allSceneSpecs = useMemo(
    () => sceneOrder.map((id) => scenes[id]?.spec).filter(Boolean),
    [sceneOrder, scenes],
  );

  // Current position indicator
  const currentIndex = activeScene ? sceneOrder.indexOf(activeScene.id) + 1 : 0;
  const visibleCount = viewport.visibleSceneIds.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory.length]);

  const send = async (text?: string) => {
    const trimmed = (text ?? message).trim();
    if (!trimmed || sending) return;

    pushChat({ role: 'user', content: trimmed });
    if (!text) setMessage('');
    setSending(true);

    try {
      const response = await postInteract({
        message: trimmed,
        paperMetadata: paper,
        currentScene: activeScene?.spec ?? null,
        allScenes: allSceneSpecs as any,
        viewport,
        history: chatHistory,
      });

      if (response.guardrail_blocked) {
        setGuardRejected(true);
        pushChat({ role: 'assistant', content: `⚠ ${response.reason ?? 'Request blocked by guardrail.'}` });
        return;
      }

      pushChat({ role: 'assistant', content: response.response ?? 'No response generated.' });
    } catch {
      pushChat({ role: 'assistant', content: 'Unable to reach the tutor right now.' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute left-4 top-4 z-30 flex h-11 items-center gap-2 rounded-full border border-white/10 bg-surface1/88 px-4 text-[11px] font-medium uppercase tracking-[0.18em] text-text2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-phase-blue/35 hover:text-text1"
      >
        Open studio
      </button>
    );
  }

  return (
    <aside className="relative z-10 flex h-full w-[320px] max-w-[92vw] flex-shrink-0 flex-col border-r border-white/8 bg-[var(--surface-panel)] shadow-[28px_0_70px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:w-[360px]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-phase-amber">Research studio</p>
          <p className="mt-2 text-sm font-semibold text-text1">Tutor aligned to your viewport</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text3 transition hover:border-white/20 hover:text-text1"
        >
          Close
        </button>
      </div>

      <div className="border-b border-white/8 px-4 py-4">
        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text3">Active paper</p>
          <p className="mt-2 truncate text-sm font-medium text-text1">
            {paper?.title ?? 'No paper loaded'}
          </p>
          {sceneOrder.length > 0 && (
            <div className="mt-3 text-[11px] text-text3">
              Scene {currentIndex || '-'} / {sceneOrder.length}
              {visibleCount > 0 && ` | In viewport: ${visibleCount}`}
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatHistory.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-6 text-center">
            <p className="text-sm font-medium text-text1">Ask anything about the paper.</p>
            <p className="text-xs leading-6 text-text3">The tutor sees the visible scene and uses that context when it answers.</p>
          </div>
        )}
        {chatHistory.map((entry, i) => (
          <div
            key={`${entry.role}-${i}`}
            className={`max-w-[95%] rounded-[22px] border px-3.5 py-3 text-[13px] leading-relaxed shadow-[0_10px_24px_rgba(0,0,0,0.16)] ${
              entry.role === 'user'
                ? 'ml-auto border-phase-blue/20 bg-phase-blue/12 text-text1'
                : 'border-white/6 bg-white/[0.04] text-text2'
            }`}
          >
            {entry.role === 'assistant' ? (
              <div className="prose-tutor">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {entry.content}
                </ReactMarkdown>
              </div>
            ) : (
              entry.content
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-1 px-1 text-text3">
            <span className="animate-bounce text-xs" style={{ animationDelay: '0ms' }}>•</span>
            <span className="animate-bounce text-xs" style={{ animationDelay: '150ms' }}>•</span>
            <span className="animate-bounce text-xs" style={{ animationDelay: '300ms' }}>•</span>
          </div>
        )}
      </div>

      {activeScene && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/8 px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.16em] text-text3">Context</span>
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] text-text2">
            #{activeScene.id}
          </span>
          {activeScene.spec.equations?.slice(0, 2).map((eqId) => (
            <span key={eqId} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] text-text2">
              #{eqId}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-white/8 px-4 py-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => send(action)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-text3 transition hover:border-phase-blue/40 hover:text-text1"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="border-t border-white/8 p-3">
        <div className="flex items-end gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-phase-blue/40">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="max-h-24 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-text1 outline-none placeholder:text-text3/50"
            placeholder="Ask about the visible part of the paper..."
          />
          <button
            onClick={() => send()}
            disabled={!message.trim() || sending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7CA8FF,#73D2B4)] text-[#07111f] transition disabled:opacity-30"
          >
            Go
          </button>
        </div>
      </div>
    </aside>
  );
}
