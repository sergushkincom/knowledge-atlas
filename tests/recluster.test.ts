import { describe, expect, it } from 'vitest';
import { notes } from '@/data/seed';
import { assignments, topics } from '@/data/seedAssignments';
import { moveNotes, reclusterAssignments, type GraphState } from '@/lib/actions';
import { RECLUSTER_REASON, USER_MOVE_REASON } from '@/lib/constants';
import type { Assignment, Topic } from '@/lib/types';

function topic(overrides: Partial<Topic> & Pick<Topic, 'id' | 'name'>): Topic {
  return {
    description: '',
    color: 'blue',
    parentId: null,
    origin: 'ai',
    ...overrides,
  };
}

function assignment(
  overrides: Partial<Assignment> & Pick<Assignment, 'noteId' | 'topicId'>,
): Assignment {
  return {
    secondaryTopicIds: [],
    confidence: 0.46,
    reason: 'Sorted by the prototype.',
    origin: 'ai',
    locked: false,
    ...overrides,
  };
}

function graph(items: Assignment[], topicList: Topic[] = topics): GraphState {
  return { notes, topics: topicList, assignments: items, layouts: [] };
}

describe('reclusterAssignments', () => {
  const fixtureTopics = [
    topic({ id: 'topic-meetings', name: 'Meetings' }),
    topic({ id: 'topic-design', name: 'Design work' }),
    topic({ id: 'topic-interviews', name: 'Interview prep' }),
  ];

  it('leaves a locked correction in place and moves an unlocked note', () => {
    const locked = assignment({
      noteId: 'note-hiring-sync',
      topicId: 'topic-design',
      secondaryTopicIds: ['topic-interviews'],
      confidence: 1,
      reason: USER_MOVE_REASON,
      origin: 'user',
      locked: true,
    });
    const unlocked = assignment({
      noteId: 'note-design-crit',
      topicId: 'topic-meetings',
      secondaryTopicIds: ['topic-design'],
      confidence: 0.48,
    });
    const next = reclusterAssignments(graph([locked, unlocked], fixtureTopics));

    expect(next.assignments[0]).toBe(locked);
    expect(next.assignments[1]).toMatchObject({
      noteId: 'note-design-crit',
      topicId: 'topic-design',
      secondaryTopicIds: ['topic-meetings'],
      confidence: 0.48,
      reason: RECLUSTER_REASON,
      origin: 'ai',
      locked: false,
    });
  });

  it('does nothing when no unlocked note has another topic', () => {
    const items = [
      assignment({ noteId: 'note-a', topicId: 'topic-meetings' }),
      assignment({
        noteId: 'note-b',
        topicId: 'topic-design',
        secondaryTopicIds: ['topic-missing'],
        locked: true,
        origin: 'user',
        reason: USER_MOVE_REASON,
      }),
    ];
    const next = reclusterAssignments(graph(items, fixtureTopics));
    expect(next.assignments).toBe(items);
  });

  it('keeps the seeded correction path the browser test drives', () => {
    const initial = graph(assignments);
    const moved = moveNotes(initial, ['note-hiring-sync'], 'topic-design');
    const hiring = moved.assignments.find((item) => item.noteId === 'note-hiring-sync');
    expect(hiring).toMatchObject({
      topicId: 'topic-design',
      secondaryTopicIds: ['topic-interviews'],
      confidence: 1,
      reason: USER_MOVE_REASON,
      origin: 'user',
      locked: true,
    });

    const next = reclusterAssignments({ ...initial, assignments: moved.assignments });
    expect(next.assignments.find((item) => item.noteId === 'note-hiring-sync')).toBe(hiring);
    expect(next.assignments.find((item) => item.noteId === 'note-design-crit')).toMatchObject({
      topicId: 'topic-design',
      secondaryTopicIds: ['topic-meetings'],
      reason: RECLUSTER_REASON,
      origin: 'ai',
      locked: false,
    });
  });
});
