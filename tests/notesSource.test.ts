import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { topics as seedTopics } from '@/data/seedAssignments';
import { atlasFromLoaded, LOADED_NOTE_REASON } from '@/lib/loadNotes';
import {
  FileSource,
  NOTES_FILE_MAX_BYTES,
  NotesFileError,
  parseNotesFile,
} from '@/lib/sources/notesSource';
import { useAtlasStore } from '@/lib/store';
import type { Note, Topic } from '@/lib/types';

function note(id: string, links: string[] = []): Note {
  return {
    id,
    title: `Note ${id}`,
    source: 'docs',
    createdAt: '2026-03-12T12:00:00.000Z',
    updatedAt: '2026-03-12T12:00:00.000Z',
    excerpt: 'Short text.',
    content: 'Short text.',
    people: [],
    tags: [],
    links,
    notionUrl: `https://www.notion.so/test/${id}`,
  };
}

const ownTopics: Topic[] = [
  {
    id: 'topic-home',
    name: 'Home',
    description: '',
    color: 'green',
    parentId: null,
    origin: 'user',
  },
];

describe('parseNotesFile', () => {
  it('reads a plain array and an object with notes', () => {
    expect(parseNotesFile(JSON.stringify([note('a')])).notes).toHaveLength(1);
    expect(parseNotesFile(JSON.stringify({ notes: [note('a'), note('b')] })).notes).toHaveLength(2);
  });

  it('drops links to notes that are not in the file', () => {
    const loaded = parseNotesFile(JSON.stringify([note('a', ['b', 'missing', 'a']), note('b')]));
    expect(loaded.notes[0].links).toEqual(['b']);
  });

  it('explains what is wrong', () => {
    expect(() => parseNotesFile('not json')).toThrow('This is not a JSON file.');
    expect(() => parseNotesFile('[]')).toThrow('The file has no notes.');
    expect(() => parseNotesFile(JSON.stringify([note('a'), note('a')]))).toThrow(
      'Two notes share the id "a".',
    );
    const broken = { ...note('a'), source: 'email' };
    expect(() => parseNotesFile(JSON.stringify([broken]))).toThrow(NotesFileError);
    expect(() => parseNotesFile(JSON.stringify([broken]))).toThrow(/^notes\.0\.source/);
  });

  it('checks assignments against the notes and topics in the file', () => {
    const assignment = {
      noteId: 'a',
      topicId: 'topic-home',
      secondaryTopicIds: [],
      confidence: 0.9,
      reason: 'At home.',
      origin: 'user',
      locked: true,
    };
    expect(() =>
      parseNotesFile(JSON.stringify({ notes: [note('a')], assignments: [assignment] })),
    ).toThrow('The file has assignments but no topics.');
    expect(() =>
      parseNotesFile(
        JSON.stringify({
          notes: [note('a')],
          topics: ownTopics,
          assignments: [{ ...assignment, topicId: 'topic-nowhere' }],
        }),
      ),
    ).toThrow('Note "a" is assigned to unknown topic "topic-nowhere".');
  });

  it('accepts the sample file shipped in public/', () => {
    const text = readFileSync(join(process.cwd(), 'public/sample-notes.json'), 'utf8');
    expect(parseNotesFile(text).notes.length).toBeGreaterThan(0);
  });
});

describe('FileSource', () => {
  it('reads the file text', async () => {
    const file = { size: 10, text: async () => JSON.stringify([note('a')]) };
    await expect(new FileSource(file).load()).resolves.toMatchObject({ notes: [{ id: 'a' }] });
  });

  it('refuses files over the size limit', async () => {
    const file = { size: NOTES_FILE_MAX_BYTES + 1, text: async () => '[]' };
    await expect(new FileSource(file).load()).rejects.toThrow('larger than 2 MB');
  });
});

describe('atlasFromLoaded', () => {
  it('puts notes without an assignment in Unsorted with confidence 0', () => {
    const atlas = atlasFromLoaded({ notes: [note('a'), note('b')] }, seedTopics);
    const inbox = seedTopics.find((topic) => topic.isInbox);
    expect(atlas.topics).toEqual(seedTopics);
    expect(atlas.assignments).toHaveLength(2);
    for (const assignment of atlas.assignments) {
      expect(assignment).toMatchObject({
        topicId: inbox?.id,
        confidence: 0,
        reason: LOADED_NOTE_REASON,
        locked: false,
      });
    }
  });

  it('adds Unsorted when the file topics have none', () => {
    const atlas = atlasFromLoaded({ notes: [note('a')], topics: ownTopics }, seedTopics);
    expect(atlas.topics.map((topic) => topic.id)).toEqual(['topic-home', 'topic-inbox']);
    expect(atlas.assignments[0].topicId).toBe('topic-inbox');
  });
});

describe('store.loadNotes', () => {
  it('replaces the notes and Reset demo brings the demo back', () => {
    const demoCount = useAtlasStore.getState().notes.length;
    useAtlasStore.getState().loadNotes({ notes: [note('a'), note('b', ['a'])] });
    let state = useAtlasStore.getState();
    expect(state.notes.map((item) => item.id)).toEqual(['a', 'b']);
    expect(state.customNotes).toHaveLength(2);
    expect(state.assignments.map((item) => item.noteId)).toEqual(['a', 'b']);
    expect(state.layouts).toEqual([]);

    state.resetDemo();
    state = useAtlasStore.getState();
    expect(state.customNotes).toBeNull();
    expect(state.notes).toHaveLength(demoCount);
    expect(state.assignments).toHaveLength(demoCount);
  });
});
