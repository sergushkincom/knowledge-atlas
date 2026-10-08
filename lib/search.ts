import type { Note, Topic } from '@/lib/types';
import { SOURCE_LABELS } from '@/lib/selectors';

export type SearchKind = 'note' | 'topic' | 'person' | 'tag';

export interface SearchHit {
  id: string;
  kind: SearchKind;
  label: string;
  hint: string;
  score: number;
}

function scoreText(query: string, text: string): number {
  const haystack = text.toLowerCase();
  const index = haystack.indexOf(query);
  if (index === 0) {
    return 120 - Math.min(text.length, 40);
  }
  if (index > 0) {
    return 90 - index;
  }
  let cursor = 0;
  for (const char of haystack) {
    if (char === query[cursor]) {
      cursor += 1;
    }
    if (cursor === query.length) {
      return 36;
    }
  }
  return 0;
}

export function searchAtlas(query: string, notes: readonly Note[], topics: readonly Topic[]): SearchHit[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }
  const hits: SearchHit[] = [];
  const seenPeople = new Set<string>();
  const seenTags = new Set<string>();

  for (const topic of topics) {
    const score = scoreText(trimmed, topic.name);
    if (score > 0) {
      hits.push({ id: topic.id, kind: 'topic', label: topic.name, hint: 'Topic', score });
    }
  }

  for (const note of notes) {
    const titleScore = scoreText(trimmed, note.title);
    const peopleScore = Math.max(0, ...note.people.map((person) => scoreText(trimmed, person)));
    const tagScore = Math.max(0, ...note.tags.map((tag) => scoreText(trimmed, tag)));
    const best = Math.max(titleScore, peopleScore, tagScore);
    if (best > 0) {
      hits.push({
        id: note.id,
        kind: 'note',
        label: note.title,
        hint: note.people[0] ?? SOURCE_LABELS[note.source],
        score: best,
      });
    }
    for (const person of note.people) {
      const key = person.toLowerCase();
      if (seenPeople.has(key)) {
        continue;
      }
      const score = scoreText(trimmed, person);
      if (score > 0) {
        seenPeople.add(key);
        hits.push({ id: note.id, kind: 'person', label: person, hint: 'Person', score: score + 4 });
      }
    }
    for (const tag of note.tags) {
      const key = tag.toLowerCase();
      if (seenTags.has(key)) {
        continue;
      }
      const score = scoreText(trimmed, tag);
      if (score > 0) {
        seenTags.add(key);
        hits.push({ id: note.id, kind: 'tag', label: tag, hint: 'Tag', score });
      }
    }
  }

  hits.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  const unique: SearchHit[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    const key = `${hit.kind}:${hit.label.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(hit);
    if (unique.length === 12) {
      break;
    }
  }
  return unique;
}
