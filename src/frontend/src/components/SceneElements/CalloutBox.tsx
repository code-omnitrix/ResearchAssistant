import type { CalloutData } from '../../types';

const VARIANT_STYLES: Record<string, { borderColor: string; defaultIcon: string }> = {
  'key-insight': { borderColor: '#E08A78', defaultIcon: '💡' },
  warning:       { borderColor: '#E08A78', defaultIcon: '⚠️' },
  tip:           { borderColor: '#9DB396', defaultIcon: '🔄' },
  definition:    { borderColor: '#7A9BBC', defaultIcon: '📖' },
  example:       { borderColor: '#B89BD0', defaultIcon: '📊' },
};

interface Props {
  data: CalloutData;
}

export default function CalloutBox({ data }: Props) {
  const variant = VARIANT_STYLES[data.variant] ?? VARIANT_STYLES['key-insight'];
  const icon = data.icon || variant.defaultIcon;

  return (
    <div
      className="callout-box"
      style={{
        maxWidth: 460,
        background: 'var(--surface-callout, rgba(255,255,255,0.03))',
        borderLeft: `3px solid ${variant.borderColor}`,
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <p
        style={{
          margin: 0,
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }}
      >
        {data.content}
      </p>
    </div>
  );
}
