import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import type { ProseBlock as ProseBlockType } from '../../types';

interface Props {
  block: ProseBlockType;
  accentColor?: string;
  selected?: boolean;
}

export default function ProseBlock({ block, accentColor, selected }: Props) {
  return (
    <div
      className="prose-block"
      style={{
        maxWidth: 460,
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 15,
        lineHeight: 1.85,
        color: 'var(--text-primary)',
        borderLeft: selected ? `3px solid ${accentColor ?? 'var(--phase-hook)'}` : '3px solid transparent',
        paddingLeft: 14,
        transition: 'border-color 0.2s ease',
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {block.markdown}
      </ReactMarkdown>
    </div>
  );
}
