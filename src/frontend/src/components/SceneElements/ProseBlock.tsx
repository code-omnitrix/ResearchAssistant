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
        maxWidth: 640,
        fontFamily: 'var(--font-prose)',
        fontSize: 18,
        lineHeight: 1.8,
        color: 'var(--text-primary)',
        borderLeft: selected ? `2px solid ${accentColor ?? 'var(--phase-hook)'}` : '2px solid transparent',
        paddingLeft: 18,
        paddingRight: 4,
        transition: 'border-color 0.2s ease',
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {block.markdown}
      </ReactMarkdown>
    </div>
  );
}
