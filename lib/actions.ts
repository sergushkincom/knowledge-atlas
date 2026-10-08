import { USER_MOVE_REASON } from '@/lib/constants';
import { topicPalette } from '@/lib/theme/palette';
import type {
  Assignment,
  NodeLayout,
  Note,
  Topic,
  TopicColor,
} from '@/lib/types';
import { TOPIC_COLORS } from '@/lib/types';

export class AtlasActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtlasActionError';
  }
}

export interface GraphState {
  notes: Note[];
  topics: Topic[];
  assignments: Assignment[];
  layouts: NodeLayout[];
}

function requireTopic(topics: Topic[], topicId: string): Topic {
  const topic = topics.find((item) => item.id === topicId);
  if (!topic) {
    throw new AtlasActionError(`Unknown topic: ${topicId}`);
  }
  return topic;
}

function requireNote(notes: Note[], noteId: string): Note {
  const note = notes.find((item) => item.id === noteId);
  if (!note) {
    throw new AtlasActionError(`Unknown note: ${noteId}`);
  }
  return note;
}

function requireAssignment(assignments: Assignment[], noteId: string): Assignment {
  const assignment = assignments.find((item) => item.noteId === noteId);
  if (!assignment) {
    throw new AtlasActionError(`No assignment for note: ${noteId}`);
  }
  return assignment;
}

function inboxTopic(topics: Topic[]): Topic {
  const inbox = topics.find((topic) => topic.isInbox);
  if (!inbox) {
    throw new AtlasActionError('Unsorted topic is missing');
  }
  return inbox;
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function sameAssignment(left: Assignment, right: Assignment): boolean {
  return (
    left.noteId === right.noteId &&
    left.topicId === right.topicId &&
    left.confidence === right.confidence &&
    left.reason === right.reason &&
    left.origin === right.origin &&
    left.locked === right.locked &&
    sameIds(left.secondaryTopicIds, right.secondaryTopicIds)
  );
}

function replaceAssignment(
  assignments: Assignment[],
  noteId: string,
  next: Assignment,
): Assignment[] {
  const index = assignments.findIndex((item) => item.noteId === noteId);
  const current = assignments[index];
  if (!current || sameAssignment(current, next)) {
    return assignments;
  }
  const copy = assignments.slice();
  copy[index] = next;
  return copy;
}

function mapAssignments(
  assignments: Assignment[],
  noteIds: ReadonlySet<string>,
  update: (assignment: Assignment) => Assignment,
): Assignment[] {
  let changed = false;
  const next = assignments.map((assignment) => {
    if (!noteIds.has(assignment.noteId)) {
      return assignment;
    }
    const updated = update(assignment);
    if (!sameAssignment(assignment, updated)) {
      changed = true;
    }
    return updated;
  });
  return changed ? next : assignments;
}

function unpinNotes(layouts: NodeLayout[], noteIds: ReadonlySet<string>): NodeLayout[] {
  let changed = false;
  const next = layouts.map((layout) => {
    if (!noteIds.has(layout.id) || !layout.pinned) {
      return layout;
    }
    changed = true;
    return { ...layout, pinned: false };
  });
  return changed ? next : layouts;
}

function withoutLayout(layouts: NodeLayout[], id: string): NodeLayout[] {
  const next = layouts.filter((layout) => layout.id !== id);
  return next.length === layouts.length ? layouts : next;
}

/**
 * Reassign the primary topic. The note is locked, unpinned, and marked as a
 * manual move so a later AI organize cannot put it back.
 */
export function moveNotes(
  state: GraphState,
  noteIds: readonly string[],
  topicId: string,
): Pick<GraphState, 'assignments' | 'layouts'> {
  if (noteIds.length === 0) {
    throw new AtlasActionError('Choose at least one note to move');
  }
  requireTopic(state.topics, topicId);
  const ids = new Set(noteIds);
  for (const noteId of ids) {
    requireNote(state.notes, noteId);
    requireAssignment(state.assignments, noteId);
  }

  const assignments = mapAssignments(state.assignments, ids, (assignment) => ({
    ...assignment,
    topicId,
    secondaryTopicIds: assignment.secondaryTopicIds.filter((id) => id !== topicId),
    confidence: 1,
    reason: USER_MOVE_REASON,
    origin: 'user',
    locked: true,
  }));

  return {
    assignments,
    layouts: unpinNotes(state.layouts, ids),
  };
}

/**
 * Alt-drop. The note stays in its cluster and gains a second topic.
 * The whole assignment locks so organize cannot drop the manual link.
 * Confidence and the original reason stay, because the primary topic was not confirmed.
 */
export function addSecondaryTopic(
  state: GraphState,
  noteId: string,
  topicId: string,
): Pick<GraphState, 'assignments'> {
  requireNote(state.notes, noteId);
  requireTopic(state.topics, topicId);
  const current = requireAssignment(state.assignments, noteId);
  if (current.topicId === topicId || current.secondaryTopicIds.includes(topicId)) {
    return { assignments: state.assignments };
  }
  return {
    assignments: replaceAssignment(state.assignments, noteId, {
      ...current,
      secondaryTopicIds: [...current.secondaryTopicIds, topicId],
      origin: 'user',
      locked: true,
    }),
  };
}

export interface CreateTopicInput {
  noteId: string;
  name?: string;
  color?: TopicColor;
  id?: string;
}

function unusedColor(topics: Topic[]): TopicColor {
  const used = new Set(topics.map((topic) => topic.color));
  return TOPIC_COLORS.find((color) => !used.has(color)) ?? 'gray';
}

function slug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return cleaned || 'topic';
}

/** Shift-drop on empty canvas. The note becomes the first member of a user topic. */
export function createTopic(
  state: GraphState,
  input: CreateTopicInput,
): Pick<GraphState, 'topics' | 'assignments' | 'layouts'> & { topicId: string } {
  requireNote(state.notes, input.noteId);
  requireAssignment(state.assignments, input.noteId);
  const name = (input.name ?? 'New topic').trim();
  if (!name) {
    throw new AtlasActionError('Topic name cannot be empty');
  }
  const topicId = input.id ?? `topic-user-${slug(name)}-${state.topics.length + 1}`;
  if (state.topics.some((topic) => topic.id === topicId)) {
    throw new AtlasActionError(`Topic already exists: ${topicId}`);
  }
  if (input.color && !(input.color in topicPalette)) {
    throw new AtlasActionError(`Unknown color: ${input.color}`);
  }

  const topic: Topic = {
    id: topicId,
    name,
    description: '',
    color: input.color ?? unusedColor(state.topics),
    parentId: null,
    origin: 'user',
  };
  const moved = moveNotes(
    { ...state, topics: [...state.topics, topic] },
    [input.noteId],
    topicId,
  );
  return {
    topicId,
    topics: [...state.topics, topic],
    assignments: moved.assignments,
    layouts: moved.layouts,
  };
}

function parentForDisplacedChildren(target: Topic, sourceId: string): string | null {
  if (target.parentId === null) {
    return target.id;
  }
  if (target.parentId === sourceId) {
    return null;
  }
  return target.parentId;
}

/** Drop one hub on another. Notes and assignments survive on the target topic. */
export function mergeTopics(
  state: GraphState,
  sourceId: string,
  targetId: string,
): Pick<GraphState, 'topics' | 'assignments' | 'layouts'> {
  if (sourceId === targetId) {
    throw new AtlasActionError('Choose two different topics to merge');
  }
  const source = requireTopic(state.topics, sourceId);
  const target = requireTopic(state.topics, targetId);
  if (source.isInbox) {
    throw new AtlasActionError('Unsorted cannot be merged away');
  }

  const displacedParent = parentForDisplacedChildren(target, sourceId);
  const topics = state.topics
    .filter((topic) => topic.id !== sourceId)
    .map((topic) => {
      if (topic.id === targetId && topic.parentId === sourceId) {
        return { ...topic, parentId: null };
      }
      if (topic.parentId === sourceId) {
        return { ...topic, parentId: displacedParent };
      }
      return topic;
    });

  let assignmentsChanged = false;
  const assignments = state.assignments.map((assignment): Assignment => {
    const secondary = assignment.secondaryTopicIds.filter((id) => id !== sourceId);
    let topicId = assignment.topicId;
    if (topicId === sourceId) {
      topicId = targetId;
    }
    const secondaryWithoutTarget =
      topicId === targetId ? secondary.filter((id) => id !== targetId) : secondary;
    const withTarget =
      assignment.secondaryTopicIds.includes(sourceId) &&
      topicId !== targetId &&
      !secondaryWithoutTarget.includes(targetId)
        ? [...secondaryWithoutTarget, targetId]
        : secondaryWithoutTarget;
    if (topicId === assignment.topicId && sameIds(withTarget, assignment.secondaryTopicIds)) {
      return assignment;
    }
    assignmentsChanged = true;
    return { ...assignment, topicId, secondaryTopicIds: withTarget };
  });

  return {
    topics,
    assignments: assignmentsChanged ? assignments : state.assignments,
    layouts: withoutLayout(state.layouts, sourceId),
  };
}

/** Nest one level deep, or pass null to bring a topic back to the root. */
export function nestTopic(
  state: GraphState,
  topicId: string,
  parentId: string | null,
): Pick<GraphState, 'topics'> {
  const topic = requireTopic(state.topics, topicId);
  if (topic.isInbox) {
    throw new AtlasActionError('Unsorted stays at the root');
  }
  if (topic.parentId === parentId) {
    return { topics: state.topics };
  }
  if (parentId === null) {
    return {
      topics: state.topics.map((item) =>
        item.id === topicId ? { ...item, parentId: null } : item,
      ),
    };
  }
  if (parentId === topicId) {
    throw new AtlasActionError('A topic cannot nest under itself');
  }
  const parent = requireTopic(state.topics, parentId);
  if (parent.isInbox) {
    throw new AtlasActionError('Topics cannot nest under Unsorted');
  }
  if (parent.parentId !== null) {
    throw new AtlasActionError('Topics nest one level');
  }
  const hasChildren = state.topics.some((item) => item.parentId === topicId);
  if (hasChildren) {
    throw new AtlasActionError('Move this topic’s subtopics out before nesting it');
  }
  return {
    topics: state.topics.map((item) =>
      item.id === topicId ? { ...item, parentId } : item,
    ),
  };
}

/** Renaming is a manual decision, so the topic’s origin becomes user. */
export function renameTopic(
  state: GraphState,
  topicId: string,
  name: string,
): Pick<GraphState, 'topics'> {
  requireTopic(state.topics, topicId);
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AtlasActionError('Topic name cannot be empty');
  }
  const current = state.topics.find((topic) => topic.id === topicId);
  if (current && current.name === trimmed) {
    return { topics: state.topics };
  }
  return {
    topics: state.topics.map((topic) =>
      topic.id === topicId ? { ...topic, name: trimmed, origin: 'user' } : topic,
    ),
  };
}

/** Delete a topic. Its notes move to Unsorted. Child topics return to the root. */
export function deleteTopic(
  state: GraphState,
  topicId: string,
): Pick<GraphState, 'topics' | 'assignments' | 'layouts'> {
  const topic = requireTopic(state.topics, topicId);
  if (topic.isInbox) {
    throw new AtlasActionError('Unsorted cannot be deleted');
  }
  const inbox = inboxTopic(state.topics);
  const topics = state.topics
    .filter((item) => item.id !== topicId)
    .map((item) =>
      item.parentId === topicId ? { ...item, parentId: null } : item,
    );

  let assignmentsChanged = false;
  const assignments = state.assignments.map((assignment): Assignment => {
    const secondary = assignment.secondaryTopicIds.filter((id) => id !== topicId);
    const topicChanged = assignment.topicId === topicId;
    const nextTopicId = topicChanged ? inbox.id : assignment.topicId;
    const nextSecondary =
      nextTopicId === inbox.id ? secondary.filter((id) => id !== inbox.id) : secondary;
    if (!topicChanged && sameIds(nextSecondary, assignment.secondaryTopicIds)) {
      return assignment;
    }
    assignmentsChanged = true;
    if (!topicChanged) {
      return { ...assignment, secondaryTopicIds: nextSecondary };
    }
    return {
      ...assignment,
      topicId: nextTopicId,
      secondaryTopicIds: nextSecondary,
      confidence: 1,
      reason: USER_MOVE_REASON,
      origin: 'user',
      locked: true,
    };
  });

  return {
    topics,
    assignments: assignmentsChanged ? assignments : state.assignments,
    layouts: withoutLayout(state.layouts, topicId),
  };
}

export function lockAssignment(
  state: GraphState,
  noteId: string,
): Pick<GraphState, 'assignments'> {
  requireNote(state.notes, noteId);
  const current = requireAssignment(state.assignments, noteId);
  if (current.locked && current.origin === 'user') {
    return { assignments: state.assignments };
  }
  return {
    assignments: replaceAssignment(state.assignments, noteId, {
      ...current,
      locked: true,
      origin: 'user',
    }),
  };
}

export function unlockAssignment(
  state: GraphState,
  noteId: string,
): Pick<GraphState, 'assignments'> {
  requireNote(state.notes, noteId);
  const current = requireAssignment(state.assignments, noteId);
  if (!current.locked) {
    return { assignments: state.assignments };
  }
  return {
    assignments: replaceAssignment(state.assignments, noteId, {
      ...current,
      locked: false,
    }),
  };
}

function requireNode(state: GraphState, id: string): void {
  if (state.notes.some((note) => note.id === id) || state.topics.some((topic) => topic.id === id)) {
    return;
  }
  throw new AtlasActionError(`Unknown node: ${id}`);
}

export function pinNode(
  state: GraphState,
  id: string,
  x: number,
  y: number,
): Pick<GraphState, 'layouts'> {
  requireNode(state, id);
  const index = state.layouts.findIndex((layout) => layout.id === id);
  const nextLayout: NodeLayout = { id, x, y, pinned: true };
  if (index === -1) {
    return { layouts: [...state.layouts, nextLayout] };
  }
  const current = state.layouts[index];
  if (current && current.x === x && current.y === y && current.pinned) {
    return { layouts: state.layouts };
  }
  const layouts = state.layouts.slice();
  layouts[index] = nextLayout;
  return { layouts };
}

export function unpinNode(state: GraphState, id: string): Pick<GraphState, 'layouts'> {
  requireNode(state, id);
  const current = state.layouts.find((layout) => layout.id === id);
  if (!current || !current.pinned) {
    return { layouts: state.layouts };
  }
  return {
    layouts: state.layouts.map((layout) =>
      layout.id === id ? { ...layout, pinned: false } : layout,
    ),
  };
}
