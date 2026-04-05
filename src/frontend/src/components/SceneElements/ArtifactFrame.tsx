import { useCallback, useRef, useState } from 'react';

interface Props {
  html: string;
  width: number;
  height: number;
}

export default function ArtifactFrame({ html, width, height }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setPaused(true);
    // Attempt to pause animations inside the iframe
    try {
      const doc = iframeRef.current?.contentDocument;
      doc?.documentElement.style.setProperty('animation-play-state', 'paused', 'important');
      doc?.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.animationPlayState = 'paused';
      });
    } catch {
      // cross-origin — ignore
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPaused(false);
    try {
      const doc = iframeRef.current?.contentDocument;
      doc?.documentElement.style.setProperty('animation-play-state', 'running', 'important');
      doc?.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.animationPlayState = 'running';
      });
    } catch {
      // cross-origin — ignore
    }
  }, []);

  return (
    <div
      className="artifact-frame"
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface-artifact, rgba(60,59,57,0.96))',
        border: '1px solid var(--border, #5C5A57)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          display: 'block',
        }}
        title="artifact"
      />

      {/* Pause indicator */}
      {paused && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 4,
            padding: '2px 8px',
            pointerEvents: 'none',
          }}
        >
          ❚❚ paused
        </div>
      )}
    </div>
  );
}
