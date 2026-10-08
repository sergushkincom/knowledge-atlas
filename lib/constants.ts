/** Assignments below this are "needs review" in the suggestions inbox. */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Reason stored when a person drags a note onto a topic. */
export const USER_MOVE_REASON = 'Moved by you';

/**
 * Tag and person edges are only drawn when that value is shared by a small
 * group. Very common values ("meeting", "Maria") would turn into hairballs.
 */
export const SHARED_ATTRIBUTE_MIN = 2;
export const SHARED_ATTRIBUTE_MAX = 6;

export const NOTE_RADIUS_MIN = 4;
export const NOTE_RADIUS_MAX = 10;
export const TOPIC_RADIUS_MIN = 18;
export const TOPIC_RADIUS_MAX = 28;

export const ATLAS_STORAGE_KEY = 'knowledge-atlas';
export const ATLAS_STORAGE_VERSION = 1;
