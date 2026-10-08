import type { Assignment, Note, NoteSource, Topic } from '@/lib/types';

export const SOURCE_LABELS: Record<NoteSource, string> = {
  'meeting-notes': 'Meeting notes',
  docs: 'Docs',
  journal: 'Journal',
  wiki: 'Wiki',
  tasks: 'Tasks',
};

export interface TopicTreeRow {
  topic: Topic;
  depth: number;
}

/** Roots in input order, with their children directly underneath. One level only. */
export function buildTopicTree(topics: Topic[]): TopicTreeRow[] {
  const ids = new Set(topics.map((topic) => topic.id));
  const children = new Map<string, Topic[]>();
  for (const topic of topics) {
    if (!topic.parentId || !ids.has(topic.parentId)) {
      continue;
    }
    const list = children.get(topic.parentId) ?? [];
    list.push(topic);
    children.set(topic.parentId, list);
  }
  const roots = topics.filter(
    (topic) => topic.parentId === null || !ids.has(topic.parentId),
  );
  const rows: TopicTreeRow[] = [];
  for (const root of roots) {
    rows.push({ topic: root, depth: 0 });
    for (const child of children.get(root.id) ?? []) {
      rows.push({ topic: child, depth: 1 });
    }
  }
  return rows;
}

/** Primary assignment counts. Child topics are not rolled up into the parent. */
export function countNotesByTopic(assignments: Assignment[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const assignment of assignments) {
    counts.set(assignment.topicId, (counts.get(assignment.topicId) ?? 0) + 1);
  }
  return counts;
}

export interface TopicNoteRow {
  note: Note;
  assignment: Assignment;
}

export function notesForTopic(
  notes: Note[],
  assignments: Assignment[],
  topicId: string,
): TopicNoteRow[] {
  const notesById = new Map(notes.map((note) => [note.id, note]));
  const rows: TopicNoteRow[] = [];
  for (const assignment of assignments) {
    if (assignment.topicId !== topicId) {
      continue;
    }
    const note = notesById.get(assignment.noteId);
    if (!note) {
      continue;
    }
    rows.push({ note, assignment });
  }
  rows.sort((left, right) => right.note.updatedAt.localeCompare(left.note.updatedAt));
  return rows;
}

const noteDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatNoteDate(iso: string): string {
  return noteDateFormat.format(new Date(iso));
}
