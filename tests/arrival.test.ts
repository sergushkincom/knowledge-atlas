import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_FADE_MS,
  ARRIVAL_STAGGER_MS,
  ARRIVAL_STAGGER_WINDOW_MS,
  arrivalOpacity,
  arrivalStaggerMs,
  arrivalWindowMs,
  noteArrivalStyle,
  unsortedArrivalIds,
} from '@/lib/arrival';

describe('unsortedArrivalIds', () => {
  const notes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('keeps file order and only notes in Unsorted', () => {
    const ids = unsortedArrivalIds(
      notes,
      [
        { noteId: 'a', topicId: 'topic-inbox' },
        { noteId: 'b', topicId: 'topic-home' },
        { noteId: 'c', topicId: 'topic-inbox' },
      ],
      'topic-inbox',
    );
    expect(ids).toEqual(['a', 'c']);
  });

  it('is empty when there is no Unsorted topic', () => {
    expect(unsortedArrivalIds(notes, [], undefined)).toEqual([]);
  });
});

describe('arrival timing', () => {
  it('spaces a short list and compresses a long one into one window', () => {
    expect(arrivalStaggerMs(1)).toBe(0);
    expect(arrivalStaggerMs(8)).toBe(ARRIVAL_STAGGER_MS);
    const crowded = arrivalStaggerMs(80);
    expect(crowded).toBeLessThan(ARRIVAL_STAGGER_MS);
    expect((80 - 1) * crowded).toBeCloseTo(ARRIVAL_STAGGER_WINDOW_MS);
  });

  it('fades the first note immediately and holds the later ones', () => {
    expect(arrivalOpacity(0, 3, 0, false)).toBe(0);
    expect(arrivalOpacity(0, 3, ARRIVAL_FADE_MS / 2, false)).toBeCloseTo(0.75);
    expect(arrivalOpacity(0, 3, ARRIVAL_FADE_MS, false)).toBe(1);
    expect(arrivalOpacity(2, 3, 0, false)).toBe(0);
    expect(arrivalOpacity(2, 3, 2 * ARRIVAL_STAGGER_MS + ARRIVAL_FADE_MS, false)).toBe(1);
  });

  it('shows every note at once when motion is reduced', () => {
    expect(arrivalOpacity(4, 8, 0, true)).toBe(1);
    expect(arrivalOpacity(-1, 8, 0, false)).toBe(1);
    expect(arrivalWindowMs(0)).toBe(0);
    expect(arrivalWindowMs(8)).toBe(7 * ARRIVAL_STAGGER_MS + ARRIVAL_FADE_MS);
  });
});

describe('noteArrivalStyle', () => {
  it('delays each row, and a delay past the fade stays negative so it does not replay', () => {
    expect(noteArrivalStyle(1, 4, 0)).toEqual({
      animationDelay: `${ARRIVAL_STAGGER_MS}ms`,
      animationDuration: `${ARRIVAL_FADE_MS}ms`,
    });
    expect(noteArrivalStyle(-1, 4, 0)).toBeUndefined();
    expect(noteArrivalStyle(1, 4, ARRIVAL_STAGGER_MS + ARRIVAL_FADE_MS + 50)?.animationDelay).toBe(
      '-390ms',
    );
  });
});
