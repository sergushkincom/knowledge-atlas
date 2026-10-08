import { describe, expect, it } from 'vitest';
import { ORPHAN_IDS, notes } from '@/data/seed';
import { AMBIGUOUS_NOTE_IDS, assignments, topics } from '@/data/seedAssignments';
import { buildGraph } from '@/lib/graph/buildGraph';
import { findHubDropTarget, findNoteDropTarget } from '@/lib/graph/hitTest';
import { bubbleMembrane, hullFor } from '@/lib/graph/hulls';

describe('seed', () => {
  it('loads 120 notes into 9 topics', () => {
    expect(notes).toHaveLength(120);
    expect(topics).toHaveLength(9);
    expect(assignments).toHaveLength(120);
    expect(topics.filter((topic) => topic.isInbox)).toHaveLength(1);
    expect(new Set(assignments.map((item) => item.noteId)).size).toBe(120);
  });

  it('keeps a handful of ambiguous notes and orphans', () => {
    expect(AMBIGUOUS_NOTE_IDS).toHaveLength(18);
    for (const id of AMBIGUOUS_NOTE_IDS) {
      const assignment = assignments.find((item) => item.noteId === id);
      expect(assignment?.confidence).toBeLessThan(0.6);
      expect(assignment?.secondaryTopicIds.length).toBeGreaterThan(0);
    }
    const orphans = notes.filter((note) => note.links.length === 0).map((note) => note.id);
    expect(orphans).toEqual([...ORPHAN_IDS]);
  });
});

describe('graph', () => {
  it('derives a belongs edge for every note', () => {
    const graph = buildGraph({ notes, topics, assignments });
    const primary = graph.edges.filter((edge) => edge.kind === 'belongs' && edge.weight === 1);
    expect(primary).toHaveLength(notes.length);
    expect(graph.nodes.filter((node) => node.kind === 'note')).toHaveLength(120);
  });

  it('detects a drop inside another hull and a nearby hub', () => {
    const hulls = new Map([
      ['a', [[0, 0], [0, 40], [40, 40], [40, 0]] as [number, number][]],
      ['b', [[200, 200], [200, 240], [240, 240], [240, 200]] as [number, number][]],
    ]);
    const hubs = [
      { id: 'a', x: 20, y: 20 },
      { id: 'b', x: 220, y: 220 },
    ];
    expect(findNoteDropTarget(10, 10, 1, 'b', hulls, hubs)).toBe('a');
    expect(findNoteDropTarget(10, 10, 1, 'a', hulls, hubs)).toBeNull();
    expect(findHubDropTarget(20, 20, 1, 'b', hubs)).toBe('a');
    const hull = hullFor([[0, 0], [10, 0], [0, 10]]);
    expect(hull?.length).toBeGreaterThan(2);
    const square: [number, number][] = [[0, 0], [40, 0], [40, 40], [0, 40]];
    const membrane = bubbleMembrane(square, 0.4, 1);
    for (let index = 0; index < square.length; index += 1) {
      const origin = square[index];
      const moved = membrane[index];
      if (!origin || !moved) {
        continue;
      }
      const before = Math.hypot(origin[0] - 20, origin[1] - 20);
      const after = Math.hypot(moved[0] - 20, moved[1] - 20);
      expect(after).toBeGreaterThan(before);
    }
  });
});
