import { useMemo } from 'react';
import type { Connector as ConnectorType, Scene } from '../../types';
import { getSceneClusterMetrics } from '../../utils/layout';

interface Props {
  connector: ConnectorType;
  scenes: Record<string, Scene>;
}

export default function ConnectorLine({ connector, scenes }: Props) {
  const from = scenes[connector.from];
  const to = scenes[connector.to];

  const path = useMemo(() => {
    if (!from || !to) return null;

    const fromMetrics = getSceneClusterMetrics(from);
    const toMetrics = getSceneClusterMetrics(to);

    const fromX = from.position.x + fromMetrics.width / 2;
    const fromY = from.position.y + fromMetrics.height - 24;
    const toX = to.position.x + toMetrics.width / 2;
    const toY = to.position.y - 28;

    if (connector.connectorType === 'sequential') {
      // Simple vertical dashed line with a slight curve
      const midY = (fromY + toY) / 2;
      return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
    }

    // For other types, a curved path
    const cpOffsetX = Math.abs(toX - fromX) * 0.4 + 40;
    return `M ${fromX} ${fromY} C ${fromX + cpOffsetX} ${fromY}, ${toX - cpOffsetX} ${toY}, ${toX} ${toY}`;
  }, [from, to, connector.connectorType]);

  if (!path) return null;

  const isSequential = connector.connectorType === 'sequential';

  return (
    <g className="connector-line">
      <path
        d={path}
        fill="none"
        stroke="var(--connector-main, rgba(255,255,255,0.12))"
        strokeWidth={isSequential ? 1.5 : 2}
        strokeDasharray={isSequential ? '6 4' : undefined}
        markerEnd="url(#arrowhead)"
      >
        {isSequential && (
          <animate
            attributeName="stroke-dashoffset"
            from="20"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </g>
  );
}

/** SVG defs: include once in the canvas SVG */
export function ConnectorDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
      >
        <polygon
          points="0 0, 8 3, 0 6"
          fill="var(--connector-main, rgba(255,255,255,0.12))"
        />
      </marker>
    </defs>
  );
}
