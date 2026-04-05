import type { LayoutHint, Scene, ScenePhase } from '../types';

const LANE_START_X = [180, 1360, 2540];
const LANE_START_Y = [180, 360, 260];
const LANE_SPACING_Y = 190;

const PHASE_PREFERRED_LANE: Record<ScenePhase, number> = {
  HOOK: 1,
  FOUNDATION: 0,
  MECHANISM: 1,
  EVIDENCE: 2,
  IMPLICATIONS: 2,
  SYNTHESIS: 1,
  COMPARISON: 2,
  DERIVATION: 1,
  SIMULATION: 2,
  DEFINITION: 0,
  QUERY: 1,
};

interface SceneBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function estimateNarrativeHeight(scene: Scene): number {
  const proseHeight = scene.proseBlocks.reduce(
    (total, block) => total + Math.max(block.estimated_height || 170, 150),
    0,
  );
  const formulaHeight = scene.formulaBlocks.reduce(
    (total, block) => total + Math.max(block.estimated_height || 130, 120),
    0,
  );
  const calloutHeight = scene.callouts.length * 118;
  const sectionCount = scene.proseBlocks.length + scene.formulaBlocks.length + scene.callouts.length;
  const gapHeight = Math.max(0, sectionCount - 1) * 18;
  return proseHeight + formulaHeight + calloutHeight + gapHeight + (sectionCount > 0 ? 16 : 0);
}

export function getSceneClusterMetrics(scene: Scene) {
  const hasNarrative =
    scene.proseBlocks.length > 0 || scene.formulaBlocks.length > 0 || scene.callouts.length > 0;
  const narrativeHeight = estimateNarrativeHeight(scene);
  const artifactWidth = Math.max(scene.artifactDimensions.w || 580, 440);
  const artifactHeight = Math.max(scene.artifactDimensions.h || 340, 220);
  const dualColumn = hasNarrative && artifactWidth <= 680;

  const width = dualColumn
    ? artifactWidth + 388 + 84
    : Math.min(1040, Math.max(artifactWidth + 68, 620));

  const height = (
    dualColumn
      ? Math.max(artifactHeight, narrativeHeight)
      : artifactHeight + (hasNarrative ? narrativeHeight + 28 : 0)
  ) + 136;

  return {
    width,
    height,
    dualColumn,
    hasNarrative,
  };
}

function getPreferredLane(scene: Scene, hint: LayoutHint | undefined, index: number): number {
  if (hint && Number.isFinite(hint.column)) {
    return ((hint.column % LANE_START_X.length) + LANE_START_X.length) % LANE_START_X.length;
  }

  return PHASE_PREFERRED_LANE[scene.phase] ?? index % LANE_START_X.length;
}

function chooseLane(laneHeights: number[], preferredLane: number): number {
  let bestLane = preferredLane;
  let bestScore = Number.POSITIVE_INFINITY;

  laneHeights.forEach((height, laneIndex) => {
    const distancePenalty = Math.abs(laneIndex - preferredLane) * 180;
    const score = height + distancePenalty;
    if (score < bestScore) {
      bestScore = score;
      bestLane = laneIndex;
    }
  });

  return bestLane;
}

function boxesOverlap(a: SceneBounds, b: SceneBounds, padding: number): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

export function applyFreeFlowLayout(
  scenes: Record<string, Scene>,
  sceneOrder: string[],
  layoutHints: Record<string, LayoutHint>,
): Record<string, Scene> {
  if (sceneOrder.length === 0) return scenes;

  const nextScenes: Record<string, Scene> = { ...scenes };
  const laneHeights = [...LANE_START_Y];
  const positioned: SceneBounds[] = [];

  sceneOrder.forEach((sceneId, index) => {
    const scene = scenes[sceneId];
    if (!scene) return;

    const hint = layoutHints[sceneId];
    const preferredLane = getPreferredLane(scene, hint, index);
    const lane = chooseLane(laneHeights, preferredLane);
    const metrics = getSceneClusterMetrics(scene);
    const layer = hint?.layer ?? Math.floor(index / LANE_START_X.length);
    const horizontalWave = ((layer + lane) % 2 === 0 ? 0 : 86) + (lane === 1 ? -72 : lane === 2 ? 42 : 0);

    const candidate: SceneBounds = {
      id: sceneId,
      x: LANE_START_X[lane] + horizontalWave + (index % 2 === 0 ? 0 : 24),
      y: Math.max(laneHeights[lane], 180 + layer * 620 + lane * 54),
      width: metrics.width,
      height: metrics.height,
    };

    let attempts = 0;
    while (attempts < 30) {
      const overlapping = positioned.find((placedScene) => boxesOverlap(candidate, placedScene, 110));
      if (!overlapping) break;

      if (attempts % 3 === 0) {
        candidate.y = overlapping.y + overlapping.height + 170;
      } else if (attempts % 3 === 1) {
        candidate.x += Math.min(220, Math.round(metrics.width * 0.14));
      } else {
        candidate.x = Math.max(140, candidate.x - 140);
      }

      attempts += 1;
    }

    laneHeights[lane] = Math.max(laneHeights[lane], candidate.y + candidate.height + LANE_SPACING_Y);
    positioned.push(candidate);

    nextScenes[sceneId] = {
      ...scene,
      position: { x: candidate.x, y: candidate.y },
    };
  });

  return nextScenes;
}