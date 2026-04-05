import type { ScenePhase } from '../../types';

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
          fontFamily: "'Instrument Serif', serif",
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
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
