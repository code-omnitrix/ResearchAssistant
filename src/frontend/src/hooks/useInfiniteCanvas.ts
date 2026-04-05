import { useCallback, useRef, useState } from 'react';

interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;

export function useInfiniteCanvas() {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    // Capture synchronously — currentTarget is nulled before the setState updater runs
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
      const ratio = newScale / prev.scale;
      return {
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
        scale: newScale,
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on middle button or when clicking on empty canvas
    if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).dataset.canvasBg === 'true')) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.2),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale * 0.8),
    }));
  }, []);

  return {
    transform,
    setTransform,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
    zoomIn,
    zoomOut,
    isPanningRef: isPanning,
  };
}
