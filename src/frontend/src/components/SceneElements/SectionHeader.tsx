import type { ScenePhase } from '../../types';

const PHASE_COLORS: Record<string, string> = {
  HOOK: 'var(--phase-hook)',
  FOUNDATION: 'var(--phase-foundation)',
  MECHANISM: 'var(--phase-mechanism)',
  EVIDENCE: 'var(--phase-evidence)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
  SYNTHESIS: 'var(--phase-synthesis)',
  COMPARISON: 'var(--phase-comparison)',
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
          borderRadius: 999,
          padding: '4px 12px',
};

interface Props {
  phase: ScenePhase;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ phase, title, subtitle }: Props) {
  const color = PHASE_COLORS[phase] ?? 'var(--phase-hook)';
  return (
    <div className="section-header" style={{ marginBottom: 16 }}>
      <span
        className="phase-badge"
        style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color,
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
          borderRadius: 4,
          padding: '2px 10px',
          marginBottom: 8,
        }}
      >
        {phase}
      </span>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 500,
          color: 'var(--text-primary)',
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            fontSize: 17,
            color: 'var(--text-secondary)',
            margin: '8px 0 0',
          }}
        >
          {subtitle}
        </p>
      )}
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--border, #5C5A57)',
          margin: '14px 0 0',
        }}
      />
    </div>
  );
}
