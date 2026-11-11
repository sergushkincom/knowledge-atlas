import { describe, expect, it } from 'vitest';
import { searchAtlas, type SearchHit } from '@/lib/search';
import type { Note, Topic } from '@/lib/types';

const ISO = '2026-01-01T00:00:00.000Z';

function note(overrides: Partial<Note> & Pick<Note, 'id' | 'title'>): Note {
  return {
    source: 'docs',
    createdAt: ISO,
    updatedAt: ISO,
    excerpt: '',
    content: '',
    people: [],
    tags: [],
    links: [],
    notionUrl: 'https://example.com/note',
    ...overrides,
  };
}

function topic(overrides: Partial<Topic> & Pick<Topic, 'id' | 'name'>): Topic {
  return {
    description: '',
    color: 'blue',
    parentId: null,
    origin: 'ai',
    ...overrides,
  };
}

function hit(partial: SearchHit): SearchHit {
  return partial;
}

describe('searchAtlas', () => {
  const graph = note({ id: 'graph', title: 'Graph' });

  it('returns nothing for an empty or whitespace query', () => {
    const notes = [graph];
    const topics = [topic({ id: 't', name: 'Graph' })];
    expect(searchAtlas('', notes, topics)).toEqual([]);
    expect(searchAtlas('   ', notes, topics)).toEqual([]);
    expect(searchAtlas('\n\t ', notes, topics)).toEqual([]);
  });

  it('returns nothing when the corpus is empty or nothing matches', () => {
    expect(searchAtlas('graph', [], [])).toEqual([]);
    expect(searchAtlas('zzz', [note({ id: 'n', title: 'Hello' })], [topic({ id: 't', name: 'Other' })])).toEqual([]);
  });

  it('matches case-insensitively and trims surrounding whitespace', () => {
    expect(searchAtlas('  GRAPH  ', [], [topic({ id: 't', name: 'Graph' })])).toEqual([
      hit({ id: 't', kind: 'topic', label: 'Graph', hint: 'Topic', score: 115 }),
    ]);
  });

  it('folds accented case and still treats accents as significant', () => {
    const eclair = topic({ id: 'e', name: 'Éclair' });
    const cafe = topic({ id: 'c', name: 'Café' });
    const cafeNotes = topic({ id: 'notes', name: 'Café notes' });
    const topics = [eclair, cafe, cafeNotes];
    expect(searchAtlas('ÉCLAIR', [], topics)).toEqual([
      hit({ id: 'e', kind: 'topic', label: 'Éclair', hint: 'Topic', score: 114 }),
    ]);
    expect(searchAtlas('café', [], topics)).toEqual([
      hit({ id: 'c', kind: 'topic', label: 'Café', hint: 'Topic', score: 116 }),
      hit({ id: 'notes', kind: 'topic', label: 'Café notes', hint: 'Topic', score: 110 }),
    ]);
    expect(searchAtlas('eclair', [], topics)).toEqual([]);
    expect(searchAtlas('cafe', [], [cafe])).toEqual([]);
    expect(searchAtlas('cafe', [], topics)).toEqual([
      hit({ id: 'notes', kind: 'topic', label: 'Café notes', hint: 'Topic', score: 36 }),
    ]);
  });

  it('ranks a short prefix above a longer prefix, then an earlier substring, then a subsequence', () => {
    const hits = searchAtlas('or', [
      note({ id: 'sub-late', title: 'xxOrbit' }),
      note({ id: 'fuzzy', title: 'o r bit' }),
      note({ id: 'sub-early', title: 'xOrbit' }),
    ], [
      topic({ id: 'long', name: 'Orbit' }),
      topic({ id: 'short', name: 'Or' }),
    ]);
    expect(hits).toEqual([
      hit({ id: 'short', kind: 'topic', label: 'Or', hint: 'Topic', score: 118 }),
      hit({ id: 'long', kind: 'topic', label: 'Orbit', hint: 'Topic', score: 115 }),
      hit({ id: 'sub-early', kind: 'note', label: 'xOrbit', hint: 'Docs', score: 89 }),
      hit({ id: 'sub-late', kind: 'note', label: 'xxOrbit', hint: 'Docs', score: 88 }),
      hit({ id: 'fuzzy', kind: 'note', label: 'o r bit', hint: 'Docs', score: 36 }),
    ]);
  });

  it('ranks an early substring above a prefixed label of length 40 or more', () => {
    const longName = `Graph${'x'.repeat(35)}`;
    expect(longName).toHaveLength(40);
    expect(searchAtlas('graph', [
      note({ id: 'mid', title: 'xGraph' }),
    ], [
      topic({ id: 'long', name: longName }),
    ])).toEqual([
      hit({ id: 'mid', kind: 'note', label: 'xGraph', hint: 'Docs', score: 89 }),
      hit({ id: 'long', kind: 'topic', label: longName, hint: 'Topic', score: 80 }),
    ]);
  });

  it('caps the prefix length penalty at 40 and breaks ties with localeCompare', () => {
    const first = `Graph${'a'.repeat(35)}`;
    const second = `Graph${'b'.repeat(55)}`;
    expect(searchAtlas('graph', [], [
      topic({ id: 'b', name: second }),
      topic({ id: 'a', name: first }),
    ])).toEqual([
      hit({ id: 'a', kind: 'topic', label: first, hint: 'Topic', score: 80 }),
      hit({ id: 'b', kind: 'topic', label: second, hint: 'Topic', score: 80 }),
    ]);
  });

  it('keeps a literal match past index 89, floored at score 1', () => {
    const hits = searchAtlas('ab', [
      note({ id: 'late', title: `${'q'.repeat(200)}ab` }),
      note({ id: 'fuzzy', title: 'a b' }),
      note({ id: 'edge', title: `${'q'.repeat(89)}ab` }),
      note({ id: 'above', title: `${'q'.repeat(88)}ab` }),
    ], []);
    expect(hits.map((item) => [item.id, item.score])).toEqual([
      ['fuzzy', 36],
      ['above', 2],
      ['edge', 1],
      ['late', 1],
    ]);
  });

  it('scores people with a bonus, tags without, and fills the note hint', () => {
    const hits = searchAtlas('ida', [
      note({ id: 'with-people', title: 'Notes', people: ['Sam', 'Ida'], source: 'docs' }),
      note({
        id: 'source-only',
        title: 'Identity',
        people: [],
        tags: ['Ida'],
        source: 'meeting-notes',
      }),
    ], []);
    expect(hits).toEqual([
      hit({ id: 'with-people', kind: 'person', label: 'Ida', hint: 'Person', score: 121 }),
      hit({ id: 'source-only', kind: 'tag', label: 'Ida', hint: 'Tag', score: 117 }),
      hit({ id: 'source-only', kind: 'note', label: 'Identity', hint: 'Meeting notes', score: 117 }),
      hit({ id: 'with-people', kind: 'note', label: 'Notes', hint: 'Sam', score: 117 }),
    ]);
  });

  it('ignores note bodies, excerpts, links, and topic descriptions', () => {
    expect(searchAtlas('zephyr', [
      note({
        id: 'n',
        title: 'Plain',
        excerpt: 'zephyr',
        content: 'zephyr lives here',
        links: ['zephyr'],
      }),
    ], [
      topic({ id: 't', name: 'Other', description: 'zephyr' }),
    ])).toEqual([]);
  });

  it('dedupes people and tags case-insensitively and keeps the first spelling', () => {
    expect(searchAtlas('ida', [
      note({ id: 'skip', title: 'Hello', people: ['Sam'] }),
      note({ id: 'first', title: 'Alpha', people: ['IDA'] }),
      note({ id: 'second', title: 'Beta', people: ['Ida'] }),
    ], [])).toEqual([
      hit({ id: 'first', kind: 'person', label: 'IDA', hint: 'Person', score: 121 }),
      hit({ id: 'first', kind: 'note', label: 'Alpha', hint: 'IDA', score: 117 }),
      hit({ id: 'second', kind: 'note', label: 'Beta', hint: 'Ida', score: 117 }),
    ]);

    expect(searchAtlas('meeting', [
      note({ id: 'first', title: 'First', tags: ['MEETING'] }),
      note({ id: 'second', title: 'Second', tags: ['meeting'] }),
    ], [])).toEqual([
      hit({ id: 'first', kind: 'note', label: 'First', hint: 'Docs', score: 113 }),
      hit({ id: 'first', kind: 'tag', label: 'MEETING', hint: 'Tag', score: 113 }),
      hit({ id: 'second', kind: 'note', label: 'Second', hint: 'Docs', score: 113 }),
    ]);
  });

  it('keeps the higher-scoring note when labels collide and still returns other kinds', () => {
    expect(searchAtlas('g', [
      note({ id: 'plain', title: 'Graph' }),
      note({ id: 'boosted', title: 'Graph', people: ['G'] }),
    ], [])).toEqual([
      hit({ id: 'boosted', kind: 'person', label: 'G', hint: 'Person', score: 123 }),
      hit({ id: 'boosted', kind: 'note', label: 'Graph', hint: 'G', score: 119 }),
    ]);

    expect(searchAtlas('graph', [
      note({ id: 'n', title: 'Graph', people: ['Graph'], tags: ['Graph'] }),
    ], [
      topic({ id: 't', name: 'Graph' }),
    ])).toEqual([
      hit({ id: 'n', kind: 'person', label: 'Graph', hint: 'Person', score: 119 }),
      hit({ id: 't', kind: 'topic', label: 'Graph', hint: 'Topic', score: 115 }),
      hit({ id: 'n', kind: 'note', label: 'Graph', hint: 'Graph', score: 115 }),
      hit({ id: 'n', kind: 'tag', label: 'Graph', hint: 'Tag', score: 115 }),
    ]);
  });

  it('returns at most 12 hits, preferring score and then label', () => {
    const topics = Array.from({ length: 13 }, (_, index) => topic({
      id: `t${index}`,
      name: `M${String(index).padStart(2, '0')}`,
    }));
    const hits = searchAtlas('m', [note({ id: 'short', title: 'M' })], topics);
    const expectedNames = topics
      .map((item) => item.name)
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 11);
    expect(hits).toHaveLength(12);
    expect(hits[0]).toEqual(hit({ id: 'short', kind: 'note', label: 'M', hint: 'Docs', score: 119 }));
    expect(hits.slice(1).map((item) => item.label)).toEqual(expectedNames);
    expect(hits.slice(1).every((item) => item.kind === 'topic' && item.score === 117)).toBe(true);
  });

  it('does not let a duplicate label consume a second slot in the top 12', () => {
    const topics = Array.from({ length: 12 }, (_, index) => topic({
      id: `t${index}`,
      name: `Aa${String.fromCharCode(97 + index)}`,
    }));
    const hits = searchAtlas('aa', [
      note({ id: 'high', title: 'Aa' }),
      note({ id: 'low', title: 'Aa' }),
    ], topics);
    expect(hits).toHaveLength(12);
    expect(hits[0]).toEqual(hit({ id: 'high', kind: 'note', label: 'Aa', hint: 'Docs', score: 118 }));
    expect(hits.filter((item) => item.kind === 'note')).toHaveLength(1);
    expect(hits.slice(1).map((item) => item.label)).toEqual(
      Array.from({ length: 11 }, (_, index) => `Aa${String.fromCharCode(97 + index)}`),
    );
  });

  it('treats internal whitespace as significant', () => {
    const notes = [note({ id: 'gap', title: 'graph  theory' })];
    const topics = [topic({ id: 'exact', name: 'Graph theory' })];
    expect(searchAtlas('graph theory', notes, topics)).toEqual([
      hit({ id: 'exact', kind: 'topic', label: 'Graph theory', hint: 'Topic', score: 108 }),
      hit({ id: 'gap', kind: 'note', label: 'graph  theory', hint: 'Docs', score: 36 }),
    ]);
    expect(searchAtlas('graph  theory', notes, topics)).toEqual([
      hit({ id: 'gap', kind: 'note', label: 'graph  theory', hint: 'Docs', score: 107 }),
    ]);
  });

  it('matches punctuation literally', () => {
    expect(searchAtlas('c++', [], [topic({ id: 't', name: 'C++ notes' })])).toEqual([
      hit({ id: 't', kind: 'topic', label: 'C++ notes', hint: 'Topic', score: 111 }),
    ]);
    expect(searchAtlas('.', [note({ id: 'n', title: 'note.md' })], [])).toEqual([
      hit({ id: 'n', kind: 'note', label: 'note.md', hint: 'Docs', score: 86 }),
    ]);
  });
});
