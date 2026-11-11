import { polygonContains, polygonHull } from 'd3-polygon';
import { describe, expect, it } from 'vitest';
import { bubbleMembrane, buildClusterHulls, hullFor, type HullNode, type Point } from '@/lib/graph/hulls';

function expectRing(hull: Point[] | null, center: Point, radius: number) {
  expect(hull).toHaveLength(10);
  if (!hull) {
    return;
  }
  hull.forEach((point, index) => {
    const angle = (index / 10) * Math.PI * 2;
    expect(point[0]).toBeCloseTo(center[0] + Math.cos(angle) * radius, 8);
    expect(point[1]).toBeCloseTo(center[1] + Math.sin(angle) * radius, 8);
  });
}

function centroidOf(points: Point[]): Point {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return [cx, cy];
}

function node(partial: Partial<HullNode> & Pick<HullNode, 'id' | 'kind'>): HullNode {
  return { radius: 8, ...partial };
}

describe('hullFor', () => {
  it('returns null for an empty cluster', () => {
    expect(hullFor([])).toBeNull();
  });

  it('draws a padded ring around one point, with a minimum radius of 18', () => {
    expectRing(hullFor([[4, -2]]), [4, -2], 42);
    expectRing(hullFor([[4, -2]], 10), [4, -2], 28);
    expectRing(hullFor([[4, -2]], 0), [4, -2], 18);
  });

  it('rings two points around their midpoint', () => {
    expectRing(hullFor([[0, 0], [10, 0]]), [5, 0], 42);
    expectRing(hullFor([[0, 0], [100, 0]], 24), [50, 0], 74);
  });

  it('pushes every convex-hull vertex outward by the padding', () => {
    const points: Point[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5],
      [1, 2],
      [9, 8],
    ];
    const padding = 24;
    const raw = polygonHull(points);
    const hull = hullFor(points, padding);
    expect(raw).not.toBeNull();
    expect(hull).toHaveLength(raw?.length ?? 0);
    if (!raw || !hull) {
      return;
    }
    const [cx, cy] = centroidOf(raw);
    raw.forEach((vertex, index) => {
      const moved = hull[index];
      expect(moved).toBeDefined();
      if (!moved) {
        return;
      }
      const before = Math.hypot(vertex[0] - cx, vertex[1] - cy);
      const after = Math.hypot(moved[0] - cx, moved[1] - cy);
      expect(after).toBeCloseTo(before + padding, 6);
      const cross = (vertex[0] - cx) * (moved[1] - cy) - (vertex[1] - cy) * (moved[0] - cx);
      const dot = (vertex[0] - cx) * (moved[0] - cx) + (vertex[1] - cy) * (moved[1] - cy);
      expect(cross).toBeCloseTo(0, 6);
      expect(dot).toBeGreaterThan(0);
    });
    expect(polygonContains(hull, [5, 5])).toBe(true);
    expect(polygonContains(hull, [80, 80])).toBe(false);
    expect(hullFor(points)).toEqual(hull);
    expect(hull).toHaveLength(4);
  });

  it('leaves a real hull unchanged when padding is zero', () => {
    const skinny: Point[] = [[0, 0], [100, 0], [50, 0.01]];
    expect(hullFor(skinny, 0)).toEqual(polygonHull(skinny));
    expect(hullFor(skinny, 0)).toHaveLength(3);
  });

  it('rings collinear and repeated points instead of a degenerate segment', () => {
    expectRing(hullFor([[0, 0], [30, 0], [60, 0]]), [30, 0], 54);
    expectRing(hullFor([[0, 0], [0, 40], [0, 80]], 6), [0, 40], 46);
    expectRing(hullFor([[0, 0], [0, 10], [0, 20]], 6), [0, 10], 24);
    expectRing(hullFor([[3, 3], [3, 3], [3, 3]]), [3, 3], 42);
    expect(polygonHull([[0, 0], [30, 0], [60, 0]])).toHaveLength(2);
  });

  it('does not mutate its input', () => {
    const points: Point[] = [[0, 0], [4, 0], [0, 4]];
    const snapshot = points.map((point) => [point[0], point[1]] as Point);
    hullFor(points, 10);
    expect(points).toEqual(snapshot);
  });
});

describe('buildClusterHulls', () => {
  it('skips nodes that are missing a coordinate', () => {
    expect(buildClusterHulls([])).toEqual(new Map());
    expect(buildClusterHulls([
      node({ id: 'no-x', kind: 'topic', y: 5 }),
      node({ id: 'no-y', kind: 'topic', x: 5 }),
      node({ id: 'note', kind: 'note', topicId: 'no-x' }),
    ])).toEqual(new Map());

    const hulls = buildClusterHulls([
      node({ id: 'no-x', kind: 'topic', y: 5 }),
      node({ id: 'placed', kind: 'note', topicId: 'no-x', x: 4, y: -2 }),
    ]);
    expect([...hulls.keys()]).toEqual(['no-x']);
    expectRing(hulls.get('no-x') ?? null, [4, -2], 42);
  });

  it('keeps the origin and drops notes that have no topic', () => {
    const hulls = buildClusterHulls([
      node({ id: 'origin', kind: 'topic', x: 0, y: 0 }),
      node({ id: 'loose', kind: 'note', x: 8, y: 8 }),
      node({ id: 'blank', kind: 'note', topicId: '', x: 1, y: 1 }),
    ]);
    expect([...hulls.keys()]).toEqual(['origin']);
    expectRing(hulls.get('origin') ?? null, [0, 0], 42);
  });

  it('groups a topic with its notes and keeps other clusters apart', () => {
    const hulls = buildClusterHulls([
      node({ id: 'hub', kind: 'topic', x: 0, y: 0 }),
      node({ id: 'n1', kind: 'note', topicId: 'hub', x: 6, y: 0 }),
      node({ id: 'n2', kind: 'note', topicId: 'hub', x: 0, y: 8 }),
      node({ id: 'other', kind: 'topic', x: 100, y: 100 }),
      node({ id: 'loose', kind: 'note', topicId: 'missing-hub', x: 4, y: -2 }),
    ]);
    expect([...hulls.keys()]).toEqual(['hub', 'other', 'missing-hub']);
    expect(hulls.get('hub')).toHaveLength(3);
    const hub = hulls.get('hub');
    if (hub) {
      expect(polygonContains(hub, [1, 1])).toBe(true);
    }
    expectRing(hulls.get('other') ?? null, [100, 100], 42);
    expectRing(hulls.get('missing-hub') ?? null, [4, -2], 42);
  });

  it('rings a collinear cluster so the notes stay inside a drawable hull', () => {
    const hulls = buildClusterHulls([
      node({ id: 'line', kind: 'topic', x: 0, y: 0 }),
      node({ id: 'a', kind: 'note', topicId: 'line', x: 30, y: 0 }),
      node({ id: 'b', kind: 'note', topicId: 'line', x: 60, y: 0 }),
    ]);
    expectRing(hulls.get('line') ?? null, [30, 0], 54);
  });
});

describe('bubbleMembrane', () => {
  it('returns an empty list for no points', () => {
    expect(bubbleMembrane([], 1, 1)).toEqual([]);
  });

  it('holds a point that is already the centroid', () => {
    expect(bubbleMembrane([[4, -2]], 3, 9)).toEqual([[4, -2]]);
    const moved = bubbleMembrane([[0, 0], [10, 0], [5, 0]], 1.7, 4);
    expect(moved[2]).toEqual([5, 0]);
  });

  it('offsets each vertex radially by its own positive breath', () => {
    const input: Point[] = [[0, 0], [10, 0]];
    const snapshot = input.map((point) => [point[0], point[1]] as Point);
    const membrane = bubbleMembrane(input, 0, 0);
    expect(membrane).toHaveLength(2);
    expect(membrane[0]?.[0]).toBeCloseTo(-12, 8);
    expect(membrane[0]?.[1]).toBeCloseTo(0, 8);
    expect(membrane[1]?.[0]).toBeCloseTo(26.507682430841754, 8);
    expect(membrane[1]?.[1]).toBeCloseTo(0, 8);
    expect(input).toEqual(snapshot);

    const offAxis = bubbleMembrane([[2, 3], [8, -1], [5, 5]], 2, 3);
    const expected: Point[] = [
      [-10.333379851414854, 5.740751078092189],
      [16.547773716994076, -10.49752635221564],
      [5, 14.156579804648532],
    ];
    offAxis.forEach((point, index) => {
      expect(point[0]).toBeCloseTo(expected[index]?.[0] ?? 0, 8);
      expect(point[1]).toBeCloseTo(expected[index]?.[1] ?? 0, 8);
    });
  });

  it('keeps every vertex strictly outside the original polygon', () => {
    const square: Point[] = [[0, 0], [40, 0], [40, 40], [0, 40]];
    const [cx, cy] = [20, 20];
    for (const time of [0, 0.3, 1, 2.5, 6, 12]) {
      for (const seed of [0, 1, -4, 8]) {
        const moved = bubbleMembrane(square, time, seed);
        expect(moved).toHaveLength(square.length);
        moved.forEach((point, index) => {
          const origin = square[index];
          expect(origin).toBeDefined();
          if (!origin) {
            return;
          }
          const before = Math.hypot(origin[0] - cx, origin[1] - cy);
          const after = Math.hypot(point[0] - cx, point[1] - cy);
          expect(after).toBeGreaterThan(before);
        });
      }
    }
    expect(bubbleMembrane(square, 1, 0)).not.toEqual(bubbleMembrane(square, 1, 2));
    expect(bubbleMembrane(square, 0, 1)).not.toEqual(bubbleMembrane(square, 2, 1));
  });
});
