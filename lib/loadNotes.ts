import type { LoadedNotes } from '@/lib/sources/notesSource';
import { NotesFileError } from '@/lib/sources/notesSource';
import type { Assignment, Note, Topic } from '@/lib/types';

/** Reason shown for a note that came from a file without an assignment. */
export const LOADED_NOTE_REASON = 'Loaded from your file. Not sorted yet.';

const UNSORTED_TOPIC: Topic = {
  id: 'topic-inbox',
  name: 'Unsorted',
  description: 'Notes without a reliable home. A person can drag them out.',
  color: 'gray',
  parentId: null,
  origin: 'ai',
  isInbox: true,
};

export interface LoadedAtlas {
  notes: Note[];
  topics: Topic[];
  assignments: Assignment[];
}

/**
 * Turns loaded notes into atlas data. Topics come from the file, or the
 * current topics are kept. A note without an assignment goes to Unsorted with
 * confidence 0, so it shows up as "needs review" instead of looking sorted.
 */
export function atlasFromLoaded(loaded: LoadedNotes, currentTopics: Topic[]): LoadedAtlas {
  const topics = structuredClone(loaded.topics ?? currentTopics);
  let inbox = topics.find((topic) => topic.isInbox);
  if (!inbox) {
    if (topics.some((topic) => topic.id === UNSORTED_TOPIC.id)) {
      throw new NotesFileError(
        `Topic id "${UNSORTED_TOPIC.id}" is reserved for Unsorted. Add "isInbox": true to it or rename it.`,
      );
    }
    inbox = { ...UNSORTED_TOPIC };
    topics.push(inbox);
  }

  const topicIds = new Set(topics.map((topic) => topic.id));
  const given = new Map((loaded.assignments ?? []).map((item) => [item.noteId, item]));
  const assignments = loaded.notes.map((note): Assignment => {
    const assignment = given.get(note.id);
    if (assignment) {
      return {
        ...assignment,
        secondaryTopicIds: assignment.secondaryTopicIds.filter(
          (id) => id !== assignment.topicId && topicIds.has(id),
        ),
      };
    }
    return {
      noteId: note.id,
      topicId: inbox.id,
      secondaryTopicIds: [],
      confidence: 0,
      reason: LOADED_NOTE_REASON,
      origin: 'ai',
      locked: false,
    };
  });

  return { notes: structuredClone(loaded.notes), topics, assignments };
}
