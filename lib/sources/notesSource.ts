import { notes } from '@/data/seed';
import type { Note } from '@/lib/types';

export interface NotesSource {
  load(): Promise<{ notes: Note[] }>;
}

/** The demo source. Returns the bundled seed. No network, no API key. */
export class MockSource implements NotesSource {
  async load(): Promise<{ notes: Note[] }> {
    return { notes };
  }
}

/**
 * Stub for a later Notion connection.
 * TODO: read database IDs from env and fetch pages with @notionhq/client.
 * Notion OAuth and sync are out of scope for v1. Do not import the client yet.
 */
export class NotionApiSource implements NotesSource {
  async load(): Promise<{ notes: Note[] }> {
    throw new Error('NotionApiSource is not implemented');
  }
}
