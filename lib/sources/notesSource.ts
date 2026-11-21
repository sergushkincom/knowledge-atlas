import { z } from 'zod';
import { notes } from '@/data/seed';
import {
  assignmentSchema,
  noteSchema,
  topicSchema,
  type Assignment,
  type Note,
  type Topic,
} from '@/lib/types';

/** What a source hands to the store. Topics and assignments are optional. */
export interface LoadedNotes {
  notes: Note[];
  topics?: Topic[];
  assignments?: Assignment[];
}

/** Where the atlas gets its notes from. */
export interface NotesSource {
  load(): Promise<LoadedNotes>;
}

/** The demo source. Returns the bundled seed. No network, no API key. */
export class MockSource implements NotesSource {
  async load(): Promise<LoadedNotes> {
    return { notes };
  }
}

/** Largest notes file the browser will read, in bytes. */
export const NOTES_FILE_MAX_BYTES = 2 * 1024 * 1024;

export class NotesFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotesFileError';
  }
}

const notesFileSchema = z.object({
  notes: z.array(noteSchema),
  topics: z.array(topicSchema).optional(),
  assignments: z.array(assignmentSchema).optional(),
});

function describeIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'The file does not match the notes format.';
  }
  const path = issue.path.length > 0 ? issue.path.join('.') : 'file';
  return `${path}: ${issue.message}`;
}

function duplicate(ids: string[]): string | undefined {
  const seen = new Set<string>();
  return ids.find((id) => {
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
    return false;
  });
}

/**
 * Reads a JSON notes file: either an array of notes, or
 * `{ notes, topics?, assignments? }`. Every note must match `noteSchema`.
 * Links to notes that are not in the file are dropped. Throws NotesFileError
 * with a message a visitor can act on.
 */
export function parseNotesFile(text: string): LoadedNotes {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new NotesFileError('This is not a JSON file.');
  }

  // A plain array is read as the notes list, so error paths start at "notes".
  const parsed = notesFileSchema.safeParse(Array.isArray(raw) ? { notes: raw } : raw);
  if (!parsed.success) {
    throw new NotesFileError(describeIssue(parsed.error));
  }
  const data = parsed.data;

  if (data.notes.length === 0) {
    throw new NotesFileError('The file has no notes.');
  }
  const repeatedNote = duplicate(data.notes.map((note) => note.id));
  if (repeatedNote) {
    throw new NotesFileError(`Two notes share the id "${repeatedNote}".`);
  }

  const noteIds = new Set(data.notes.map((note) => note.id));
  const loadedNotes = data.notes.map((note) => ({
    ...note,
    links: note.links.filter((id) => id !== note.id && noteIds.has(id)),
  }));

  if (data.assignments && !data.topics) {
    throw new NotesFileError('The file has assignments but no topics.');
  }
  if (data.topics) {
    const repeatedTopic = duplicate(data.topics.map((topic) => topic.id));
    if (repeatedTopic) {
      throw new NotesFileError(`Two topics share the id "${repeatedTopic}".`);
    }
    const topicIds = new Set(data.topics.map((topic) => topic.id));
    const badParent = data.topics.find(
      (topic) => topic.parentId !== null && !topicIds.has(topic.parentId),
    );
    if (badParent) {
      throw new NotesFileError(
        `Topic "${badParent.id}" has an unknown parent "${badParent.parentId}".`,
      );
    }
    for (const assignment of data.assignments ?? []) {
      if (!noteIds.has(assignment.noteId)) {
        throw new NotesFileError(`Assignment for unknown note "${assignment.noteId}".`);
      }
      if (!topicIds.has(assignment.topicId)) {
        throw new NotesFileError(
          `Note "${assignment.noteId}" is assigned to unknown topic "${assignment.topicId}".`,
        );
      }
    }
    const repeatedAssignment = duplicate((data.assignments ?? []).map((item) => item.noteId));
    if (repeatedAssignment) {
      throw new NotesFileError(`Note "${repeatedAssignment}" has two assignments.`);
    }
  }

  return { notes: loadedNotes, topics: data.topics, assignments: data.assignments };
}

/** Loads notes from a file the visitor picked. Nothing leaves the browser. */
export class FileSource implements NotesSource {
  constructor(private readonly file: Pick<File, 'size' | 'text'>) {}

  async load(): Promise<LoadedNotes> {
    if (this.file.size > NOTES_FILE_MAX_BYTES) {
      throw new NotesFileError('The file is larger than 2 MB.');
    }
    return parseNotesFile(await this.file.text());
  }
}

/**
 * Stub for a later Notion connection.
 * TODO: read database IDs from env and fetch pages with @notionhq/client.
 * Notion OAuth and sync are out of scope for v1. Do not import the client yet.
 */
export class NotionApiSource implements NotesSource {
  async load(): Promise<LoadedNotes> {
    throw new Error('NotionApiSource is not implemented');
  }
}
