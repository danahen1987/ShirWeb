import { Point } from '../types';

/** ViewBox units. Wide on purpose for 5–6 year olds; drawing width is separate. */
export const HIT_RADIUS = 38;
export const START_RADIUS = 54;
/** Screen-pixel floors so large cards stay as easy as small practice cells. */
export const HIT_RADIUS_PX = 80;
export const START_RADIUS_PX = 96;

export type TraceOrderMap = {
  visited: boolean[];
  nextIndex: number;
};

export function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function alongSegment(finger: Point, from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < 1e-6) return 1;
  return ((finger.x - from.x) * dx + (finger.y - from.y) * dy) / lengthSq;
}

export function nearestIndex(points: Point[], finger: Point) {
  let best = 0;
  let bestDist = Infinity;
  for (let index = 0; index < points.length; index++) {
    const d = dist(finger, points[index]);
    if (d < bestDist) {
      bestDist = d;
      best = index;
    }
  }
  return { index: best, dist: bestDist };
}

export function createTraceOrderMap(pointCount: number): TraceOrderMap {
  return {
    visited: new Array(Math.max(0, pointCount)).fill(false),
    nextIndex: 0,
  };
}

export function isTouchingStrokeStart(points: Point[], finger: Point, startRadius = START_RADIUS) {
  if (!points.length) return false;
  if (dist(finger, points[0]) > startRadius) return false;
  const nearest = nearestIndex(points, finger);
  if (nearest.index <= 2) return true;
  return nearest.index >= points.length - 3 && dist(finger, points[0]) <= nearest.dist + 14;
}

function canVisitIndex(
  points: Point[],
  index: number,
  finger: Point,
  hitRadius = HIT_RADIUS,
  startRadius = START_RADIUS,
) {
  if (index <= 0) return dist(finger, points[0]) <= startRadius;
  const prev = points[index - 1];
  const target = points[index];
  if (dist(finger, target) > hitRadius) return false;
  const t = alongSegment(finger, prev, target);
  const dPrev = dist(finger, prev);
  const nearPrev = Math.min(hitRadius * 0.55, 14);
  if (dPrev <= nearPrev && t < 0.7) return false;
  if (t < 0.3) return false;
  return true;
}

export function tryVisitNextInOrder(
  map: TraceOrderMap,
  points: Point[],
  finger: Point,
  hitRadius = HIT_RADIUS,
  startRadius = START_RADIUS,
) {
  if (map.visited.length !== points.length) {
    map.visited = new Array(points.length).fill(false);
    map.nextIndex = 0;
  }
  if (map.nextIndex >= points.length) return false;
  if (map.nextIndex > 0 && !map.visited[map.nextIndex - 1]) return false;
  if (!canVisitIndex(points, map.nextIndex, finger, hitRadius, startRadius)) return false;
  map.visited[map.nextIndex] = true;
  map.nextIndex += 1;
  return true;
}

export function advanceAlongStroke(
  map: TraceOrderMap,
  points: Point[],
  finger: Point,
  hitRadius = HIT_RADIUS,
  startRadius = START_RADIUS,
) {
  let advanced = false;
  while (tryVisitNextInOrder(map, points, finger, hitRadius, startRadius)) {
    advanced = true;
  }
  return advanced;
}

export function isTraceComplete(map: TraceOrderMap, points: Point[]) {
  if (points.length < 2) return false;
  if (map.nextIndex < points.length) return false;
  if (map.visited.length !== points.length) return false;
  for (let index = 0; index < map.visited.length; index++) {
    if (!map.visited[index]) return false;
  }
  return true;
}

export function lastVisitedPoint(map: TraceOrderMap, points: Point[]): Point | null {
  if (!points.length) return null;
  if (map.nextIndex <= 0) return points[0];
  return points[Math.min(map.nextIndex - 1, points.length - 1)];
}
