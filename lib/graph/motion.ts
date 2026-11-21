import type { Point } from '@/lib/graph/hulls';

/**
 * A note that changes cluster lifts off and follows a quadratic arc. A spring
 * drives how far along the arc it is, so the move eases out and settles.
 * While it is in the air it is left out of both membranes. Each membrane is
 * resampled to a fixed ring of points and sprung toward its new outline, so a
 * corner appearing or disappearing eases instead of popping.
 * prefers-reduced-motion skips both.
 */

export interface Spring {
  value: number;
  velocity: number;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/** Slightly underdamped, so a flight settles in about half a second with a small arrive. */
export const FLIGHT_SPRING: SpringConfig = { stiffness: 180, damping: 20, mass: 1 };

/** Overdamped, so a membrane eases and does not bounce past the notes inside it. */
export const MEMBRANE_SPRING: SpringConfig = { stiffness: 140, damping: 26, mass: 1 };

/** Same count on every outline, so a spring can pair points when the corner count changes. */
export const OUTLINE_SAMPLES = 18;

const MIN_FLIGHT_DISTANCE = 36;
const SPRING_STEP = 1 / 120;

export interface MotionNode {
  id: string;
  kind: 'note' | 'topic';
  topicId?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Flight {
  toTopic: string;
  from: Point;
  to: Point;
  control: Point;
  progress: Spring;
}

interface OutlineState {
  points: Point[];
  vx: number[];
  vy: number[];
}

export interface ClusterMotion {
  sync(nodes: readonly MotionNode[], reduced: boolean): void;
  step(nodes: readonly MotionNode[], dt: number, reduced: boolean): void;
  outlines(hulls: ReadonlyMap<string, Point[]>, dt: number, reduced: boolean): Map<string, Point[]>;
  advance(now: number): number;
  flying(id: string): boolean;
  lift(id: string): number;
  cancel(id: string): void;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function stepSpring(state: Spring, target: number, dt: number, config: SpringConfig): Spring {
  let value = state.value;
  let velocity = state.velocity;
  let remaining = Math.min(Math.max(dt, 0), 0.05);
  while (remaining > 0) {
    const h = Math.min(SPRING_STEP, remaining);
    const acceleration = (-config.stiffness * (value - target) - config.damping * velocity) / config.mass;
    velocity += acceleration * h;
    value += velocity * h;
    remaining -= h;
  }
  return { value, velocity };
}

export function quadraticPoint(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t;
  return [
    u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
    u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
  ];
}

/** Bow the chord upward on a y-down canvas. A vertical chord bows to the right. */
export function arcControl(from: Point, to: Point): Point {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  let px = -dy / len;
  let py = dx / len;
  if (py > 0 || (py === 0 && px < 0)) {
    px = -px;
    py = -py;
  }
  const lift = Math.min(128, Math.max(18, len * 0.28));
  return [(from[0] + to[0]) / 2 + px * lift, (from[1] + to[1]) / 2 + py * lift];
}

function hashUnit(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

/**
 * A seat on the near side of the hub, so the note flies toward the cluster
 * instead of through the hub to the far rim.
 */
export function landingPoint(noteId: string, hub: Point, from: Point): Point {
  const dx = from[0] - hub[0];
  const dy = from[1] - hub[1];
  const len = Math.hypot(dx, dy);
  const base = len < 1 ? hashUnit(noteId) * Math.PI * 2 : Math.atan2(dy, dx);
  const angle = base + (hashUnit(noteId) - 0.5) * 0.8;
  const radius = 50 + hashUnit(`${noteId}:r`) * 22;
  return [hub[0] + Math.cos(angle) * radius, hub[1] + Math.sin(angle) * radius];
}

export function flightLift(progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  return Math.sin(t * Math.PI);
}

function centroid(points: readonly Point[]): Point {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point[0];
    y += point[1];
  }
  const count = points.length || 1;
  return [x / count, y / count];
}

/** Where a ray from the centroid at `angle` meets the outline. */
export function pointOnOutline(points: readonly Point[], angle: number): Point {
  const [cx, cy] = centroid(points);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let bestT = Number.POSITIVE_INFINITY;
  let best: Point | null = null;
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    if (!start || !end) {
      continue;
    }
    const ex = end[0] - start[0];
    const ey = end[1] - start[1];
    const det = ex * dy - ey * dx;
    if (Math.abs(det) < 1e-8) {
      continue;
    }
    const rx = start[0] - cx;
    const ry = start[1] - cy;
    const t = (ex * ry - ey * rx) / det;
    const u = (dx * ry - dy * rx) / det;
    if (t > 1e-4 && u >= -1e-4 && u <= 1 + 1e-4 && t < bestT) {
      bestT = t;
      best = [cx + dx * t, cy + dy * t];
    }
  }
  if (best) {
    return best;
  }
  let fallback = points[0] ?? [cx, cy];
  let bestDot = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const dot = (point[0] - cx) * dx + (point[1] - cy) * dy;
    if (dot > bestDot) {
      bestDot = dot;
      fallback = point;
    }
  }
  return fallback;
}

export function resampleOutline(points: readonly Point[], count = OUTLINE_SAMPLES): Point[] {
  if (points.length === 0 || count <= 0) {
    return [];
  }
  const samples: Point[] = [];
  for (let index = 0; index < count; index += 1) {
    samples.push(pointOnOutline(points, (index / count) * Math.PI * 2));
  }
  return samples;
}

function zeros(count: number): number[] {
  return Array.from({ length: count }, () => 0);
}

function restOutline(points: Point[]): OutlineState {
  return { points, vx: zeros(points.length), vy: zeros(points.length) };
}

const OUTLINE_FOLLOW = 20;

function outlineDelta(current: readonly Point[], goal: readonly Point[]): number {
  let max = 0;
  const count = Math.min(current.length, goal.length);
  for (let index = 0; index < count; index += 1) {
    const origin = current[index];
    const target = goal[index];
    if (!origin || !target) {
      continue;
    }
    max = Math.max(max, Math.hypot(origin[0] - target[0], origin[1] - target[1]));
  }
  return max;
}

function outlineMoving(state: OutlineState): boolean {
  for (let index = 0; index < state.vx.length; index += 1) {
    if (Math.hypot(state.vx[index] ?? 0, state.vy[index] ?? 0) > 8) {
      return true;
    }
  }
  return false;
}

function springOutline(current: OutlineState, goal: Point[], dt: number): OutlineState {
  if (current.points.length !== goal.length || goal.length === 0) {
    return restOutline(goal);
  }
  const points: Point[] = [];
  const vx: number[] = [];
  const vy: number[] = [];
  let error = 0;
  for (let index = 0; index < goal.length; index += 1) {
    const target = goal[index];
    const origin = current.points[index];
    if (!target || !origin) {
      continue;
    }
    const nextX = stepSpring(
      { value: origin[0], velocity: current.vx[index] ?? 0 },
      target[0],
      dt,
      MEMBRANE_SPRING,
    );
    const nextY = stepSpring(
      { value: origin[1], velocity: current.vy[index] ?? 0 },
      target[1],
      dt,
      MEMBRANE_SPRING,
    );
    points.push([nextX.value, nextY.value]);
    vx.push(nextX.velocity);
    vy.push(nextY.velocity);
    error = Math.max(
      error,
      Math.hypot(nextX.value - target[0], nextY.value - target[1]),
      Math.hypot(nextX.velocity, nextY.velocity),
    );
  }
  if (error < 0.5) {
    return restOutline(goal);
  }
  return { points, vx, vy };
}

function flightPoint(flight: Flight): Point {
  return quadraticPoint(flight.from, flight.control, flight.to, flight.progress.value);
}

function pin(node: MotionNode, point: Point): void {
  node.x = point[0];
  node.y = point[1];
  node.fx = point[0];
  node.fy = point[1];
}

function release(node: MotionNode, point: Point): void {
  node.x = point[0];
  node.y = point[1];
  node.fx = undefined;
  node.fy = undefined;
}

export function createClusterMotion(): ClusterMotion {
  const topics = new Map<string, string>();
  const flights = new Map<string, Flight>();
  let outlines = new Map<string, OutlineState>();
  let lastNow = 0;

  function place(nodes: readonly MotionNode[]): void {
    for (const node of nodes) {
      const flight = flights.get(node.id);
      if (!flight) {
        continue;
      }
      pin(node, flightPoint(flight));
    }
  }

  return {
    sync(nodes, reduced) {
      const hubs = new Map<string, Point>();
      for (const node of nodes) {
        if (node.kind === 'topic' && node.x != null && node.y != null) {
          hubs.set(node.id, [node.x, node.y]);
        }
      }

      const seen = new Set<string>();
      for (const node of nodes) {
        if (node.kind !== 'note' || !node.topicId) {
          continue;
        }
        seen.add(node.id);
        const previous = topics.get(node.id);
        topics.set(node.id, node.topicId);
        if (previous === undefined || previous === node.topicId) {
          continue;
        }
        flights.delete(node.id);
        if (reduced || node.x == null || node.y == null) {
          continue;
        }
        const hub = hubs.get(node.topicId);
        if (!hub) {
          continue;
        }
        const from: Point = [node.x, node.y];
        const to = landingPoint(node.id, hub, from);
        if (Math.hypot(to[0] - from[0], to[1] - from[1]) < MIN_FLIGHT_DISTANCE) {
          continue;
        }
        flights.set(node.id, {
          toTopic: node.topicId,
          from,
          to,
          control: arcControl(from, to),
          progress: { value: 0, velocity: 0 },
        });
      }

      for (const id of topics.keys()) {
        if (!seen.has(id)) {
          topics.delete(id);
          flights.delete(id);
        }
      }
      place(nodes);
    },

    step(nodes, dt, reduced) {
      for (const [id, flight] of flights) {
        const node = nodes.find((item) => item.id === id);
        if (reduced) {
          flights.delete(id);
          if (node) {
            release(node, flight.to);
          }
          continue;
        }
        const progress = stepSpring(flight.progress, 1, dt, FLIGHT_SPRING);
        const done = Math.abs(progress.value - 1) < 0.004 && Math.abs(progress.velocity) < 0.03;
        if (done) {
          flights.delete(id);
          if (node) {
            release(node, flight.to);
          }
          continue;
        }
        const next: Flight = { ...flight, progress };
        flights.set(id, next);
        if (node) {
          pin(node, flightPoint(next));
        }
      }
    },

    outlines(hulls, dt, reduced) {
      const draw = new Map<string, Point[]>();
      const next = new Map<string, OutlineState>();
      for (const [id, hull] of hulls) {
        const goal = resampleOutline(hull, OUTLINE_SAMPLES);
        const [cx, cy] = centroid(goal);
        // Spring the shape around the live center. A cluster that only slides,
        // which the force layout does on every reheat, keeps its membrane.
        const goalOffsets = goal.map((point): Point => [point[0] - cx, point[1] - cy]);
        const previous = outlines.get(id);
        const springing =
          previous !== undefined &&
          !reduced &&
          previous.points.length === goalOffsets.length &&
          (outlineMoving(previous) || outlineDelta(previous.points, goalOffsets) >= OUTLINE_FOLLOW);
        const state = springing ? springOutline(previous, goalOffsets, dt) : restOutline(goalOffsets);
        const settled = state.vx.every((velocity, index) => velocity === 0 && state.vy[index] === 0);
        next.set(id, state);
        draw.set(
          id,
          settled ? hull : state.points.map((point): Point => [point[0] + cx, point[1] + cy]),
        );
      }
      outlines = next;
      return draw;
    },

    advance(now) {
      if (lastNow === 0) {
        lastNow = now;
        return 1 / 60;
      }
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      return dt;
    },

    flying(id) {
      return flights.has(id);
    },

    lift(id) {
      const flight = flights.get(id);
      return flight ? flightLift(flight.progress.value) : 0;
    },

    cancel(id) {
      flights.delete(id);
    },
  };
}
