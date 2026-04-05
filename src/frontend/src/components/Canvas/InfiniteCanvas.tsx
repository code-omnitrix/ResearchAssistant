import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAppStore } from '../../store/appStore';
import { useInfiniteCanvas } from '../../hooks/useInfiniteCanvas';
import SceneCluster from '../SceneElements/SceneCluster';
import ConnectorLine, { ConnectorDefs } from '../SceneElements/ConnectorLine';
import { getSceneClusterMetrics } from '../../utils/layout';

export function InfiniteCanvas() {
  const scenes = useAppStore((s) => s.scenes);
  const sceneOrder = useAppStore((s) => s.sceneOrder);
  const connectors = useAppStore((s) => s.connectors);

  const {
    transform,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
    setTransform,
    zoomIn,
    zoomOut,
  } = useInfiniteCanvas();

  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoFit = useRef(false);

  const sceneBounds = useMemo(() => {
    const orderedScenes = sceneOrder
      .map((id) => scenes[id])
      .filter((scene): scene is NonNullable<typeof scenes[string]> => Boolean(scene));

    if (!orderedScenes.length) return null;

    return orderedScenes.reduce(
      (bounds, scene) => {
        const metrics = getSceneClusterMetrics(scene);
        return {
          minX: Math.min(bounds.minX, scene.position.x),
          minY: Math.min(bounds.minY, scene.position.y),
          maxX: Math.max(bounds.maxX, scene.position.x + metrics.width),
          maxY: Math.max(bounds.maxY, scene.position.y + metrics.height),
        };
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    );
  }, [sceneOrder, scenes]);

  const fitToContent = useCallback(() => {
    const container = containerRef.current;
    if (!container || !sceneBounds) {
      resetView();
      return;
    }

    const padding = 160;
    const contentWidth = Math.max(sceneBounds.maxX - sceneBounds.minX, 960);
    const contentHeight = Math.max(sceneBounds.maxY - sceneBounds.minY, 720);
    const nextScale = Math.max(
      0.42,
      Math.min(
        0.92,
        Math.min(
          (container.clientWidth - padding) / contentWidth,
          (container.clientHeight - padding) / contentHeight,
        ),
      ),
    );

    setTransform({
      x: padding / 2 - sceneBounds.minX * nextScale,
      y: padding / 2 - sceneBounds.minY * nextScale,
      scale: nextScale,
    });
  }, [resetView, sceneBounds, setTransform]);

  useEffect(() => {
    if (!sceneOrder.length) {
      hasAutoFit.current = false;
      resetView();
      return;
    }

    if (hasAutoFit.current) return;
    fitToContent();
    hasAutoFit.current = true;
  }, [fitToContent, resetView, sceneOrder.length]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMouseMove(e);
    },
    [handleMouseMove],
  );

  const handleCanvasMouseUp = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleResetView = useCallback(() => {
    fitToContent();
  }, [fitToContent]);

  const canvasWidth = Math.max(4200, (sceneBounds?.maxX ?? 3200) + 900);
  const canvasHeight = Math.max(6200, (sceneBounds?.maxY ?? 4200) + 1200);

  return (
    <div className="relative h-full w-full overflow-hidden" ref={containerRef}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(124,168,255,0.14),transparent_24%),radial-gradient(circle_at_88%_18%,rgba(255,143,102,0.16),transparent_26%),radial-gradient(circle_at_78%_82%,rgba(115,210,180,0.12),transparent_24%)]" />

      {/* Canvas controls */}
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={zoomIn}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-surface2/85 text-sm font-semibold text-text2 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-phase-blue/40 hover:text-text1"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-surface2/85 text-sm font-semibold text-text2 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-phase-blue/40 hover:text-text1"
        >
          -
        </button>
        <button
          onClick={handleResetView}
          className="flex h-10 items-center rounded-2xl border border-white/10 bg-surface2/85 px-4 text-[11px] font-medium uppercase tracking-[0.18em] text-text2 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-phase-blue/40 hover:text-text1"
        >
          Fit
        </button>
      </div>

      {/* Infinite canvas surface */}
      <div
        className="dot-grid h-full w-full cursor-grab active:cursor-grabbing"
        style={{ background: 'var(--canvas-bg)' }}
        data-canvas-bg="true"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div
          className="relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG layer for connectors */}
          <svg
            className="pointer-events-none absolute left-0 top-0"
            style={{ width: canvasWidth, height: canvasHeight, overflow: 'visible' }}
          >
            <ConnectorDefs />
            {connectors.map((c, i) => (
              <ConnectorLine key={`conn-${i}`} connector={c} scenes={scenes} />
            ))}
          </svg>

          {/* Scene layer */}
          {sceneOrder.map((id, i) => {
            const scene = scenes[id];
            if (!scene) return null;
            return (
              <div
                key={scene.id}
                className="node-enter"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <SceneCluster scene={scene} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimap placeholder */}
      <div
        className="absolute bottom-4 right-4 z-20"
        style={{
          width: 160,
          height: 120,
          background: 'rgba(14, 23, 39, 0.86)',
          border: '1px solid rgba(132, 152, 190, 0.16)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} preserveAspectRatio="xMidYMid meet">
          {sceneOrder.map((id) => {
            const s = scenes[id];
            if (!s) return null;
            const metrics = getSceneClusterMetrics(s);
            return (
              <rect
                key={id}
                x={s.position.x}
                y={s.position.y}
                width={metrics.width}
                height={metrics.height}
                fill="rgba(124,168,255,0.2)"
                rx={12}
              />
            );
          })}
          {/* Viewport indicator */}
          <rect
            x={-transform.x / transform.scale}
            y={-transform.y / transform.scale}
            width={(containerRef.current?.clientWidth ?? 1200) / transform.scale}
            height={(containerRef.current?.clientHeight ?? 800) / transform.scale}
            fill="none"
            stroke="rgba(122,155,188,0.6)"
            strokeWidth={8}
          />
        </svg>
      </div>
    </div>
  );
}
