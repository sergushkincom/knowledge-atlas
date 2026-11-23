/**
 * Notes that land in Unsorted fade in one after another. A long file still
 * finishes in a short window, so a big drop does not take a minute.
 * prefers-reduced-motion shows every note at once.
 */

export const ARRIVAL_STAGGER_MS = 260;
export const ARRIVAL_FADE_MS = 340;
/** Upper bound on the time from the first note to the last note starting. */
export const ARRIVAL_STAGGER_WINDOW_MS = 2200;

export interface UnsortedArrival {
  /** Note ids that landed in Unsorted, in file order. */
  ids: string[];
  /** `performance.now()` when the file finished loading. */
  startedAt: number;
  /** True while the fade should play. False afterwards, so a later visit stays still. */
  animate: boolean;
}

export function unsortedArrivalIds(
  notes: readonly { id: string }[],
  assignments: readonly { noteId: string; topicId: string }[],
  inboxId: string | undefined,
): string[] {
  if (!inboxId) {
    return [];
  }
  const topicOf = new Map(assignments.map((item) => [item.noteId, item.topicId]));
  return notes.filter((note) => topicOf.get(note.id) === inboxId).map((note) => note.id);
}

/** Gap before each next note. Large files share one short window. */
export function arrivalStaggerMs(count: number): number {
  if (count <= 1) {
    return 0;
  }
  return Math.min(ARRIVAL_STAGGER_MS, ARRIVAL_STAGGER_WINDOW_MS / (count - 1));
}

export function arrivalWindowMs(count: number): number {
  if (count <= 0) {
    return 0;
  }
  return (count - 1) * arrivalStaggerMs(count) + ARRIVAL_FADE_MS;
}

/** 0 before the note's turn, then an ease-out to 1. Reduced motion is always 1. */
export function arrivalOpacity(
  index: number,
  count: number,
  elapsedMs: number,
  reduced: boolean,
): number {
  if (reduced || count <= 0 || index < 0 || index >= count) {
    return 1;
  }
  const start = index * arrivalStaggerMs(count);
  const t = (elapsedMs - start) / ARRIVAL_FADE_MS;
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return 1 - (1 - t) * (1 - t);
}

/**
 * CSS delay for a row, measured from `now`. A delay already past the fade
 * holds the note at full opacity, so opening the list later does not replay it.
 */
export function noteArrivalStyle(
  index: number,
  count: number,
  elapsedMs: number,
): { animationDelay: string; animationDuration: string } | undefined {
  if (count <= 0 || index < 0 || index >= count) {
    return undefined;
  }
  const delay = index * arrivalStaggerMs(count) - elapsedMs;
  return {
    animationDelay: `${Math.round(delay)}ms`,
    animationDuration: `${ARRIVAL_FADE_MS}ms`,
  };
}
