import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Point } from '@/lib/graph/hulls';
import {
  arcControl,
  createClusterMotion,
  FLIGHT_SPRING,
  flightLift,
  landingPoint,
  MEMBRANE_SPRING,
  OUTLINE_SAMPLES,
  pointOnOutline,
  prefersReducedMotion,
  quadraticPoint,
  resampleOutline,
  stepSpring,
  type MotionNode,
} from '@/lib/graph/motion';

function note(id: string, topicId: string, x: number, y: number): MotionNode {
  return { id, kind: 'note', topicId, x, y };
}

function hub(id: string, x: number, y: number): MotionNode {
  return { id, kind: 'topic', x, y };
}

function square(originX: number, originY: number, size: number): Point[] {
  return [
    [originX, originY],
    [originX + size, originY],
    [originX + size, originY + size],
    [originX, originY + size],
  ];
}

describe('stepSpring', () => {
  it('moves toward the target and settles without running away', () => {
    let state = { value: 0, velocity: 0 };
    let peak = 0;
    for (let frame = 0; frame < 90; frame += 1) {
      state = stepSpring(state, 1, 1 / 60, FLIGHT_SPRING);
      peak = Math.max(peak, state.value);
    }
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.15);
    expect(state.value).toBeCloseTo(1, 2);
    expect(Math.abs(state.velocity)).toBeLessThan(0.05);
  });

  it('holds a membrane spring on the target without crossing it', () => {
    let state = { value: 0, velocity: 0 };
    let peak = 0;
    for (let frame = 0; frame < 90; frame += 1) {
      state = stepSpring(state, 80, 1 / 60, MEMBRANE_SPRING);
      peak = Math.max(peak, state.value);
    }
    expect(peak).toBeLessThanOrEqual(80.01);
    expect(state.value).toBeCloseTo(80, 1);
  });
});

describe('arc', () => {
  it('starts and ends on the chord and bows upward in the middle', () => {
    const from: Point = [0, 0];
    const to: Point = [400, 0];
    const control = arcControl(from, to);
    expect(quadraticPoint(from, control, to, 0)).toEqual(from);
    expect(quadraticPoint(from, control, to, 1)).toEqual(to);
    const mid = quadraticPoint(from, control, to, 0.5);
    expect(mid[1]).toBeLessThan(-40);
    expect(control[1]).toBeLessThan(0);
  });

  it('bows a vertical chord to the right and stays finite for a zero length', () => {
    const control = arcControl([0, 0], [0, 200]);
    expect(control[0]).toBeGreaterThan(0);
    expect(arcControl([3, 3], [3, 3])[0]).toBeCloseTo(3, 5);
  });

  it('lifts in the middle of a flight and sits down at the ends', () => {
    expect(flightLift(0)).toBe(0);
    expect(flightLift(0.5)).toBeCloseTo(1, 5);
    expect(flightLift(1)).toBeCloseTo(0, 5);
    expect(flightLift(1.2)).toBeCloseTo(0, 5);
    expect(flightLift(-0.2)).toBe(0);
  });
});

describe('landingPoint', () => {
  it('sits on the near side of the hub', () => {
    const hubPoint: Point = [0, 0];
    const from: Point = [300, 40];
    const seat = landingPoint('note-hiring-sync', hubPoint, from);
    const distance = Math.hypot(seat[0], seat[1]);
    expect(distance).toBeGreaterThan(48);
    expect(distance).toBeLessThan(74);
    expect(seat[0]).toBeGreaterThan(20);
  });

  it('still picks a seat when the note is already on the hub', () => {
    const seat = landingPoint('note-a', [10, 10], [10, 10]);
    expect(Math.hypot(seat[0] - 10, seat[1] - 10)).toBeGreaterThan(48);
  });
});

describe('resampleOutline', () => {
  it('hits the east edge of a square and keeps the sample count', () => {
    const east = pointOnOutline(square(0, 0, 100), 0);
    expect(east[0]).toBeCloseTo(100, 5);
    expect(east[1]).toBeCloseTo(50, 5);
    expect(resampleOutline(square(0, 0, 100))).toHaveLength(OUTLINE_SAMPLES);
    expect(resampleOutline([])).toEqual([]);
    expect(resampleOutline(square(0, 0, 10), 0)).toEqual([]);
  });

  it('uses the farthest vertex when no edge faces the ray', () => {
    expect(pointOnOutline([[2, 2], [2, 2], [2, 2]], 0)).toEqual([2, 2]);
  });
});

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when there is no window', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('reads the media query when the browser has one', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    expect(prefersReducedMotion()).toBe(true);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
    vi.stubGlobal('window', {});
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('createClusterMotion', () => {
  function scene(topicId = 'topic-meetings'): MotionNode[] {
    return [hub('topic-meetings', 0, 0), hub('topic-design', 400, 0), note('hiring', topicId, 30, 10)];
  }

  it('does not fly on the first sight of a note', () => {
    const motion = createClusterMotion();
    const nodes = scene();
    motion.sync(nodes, false);
    expect(motion.flying('hiring')).toBe(false);
    expect(nodes[2]?.fx).toBeUndefined();
  });

  it('pins a moved note to an arc and settles it on the new hub', () => {
    const motion = createClusterMotion();
    const nodes = scene();
    motion.sync(nodes, false);
    nodes[2] = note('hiring', 'topic-design', 30, 10);
    motion.sync(nodes, false);
    expect(motion.flying('hiring')).toBe(true);
    expect(nodes[2]?.fx).toBe(30);
    expect(nodes[2]?.fy).toBe(10);

    motion.step(nodes, 1 / 60, false);
    expect(motion.flying('hiring')).toBe(true);
    expect(nodes[2]?.y).toBeLessThan(10);
    expect(nodes[2]?.fx).toBe(nodes[2]?.x);
    const midY = nodes[2]?.y ?? 0;

    const progressBefore = motion.lift('hiring');
    motion.sync(nodes, false);
    expect(motion.lift('hiring')).toBeCloseTo(progressBefore, 5);

    for (let frame = 0; frame < 100; frame += 1) {
      motion.step(nodes, 1 / 60, false);
    }
    expect(motion.flying('hiring')).toBe(false);
    expect(motion.lift('hiring')).toBe(0);
    expect(nodes[2]?.fx).toBeUndefined();
    expect(nodes[2]?.x).toBeGreaterThan(300);
    expect(midY).toBeLessThan(10);
  });

  it('skips the arc when the seat is already close, the hub is missing, or motion is reduced', () => {
    const motion = createClusterMotion();
    const close = [hub('topic-design', 0, 0), note('hiring', 'topic-meetings', 60, 0)];
    motion.sync(close, false);
    close[1] = note('hiring', 'topic-design', 60, 0);
    motion.sync(close, false);
    expect(motion.flying('hiring')).toBe(false);

    const motionless = createClusterMotion();
    const far = scene();
    motionless.sync(far, false);
    far[2] = note('hiring', 'topic-design', 30, 10);
    motionless.sync(far, true);
    expect(motionless.flying('hiring')).toBe(false);
    expect(far[2]?.fx).toBeUndefined();

    const homeless = createClusterMotion();
    const nodes = [note('hiring', 'topic-meetings', 0, 0)];
    homeless.sync(nodes, false);
    nodes[0] = note('hiring', 'topic-missing', 0, 0);
    homeless.sync(nodes, false);
    expect(homeless.flying('hiring')).toBe(false);
  });

  it('finishes a flight immediately when reduced motion turns on', () => {
    const motion = createClusterMotion();
    const nodes = scene();
    motion.sync(nodes, false);
    nodes[2] = note('hiring', 'topic-design', 30, 10);
    motion.sync(nodes, false);
    motion.step(nodes, 1 / 60, true);
    expect(motion.flying('hiring')).toBe(false);
    expect(nodes[2]?.fx).toBeUndefined();
    expect(nodes[2]?.x).toBeGreaterThan(300);
  });

  it('drops a flight when the note leaves or the drag takes over', () => {
    const motion = createClusterMotion();
    const nodes = scene();
    motion.sync(nodes, false);
    nodes[2] = note('hiring', 'topic-design', 30, 10);
    motion.sync(nodes, false);
    motion.cancel('hiring');
    expect(motion.flying('hiring')).toBe(false);
    motion.step(nodes, 1 / 60, false);
    expect(nodes[2]?.x).toBe(30);

    const again = createClusterMotion();
    const present = scene();
    again.sync(present, false);
    present[2] = note('hiring', 'topic-design', 30, 10);
    again.sync(present, false);
    again.sync([hub('topic-design', 400, 0)], false);
    expect(again.flying('hiring')).toBe(false);
  });

  it('keeps a membrane on a cluster that only slides, and eases a real shape change', () => {
    const motion = createClusterMotion();
    const eastern = (points: Point[] | undefined) =>
      Math.max(...(points ?? [[0, 0]]).map((point) => point[0]));
    motion.outlines(new Map([['topic-meetings', square(0, 0, 80)]]), 1 / 60, false);

    const slid = motion.outlines(new Map([['topic-meetings', square(400, 0, 80)]]), 1 / 60, false);
    expect(eastern(slid.get('topic-meetings'))).toBeCloseTo(480, 4);

    const wide: Point[] = [
      [0, 0],
      [400, 0],
      [400, 80],
      [0, 80],
    ];
    motion.outlines(new Map([['topic-design', square(0, 0, 80)]]), 1 / 60, false);
    const opened = motion.outlines(new Map([['topic-design', wide]]), 1 / 60, false);
    const edge = eastern(opened.get('topic-design'));
    expect(edge).toBeGreaterThan(80);
    expect(edge).toBeLessThan(320);

    let latest = opened;
    for (let frame = 0; frame < 100; frame += 1) {
      latest = motion.outlines(new Map([['topic-design', wide]]), 1 / 60, false);
    }
    expect(eastern(latest.get('topic-design'))).toBeCloseTo(400, 0);
  });

  it('snaps the membrane when reduced motion is on, and forgets a topic that disappeared', () => {
    const motion = createClusterMotion();
    motion.outlines(new Map([['topic-meetings', square(0, 0, 40)]]), 1 / 60, false);
    const snapped = motion.outlines(new Map([['topic-meetings', square(300, 0, 40)]]), 1 / 60, true);
    expect(Math.max(...(snapped.get('topic-meetings') ?? []).map((point) => point[0]))).toBeCloseTo(340, 4);
    const gone = motion.outlines(new Map(), 1 / 60, false);
    expect(gone.size).toBe(0);
    const back = motion.outlines(new Map([['topic-meetings', square(0, 0, 40)]]), 1 / 60, false);
    expect(Math.max(...(back.get('topic-meetings') ?? []).map((point) => point[0]))).toBeCloseTo(40, 4);
  });

  it('measures the first frame as one tick and clamps a long gap', () => {
    const motion = createClusterMotion();
    expect(motion.advance(1000)).toBeCloseTo(1 / 60, 5);
    expect(motion.advance(1000 + 500)).toBeCloseTo(0.05, 5);
    expect(motion.advance(1000)).toBe(0);
  });
});
