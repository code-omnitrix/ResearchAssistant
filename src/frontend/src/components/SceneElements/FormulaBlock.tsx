import katex from 'katex';
import { useMemo } from 'react';

import type { FormulaBlock as FormulaBlockType } from '../../types';

interface Props {
  block: FormulaBlockType;
  accentColor?: string;
}

export default function FormulaBlock({ block, accentColor }: Props) {
  const rendered = useMemo(() => {
    try {
      return katex.renderToString(block.latex, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span style="color:#E08A78">[LaTeX error]</span>`;
    }
  }, [block.latex]);

  return (
    <div
      className="formula-block"
      style={{
        maxWidth: 640,
        background: 'var(--surface-formula, rgba(255,255,255,0.025))',
        border: '1px solid rgba(132, 152, 190, 0.16)',
        borderLeft: `3px solid ${accentColor ?? 'var(--phase-hook)'}`,
        borderRadius: 18,
        padding: '16px 18px',
      }}
    >
      {block.label && (
        <div
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 8,
          }}
        >
          {block.label}
        </div>
      )}

      <div
        className="formula-katex"
        style={{ color: 'var(--text-formula, #e8e4d0)', textAlign: 'center' }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />

      {block.annotation && (
        <div
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginTop: 10,
            fontFamily: 'var(--font-prose)',
          }}
        >
          {block.annotation}
        </div>
      )}
    </div>
  );
}
