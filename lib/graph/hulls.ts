import { polygonHull } from 'd3-polygon';

export type Point = [number, number];

export interface HullNode {
  id: string;
  kind: 'note' | 'topic';
  topicId?: string;
  x?: number;
  y?: number;
  radius: number;
}

const HULL_PADDING = 24;

function circle(x: number, y: number, radius: number): Point[] {
  const points: Point[] = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return points;
}

function expand(points: Point[], padding: number): Point[] {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return [x + (dx / length) * padding, y + (dy / length) * padding];
  });
}

/** Convex hull around a cluster, pushed outward by padding. Small clusters become a ring. */
export function hullFor(points: Point[], padding = HULL_PADDING): Point[] | null {
  if (points.length === 0) {
    return null;
  }
  if (points.length < 3) {
    const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
    const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    const reach = Math.max(
      ...points.map((point) => Math.hypot(point[0] - cx, point[1] - cy)),
      18,
    );
    return circle(cx, cy, reach + padding);
  }
  const hull = polygonHull(points);
  if (!hull) {
    return null;
  }
  return expand(hull, padding);
}

export function buildClusterHulls(nodes: readonly HullNode[]): Map<string, Point[]> {
  const groups = new Map<string, Point[]>();
  for (const node of nodes) {
    if (node.x == null || node.y == null) {
      continue;
    }
    if (node.kind === 'topic') {
      const list = groups.get(node.id) ?? [];
      list.push([node.x, node.y]);
      groups.set(node.id, list);
      continue;
    }
    if (!node.topicId) {
      continue;
    }
    const list = groups.get(node.topicId) ?? [];
    list.push([node.x, node.y]);
    groups.set(node.topicId, list);
  }

  const hulls = new Map<string, Point[]>();
  for (const [topicId, points] of groups) {
    const hull = hullFor(points);
    if (hull) {
      hulls.set(topicId, hull);
    }
  }
  return hulls;
}

function centroid(points: Point[]): Point {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return [cx, cy];
}

/**
 * Breathe the hull outward. The offset stays positive so notes remain inside
 * the membrane while the rim wobbles like a soap film.
 */
export function bubbleMembrane(points: Point[], time: number, seed: number): Point[] {
  const [cx, cy] = centroid(points);
  return points.map((point, index) => {
    const dx = point[0] - cx;
    const dy = point[1] - cy;
    const length = Math.hypot(dx, dy) || 1;
    const wobble =
      Math.sin(time * 0.7 + seed) * 5 +
      Math.sin(time * 1.15 + index * 0.85 + seed * 1.7) * 6;
    const breath = 12 + wobble;
    return [cx + (dx / length) * (length + breath), cy + (dy / length) * (length + breath)];
  });
}

function traceSmooth(context: CanvasRenderingContext2D, points: Point[]): boolean {
  if (points.length < 3) {
    return false;
  }
  const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = midpoint(points[points.length - 1] ?? points[0], points[0]);
  context.beginPath();
  context.moveTo(start[0], start[1]);
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!current || !next) {
      continue;
    }
    const mid = midpoint(current, next);
    context.quadraticCurveTo(current[0], current[1], mid[0], mid[1]);
  }
  context.closePath();
  return true;
}

export function drawSmoothHull(
  context: CanvasRenderingContext2D,
  points: Point[],
  fill: string,
  stroke: string,
  lineWidth: number,
): void {
  if (!traceSmooth(context, points)) {
    return;
  }
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = stroke;
  context.stroke();
}

/** Cluster hull drawn as a soap bubble: a breathing membrane and a drifting sheen. */
export function drawBubbleHull(
  context: CanvasRenderingContext2D,
  points: Point[],
  time: number,
  seed: number,
  fill: string,
  stroke: string,
  lineWidth: number,
  reducedMotion: boolean,
): void {
  const membrane = reducedMotion ? points : bubbleMembrane(points, time, seed);
  if (!traceSmooth(context, membrane)) {
    return;
  }
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = stroke;
  context.stroke();
  if (reducedMotion) {
    return;
  }

  const [cx, cy] = centroid(membrane);
  let radius = 0;
  for (const point of membrane) {
    radius = Math.max(radius, Math.hypot(point[0] - cx, point[1] - cy));
  }
  if (!(radius > 1) || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return;
  }
  const angle = time * 0.55 + seed;
  const sheenX = cx + Math.cos(angle) * radius * 0.55;
  const sheenY = cy + Math.sin(angle * 0.85) * radius * 0.42;

  context.save();
  traceSmooth(context, membrane);
  context.clip();
  const glow = context.createRadialGradient(sheenX, sheenY, 0, sheenX, sheenY, Math.max(radius * 0.72, 2));
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  glow.addColorStop(0.28, 'rgba(255, 255, 255, 0.07)');
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = glow;
  context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  context.restore();

  if (!traceSmooth(context, membrane)) {
    return;
  }
  const rim = context.createConicGradient(angle, cx, cy);
  rim.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  rim.addColorStop(0.12, 'rgba(255, 255, 255, 0.7)');
  rim.addColorStop(0.22, stroke);
  rim.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
  rim.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  context.lineWidth = lineWidth * 1.6;
  context.strokeStyle = rim;
  context.stroke();
}
