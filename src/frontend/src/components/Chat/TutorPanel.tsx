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
        className="absolute left-0 top-0 z-30 flex h-10 items-center gap-2 rounded-br-lg border-b border-r border-white/8 bg-surface1 px-4 text-xs text-text2 hover:text-text1"
      >
        ≡ Studio
      </button>
    );
  }

  return (
    <aside className="flex h-full w-[340px] flex-shrink-0 flex-col border-r border-white/8 bg-[var(--surface-panel,#3C3B39)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text1" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
            ≡ RESEARCH STUDIO
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-text3 hover:text-text1"
        >
          ✕
        </button>
      </div>

      {/* Paper + viewport context */}
      <div className="border-b border-white/6 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs">📄</span>
          <span className="truncate text-xs font-medium text-text2">
            {paper?.title ?? 'No paper loaded'}
          </span>
        </div>
        {sceneOrder.length > 0 && (
          <div className="mt-1 text-[10px] text-text3">
            Scene {currentIndex || '–'} / {sceneOrder.length}
            {visibleCount > 0 && ` · In viewport: ${visibleCount}`}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatHistory.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-text3">Ask anything about the paper.</p>
            <p className="text-[10px] text-text3/60">The tutor sees what you're looking at.</p>
          </div>
        )}
        {chatHistory.map((entry, i) => (
          <div
            key={`${entry.role}-${i}`}
            className={`max-w-[95%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
              entry.role === 'user'
                ? 'ml-auto bg-phase-blue/15 text-text1'
                : 'bg-white/5 text-text2'
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

      {/* Context chips */}
      {activeScene && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/6 px-4 py-2">
          <span className="text-[10px] text-text3">Context:</span>
          <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] text-text2">
            #{activeScene.id}
          </span>
          {activeScene.spec.equations?.slice(0, 2).map((eqId) => (
            <span key={eqId} className="rounded bg-white/8 px-2 py-0.5 text-[10px] text-text2">
              #{eqId}
            </span>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 border-t border-white/6 px-4 py-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => send(action)}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-text3 transition hover:border-phase-blue/40 hover:text-text2"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/6 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-phase-blue/40">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="max-h-24 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-text1 outline-none placeholder:text-text3/50"
            placeholder="Ask anything about the paper…"
          />
          <button
            onClick={() => send()}
            disabled={!message.trim() || sending}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-phase-blue text-white transition disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
}
