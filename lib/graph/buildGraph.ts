import {
  LOW_CONFIDENCE_THRESHOLD,
  NOTE_RADIUS_MAX,
  NOTE_RADIUS_MIN,
  SHARED_ATTRIBUTE_MAX,
  SHARED_ATTRIBUTE_MIN,
  TOPIC_RADIUS_MAX,
  TOPIC_RADIUS_MIN,
} from '@/lib/constants';
import type {
  Assignment,
  Edge,
  EdgeKind,
  NodeLayout,
  Note,
  Topic,
  TopicColor,
} from '@/lib/types';

export interface GraphNode {
  id: string;
  kind: 'note' | 'topic';
  label: string;
  color: TopicColor;
  radius: number;
  pinned: boolean;
  lowConfidence: boolean;
  confidence?: number;
  updatedAt?: string;
  topicId?: string;
  parentId?: string | null;
  noteCount?: number;
  /** Non-belongs edges touching this node. Note size uses this. */
  degree: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: Edge[];
}

export interface BuildGraphInput {
  notes: Note[];
  topics: Topic[];
  assignments: Assignment[];
  layouts?: NodeLayout[];
  /** Optional similar-edges from the organizer. Not stored on the atlas. */
  similarities?: Edge[];
}

const EMPTY_LAYOUTS: NodeLayout[] = [];
const EMPTY_EDGES: Edge[] = [];

interface CacheKey {
  notes: Note[];
  topics: Topic[];
  assignments: Assignment[];
  layouts: NodeLayout[];
  similarities: Edge[];
  result: GraphData;
}

let cache: CacheKey | null = null;

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) {
    return (outMin + outMax) / 2;
  }
  const t = (value - min) / (max - min);
  return outMin + t * (outMax - outMin);
}

function pairKey(left: string, right: string): string {
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function normalizeTag(value: string): string {
  return value.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase();
}

function normalizePerson(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function sharedEdges(
  notes: Note[],
  kind: Extract<EdgeKind, 'tag' | 'person'>,
  valuesOf: (note: Note) => string[],
  normalize: (value: string) => string,
): Edge[] {
  const buckets = new Map<string, string[]>();
  for (const note of notes) {
    const seen = new Set<string>();
    for (const raw of valuesOf(note)) {
      const key = normalize(raw);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      const list = buckets.get(key) ?? [];
      list.push(note.id);
      buckets.set(key, list);
    }
  }

  const weights = new Map<string, number>();
  for (const ids of buckets.values()) {
    if (ids.length < SHARED_ATTRIBUTE_MIN || ids.length > SHARED_ATTRIBUTE_MAX) {
      continue;
    }
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const left = ids[i];
        const right = ids[j];
        if (!left || !right) {
          continue;
        }
        const key = pairKey(left, right);
        weights.set(key, (weights.get(key) ?? 0) + 1);
      }
    }
  }

  return [...weights.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, weight]) => {
      const [source, target] = key.split('|');
      return {
        id: `${kind}:${source}:${target}`,
        source: source ?? '',
        target: target ?? '',
        kind,
        weight,
      };
    });
}

function linkEdges(notes: Note[]): Edge[] {
  const ids = new Set(notes.map((note) => note.id));
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const note of notes) {
    for (const target of note.links) {
      if (target === note.id || !ids.has(target)) {
        continue;
      }
      const key = pairKey(note.id, target);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const [source, other] = key.split('|');
      edges.push({
        id: `link:${source}:${other}`,
        source: source ?? '',
        target: other ?? '',
        kind: 'link',
        weight: 1,
      });
    }
  }
  edges.sort((left, right) => left.id.localeCompare(right.id));
  return edges;
}

function belongsEdges(notes: Note[], topics: Topic[], assignments: Assignment[]): Edge[] {
  const noteIds = new Set(notes.map((note) => note.id));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const byNote = new Map(notes.map((note) => [note.id, note]));
  const edges: Edge[] = [];
  const ordered = assignments
    .filter((assignment) => noteIds.has(assignment.noteId))
    .sort((left, right) => left.noteId.localeCompare(right.noteId));

  for (const assignment of ordered) {
    if (!byNote.has(assignment.noteId) || !topicIds.has(assignment.topicId)) {
      continue;
    }
    edges.push({
      id: `belongs:${assignment.noteId}:${assignment.topicId}`,
      source: assignment.noteId,
      target: assignment.topicId,
      kind: 'belongs',
      weight: 1,
    });
    for (const secondaryId of assignment.secondaryTopicIds) {
      if (!topicIds.has(secondaryId) || secondaryId === assignment.topicId) {
        continue;
      }
      edges.push({
        id: `belongs:${assignment.noteId}:${secondaryId}`,
        source: assignment.noteId,
        target: secondaryId,
        kind: 'belongs',
        weight: 0.45,
      });
    }
  }
  return edges;
}

function similarEdges(similarities: Edge[], notes: Note[], topics: Topic[]): Edge[] {
  const ids = new Set([...notes.map((note) => note.id), ...topics.map((topic) => topic.id)]);
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const edge of similarities) {
    if (edge.kind !== 'similar') {
      continue;
    }
    if (!ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) {
      continue;
    }
    const key = pairKey(edge.source, edge.target);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const [source, target] = key.split('|');
    edges.push({
      id: `similar:${source}:${target}`,
      source: source ?? '',
      target: target ?? '',
      kind: 'similar',
      weight: edge.weight,
    });
  }
  return edges;
}

function computeGraph(input: BuildGraphInput, layouts: NodeLayout[], similarities: Edge[]): GraphData {
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]));
  const assignmentByNote = new Map(input.assignments.map((assignment) => [assignment.noteId, assignment]));
  const topicById = new Map(input.topics.map((topic) => [topic.id, topic]));

  const primaryCounts = new Map<string, number>();
  for (const assignment of input.assignments) {
    if (!topicById.has(assignment.topicId)) {
      continue;
    }
    primaryCounts.set(assignment.topicId, (primaryCounts.get(assignment.topicId) ?? 0) + 1);
  }
  const counts = [...primaryCounts.values()];
  const minCount = counts.length > 0 ? Math.min(...counts) : 0;
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

  const edges = [
    ...belongsEdges(input.notes, input.topics, input.assignments),
    ...linkEdges(input.notes),
    ...sharedEdges(input.notes, 'tag', (note) => note.tags, normalizeTag),
    ...sharedEdges(input.notes, 'person', (note) => note.people, normalizePerson),
    ...similarEdges(similarities, input.notes, input.topics),
  ];

  const degree = new Map<string, number>();
  for (const edge of edges) {
    if (edge.kind === 'belongs') {
      continue;
    }
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  const degrees = [...degree.values()];
  const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;
  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;

  const topicNodes: GraphNode[] = input.topics.map((topic) => {
    const noteCount = primaryCounts.get(topic.id) ?? 0;
    const layout = layoutById.get(topic.id);
    return {
      id: topic.id,
      kind: 'topic',
      label: topic.name,
      color: topic.color,
      radius: Number(scale(noteCount, minCount, maxCount, TOPIC_RADIUS_MIN, TOPIC_RADIUS_MAX).toFixed(1)),
      pinned: layout?.pinned ?? false,
      lowConfidence: false,
      parentId: topic.parentId,
      noteCount,
      degree: degree.get(topic.id) ?? 0,
    };
  });

  const noteNodes: GraphNode[] = input.notes.map((note) => {
    const assignment = assignmentByNote.get(note.id);
    const topic = assignment ? topicById.get(assignment.topicId) : undefined;
    const layout = layoutById.get(note.id);
    const nodeDegree = degree.get(note.id) ?? 0;
    const confidence = assignment?.confidence;
    return {
      id: note.id,
      kind: 'note',
      label: note.title,
      color: topic?.color ?? 'gray',
      radius: Number(
        scale(nodeDegree, minDegree, maxDegree, NOTE_RADIUS_MIN, NOTE_RADIUS_MAX).toFixed(1),
      ),
      pinned: layout?.pinned ?? false,
      lowConfidence: confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD,
      confidence,
      updatedAt: note.updatedAt,
      topicId: assignment?.topicId,
      degree: nodeDegree,
    };
  });

  return { nodes: [...topicNodes, ...noteNodes], edges };
}

/**
 * Derive nodes and edges from notes, topics, and assignments.
 * Referentially memoized: the same input arrays return the same object.
 */
export function buildGraph(input: BuildGraphInput): GraphData {
  const layouts = input.layouts ?? EMPTY_LAYOUTS;
  const similarities = input.similarities ?? EMPTY_EDGES;
  if (
    cache &&
    cache.notes === input.notes &&
    cache.topics === input.topics &&
    cache.assignments === input.assignments &&
    cache.layouts === layouts &&
    cache.similarities === similarities
  ) {
    return cache.result;
  }
  const result = computeGraph(input, layouts, similarities);
  cache = {
    notes: input.notes,
    topics: input.topics,
    assignments: input.assignments,
    layouts,
    similarities,
    result,
  };
  return result;
}
