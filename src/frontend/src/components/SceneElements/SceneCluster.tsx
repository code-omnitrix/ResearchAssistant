import { useCallback } from 'react';
import type { Scene } from '../../types';
import { SectionHeader, ArtifactFrame, ProseBlock, FormulaBlock, CalloutBox } from '../SceneElements';
import { useAppStore } from '../../store/appStore';
import { getSceneClusterMetrics } from '../../utils/layout';

const PHASE_COLORS: Record<string, string> = {
  HOOK: 'var(--phase-hook)',
  FOUNDATION: 'var(--phase-foundation)',
  MECHANISM: 'var(--phase-mechanism)',
  EVIDENCE: 'var(--phase-evidence)',
  IMPLICATIONS: 'var(--phase-implications)',
  SYNTHESIS: 'var(--phase-synthesis)',
  COMPARISON: 'var(--phase-comparison)',
  DERIVATION: 'var(--phase-comparison)',
  SIMULATION: 'var(--phase-mechanism)',
  DEFINITION: 'var(--phase-foundation)',
  QUERY: 'var(--phase-query)',
};

interface Props {
  scene: Scene;
}

export default function SceneCluster({ scene }: Props) {
  const activeSceneId = useAppStore((s) => s.activeSceneId);
  const setActiveSceneId = useAppStore((s) => s.setActiveSceneId);
  const isActive = activeSceneId === scene.id;
  const accent = PHASE_COLORS[scene.phase] ?? 'var(--phase-hook)';
  const metrics = getSceneClusterMetrics(scene);
  const narrativeColumnStyle = metrics.dualColumn
    ? `${Math.max(scene.artifactDimensions.w, 440)}px minmax(360px, 1fr)`
    : 'minmax(0, 1fr)';

  const handleClick = useCallback(() => {
    setActiveSceneId(scene.id);
  }, [scene.id, setActiveSceneId]);

  if (!scene.fullyRendered && !scene.artifactHtml) {
    // Skeleton placeholder while generating
    return (
      <div
        className="scene-cluster scene-cluster--loading"
        style={{
          position: 'absolute',
          left: scene.position.x,
          top: scene.position.y,
          width: metrics.width,
          opacity: 0.5,
        }}
      >
        <SectionHeader phase={scene.phase} title={scene.title} subtitle={scene.spec.subtitle} />
        <div
          style={{
            width: scene.artifactDimensions.w,
            height: scene.artifactDimensions.h,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}
        >
          Generating…
        </div>
      </div>
    );
  }

  return (
    <div
      className={`scene-cluster ${isActive ? 'scene-cluster--active' : ''}`}
      style={{
        position: 'absolute',
        left: scene.position.x,
        top: scene.position.y,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: metrics.width,
        cursor: 'pointer',
        outline: isActive ? `2px solid ${accent}` : 'none',
        outlineOffset: 4,
        transition: 'outline-color 0.2s ease',
        zIndex: isActive ? 10 : 1,
      }}
      onClick={handleClick}
    >
      {/* Section header */}
      <SectionHeader
        phase={scene.phase}
        title={scene.title}
        subtitle={scene.spec.subtitle}
      />

      {/* Two-column layout: artifact left, prose right */}
      <div
        style={{
          display: 'grid',
          gap: 28,
          alignItems: 'flex-start',
          gridTemplateColumns: narrativeColumnStyle,
        }}
      >
        {/* Left: artifact */}
        {scene.artifactHtml && (
          <ArtifactFrame
            html={scene.artifactHtml}
            width={scene.artifactDimensions.w}
            height={scene.artifactDimensions.h}
          />
        )}

        {/* Right: prose + formula + callouts */}
        {metrics.hasNarrative && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              minWidth: 0,
              maxWidth: metrics.dualColumn ? 380 : 640,
            }}
          >
            {scene.proseBlocks.map((pb) => (
              <ProseBlock key={pb.id} block={pb} accentColor={accent} selected={isActive} />
            ))}

            {scene.formulaBlocks.map((fb) => (
              <FormulaBlock key={fb.id} block={fb} accentColor={accent} />
            ))}

            {scene.callouts.map((co) => (
              <CalloutBox key={co.id} data={co} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
