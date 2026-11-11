import { describe, expect, it } from 'vitest';
import { findHubDropTarget, findNoteDropTarget } from '@/lib/graph/hitTest';
import type { Point } from '@/lib/graph/hulls';

function square(x: number, y: number, size: number): Point[] {
  return [
    [x, y],
    [x, y + size],
    [x + size, y + size],
    [x + size, y],
  ];
}

describe('findNoteDropTarget', () => {
  const box = square(0, 0, 40);
  const farBox = square(200, 200, 40);

  it('returns a topic whose hull contains the point', () => {
    const hulls = new Map<string, Point[]>([
      ['near', box],
      ['far', farBox],
    ]);
    const hubs = [
      { id: 'near', x: 20, y: 20 },
      { id: 'far', x: 220, y: 220 },
    ];
    expect(findNoteDropTarget(12, 30, 1, undefined, hulls, hubs)).toBe('near');
    expect(findNoteDropTarget(-8, -8, 1, undefined, new Map([['neg', square(-20, -20, 20)]]), [])).toBe('neg');
  });

  it('ignores the topic the dragged note already belongs to', () => {
    const hulls = new Map<string, Point[]>([
      ['mine', square(0, 0, 80)],
      ['theirs', square(0, 0, 80)],
    ]);
    const hubs = [
      { id: 'mine', x: 10, y: 10 },
      { id: 'theirs', x: 70, y: 70 },
    ];
    expect(findNoteDropTarget(20, 20, 1, 'mine', hulls, hubs)).toBe('theirs');
    expect(
      findNoteDropTarget(10, 10, 1, 'mine', new Map([['mine', box]]), [
        { id: 'mine', x: 10, y: 10 },
        { id: 'other', x: 400, y: 400 },
      ]),
    ).toBeNull();
  });

  it('prefers a containing hull over a nearer hub that sits outside it', () => {
    const hulls = new Map<string, Point[]>([
      ['cluster', square(0, 0, 30)],
      ['beside', square(200, 200, 30)],
    ]);
    const hubs = [
      { id: 'cluster', x: 100, y: 100 },
      { id: 'beside', x: 12, y: 10 },
    ];
    expect(findNoteDropTarget(10, 10, 1, undefined, hulls, hubs)).toBe('cluster');
    expect(findNoteDropTarget(10, 10, 1, undefined, new Map(), hubs)).toBe('beside');
  });

  it('resolves overlapping hulls to the nearest hub', () => {
    const hulls = new Map<string, Point[]>([
      ['left', square(0, 0, 100)],
      ['right', square(0, 0, 100)],
    ]);
    const hubs = [
      { id: 'left', x: 10, y: 10 },
      { id: 'right', x: 90, y: 90 },
    ];
    expect(findNoteDropTarget(20, 20, 1, undefined, hulls, hubs)).toBe('left');
    expect(findNoteDropTarget(80, 80, 1, undefined, hulls, hubs)).toBe('right');
  });

  it('keeps the earlier hull when overlapping hubs are equally far', () => {
    const hubs = [
      { id: 'a', x: 20, y: 50 },
      { id: 'b', x: 80, y: 50 },
    ];
    const point = [50, 50] as const;
    expect(
      findNoteDropTarget(point[0], point[1], 1, undefined, new Map([
        ['a', square(0, 0, 100)],
        ['b', square(0, 0, 100)],
      ]), hubs),
    ).toBe('a');
    expect(
      findNoteDropTarget(point[0], point[1], 1, undefined, new Map([
        ['b', square(0, 0, 100)],
        ['a', square(0, 0, 100)],
      ]), hubs),
    ).toBe('b');
  });

  it('treats a containing hull with no hub as distance zero', () => {
    const hulls = new Map<string, Point[]>([
      ['placed', square(0, 0, 100)],
      ['ghost', square(0, 0, 100)],
    ]);
    expect(findNoteDropTarget(80, 80, 1, undefined, hulls, [{ id: 'placed', x: 0, y: 0 }])).toBe('ghost');
    expect(findNoteDropTarget(10, 10, 1, undefined, new Map([['ghost', box]]), [])).toBe('ghost');
  });

  it('skips polygons shorter than three points', () => {
    const hulls = new Map<string, Point[]>([
      ['thin', [[0, 0], [100, 0]]],
      ['dot', [[0, 0]]],
      ['empty', []],
      ['box', box],
    ]);
    expect(findNoteDropTarget(50, 0, 1, undefined, hulls, [])).toBeNull();
    expect(findNoteDropTarget(10, 10, 1, undefined, hulls, [])).toBe('box');
  });

  it('follows the polygon half-open edges', () => {
    const hulls = new Map<string, Point[]>([['box', box]]);
    const inside: Point[] = [
      [20, 0],
      [0, 20],
      [0, 0],
      [20, 0.1],
      [39.9, 20],
      [20, 39.9],
    ];
    const outside: Point[] = [
      [20, 40],
      [40, 20],
      [40, 0],
      [40, 40],
      [0, 40],
      [20, -0.1],
      [20, 40.1],
      [-0.1, 20],
      [40.1, 20],
    ];
    for (const [x, y] of inside) {
      expect(findNoteDropTarget(x, y, 1, 'other', hulls, [])).toBe('box');
    }
    for (const [x, y] of outside) {
      expect(findNoteDropTarget(x, y, 1, 'other', hulls, [])).toBeNull();
    }
  });

  it('falls back to the nearest other hub inside an exclusive 80px reach', () => {
    expect(findNoteDropTarget(0, 0, 1, 'self', new Map(), [
      { id: 'self', x: 0, y: 0 },
      { id: 'near', x: 25, y: 0 },
      { id: 'mid', x: 0, y: 40 },
      { id: 'far', x: 70, y: 0 },
    ])).toBe('near');
    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [{ id: 'edge', x: 80, y: 0 }])).toBeNull();
    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [{ id: 'inside', x: 79.999, y: 0 }])).toBe('inside');
    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [{ id: 'diag', x: 48, y: 64 }])).toBeNull();
    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [{ id: 'diag', x: 48, y: 63 }])).toBe('diag');
    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [])).toBeNull();
  });

  it('scales hub reach with zoom and floors the divisor at 0.2', () => {
    const hulls = new Map<string, Point[]>([['box', box]]);
    for (const zoom of [0.05, 1, 50]) {
      expect(findNoteDropTarget(10, 10, zoom, 'other', hulls, [])).toBe('box');
    }

    expect(findNoteDropTarget(0, 0, 1, undefined, new Map(), [{ id: 'hub', x: 50, y: 0 }])).toBe('hub');
    expect(findNoteDropTarget(0, 0, 2, undefined, new Map(), [{ id: 'hub', x: 50, y: 0 }])).toBeNull();
    expect(findNoteDropTarget(0, 0, 4, undefined, new Map(), [{ id: 'hub', x: 15, y: 0 }])).toBe('hub');
    expect(findNoteDropTarget(0, 0, 4, undefined, new Map(), [{ id: 'hub', x: 20, y: 0 }])).toBeNull();

    for (const zoom of [0.2, 0.1, 0, -1]) {
      expect(findNoteDropTarget(0, 0, zoom, undefined, new Map(), [{ id: 'hub', x: 399, y: 0 }])).toBe('hub');
      expect(findNoteDropTarget(0, 0, zoom, undefined, new Map(), [{ id: 'hub', x: 400, y: 0 }])).toBeNull();
    }
  });
});

describe('findHubDropTarget', () => {
  const hubs = [
    { id: 'self', x: 0, y: 0 },
    { id: 'near', x: 30, y: 0 },
    { id: 'far', x: 70, y: 0 },
  ];

  it('returns the nearest other hub inside an exclusive 72px reach', () => {
    expect(findHubDropTarget(0, 0, 1, 'self', hubs)).toBe('near');
    expect(findHubDropTarget(60, 0, 1, 'self', hubs)).toBe('far');
    expect(findHubDropTarget(-90, -100, 1, 'self', [
      { id: 'self', x: 0, y: 0 },
      { id: 'west', x: -100, y: -100 },
    ])).toBe('west');
    expect(findHubDropTarget(0, 0, 1, 'missing', [{ id: 'hub', x: 10, y: 0 }])).toBe('hub');
    expect(findHubDropTarget(0, 0, 1, 'self', [{ id: 'edge', x: 72, y: 0 }])).toBeNull();
    expect(findHubDropTarget(0, 0, 1, 'self', [{ id: 'inside', x: 71.999, y: 0 }])).toBe('inside');
    expect(findHubDropTarget(0, 0, 1, 'self', [])).toBeNull();
    expect(findHubDropTarget(0, 0, 1, 'self', [{ id: 'self', x: 0, y: 0 }])).toBeNull();
  });

  it('scales reach with zoom and floors the divisor at 0.2', () => {
    const hub = [{ id: 'hub', x: 30, y: 0 }];
    expect(findHubDropTarget(0, 0, 1, 'self', hub)).toBe('hub');
    expect(findHubDropTarget(0, 0, 2, 'self', hub)).toBe('hub');
    expect(findHubDropTarget(0, 0, 2, 'self', [{ id: 'hub', x: 36, y: 0 }])).toBeNull();
    expect(findHubDropTarget(0, 0, 4, 'self', [{ id: 'hub', x: 18, y: 0 }])).toBeNull();

    for (const zoom of [0.2, 0.05, 0, -3]) {
      expect(findHubDropTarget(0, 0, zoom, 'self', [{ id: 'hub', x: 359, y: 0 }])).toBe('hub');
      expect(findHubDropTarget(0, 0, zoom, 'self', [{ id: 'hub', x: 360, y: 0 }])).toBeNull();
    }
  });
});
