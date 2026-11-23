import { create, type StoreApi } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal, type TemporalState } from 'zundo';
import { assignments, topics } from '@/data/seedAssignments';
import { notes } from '@/data/seed';
import {
  addSecondaryTopic,
  createTopic,
  deleteTopic,
  lockAssignment,
  mergeTopics,
  moveNotes,
  nestTopic,
  pinNode,
  reclusterAssignments,
  renameTopic,
  unlockAssignment,
  unpinNode,
  type CreateTopicInput,
  type GraphState,
} from '@/lib/actions';
import { ATLAS_STORAGE_KEY, ATLAS_STORAGE_VERSION } from '@/lib/constants';
import { arrivalWindowMs, unsortedArrivalIds, type UnsortedArrival } from '@/lib/arrival';
import { atlasFromLoaded } from '@/lib/loadNotes';
import type { LoadedNotes } from '@/lib/sources/notesSource';
import type { AtlasData, LayerVisibility, Note, Settings, ThemeName } from '@/lib/types';
import { defaultSettings } from '@/lib/types';

type HistorySlice = Pick<GraphState, 'topics' | 'assignments' | 'layouts'>;

export type AtlasStore = AtlasData & {
  /** Notes loaded from a file, kept across reloads. null = the bundled demo notes. */
  customNotes: Note[] | null;
  /**
   * Notes from the latest file that landed in Unsorted, so the views can fade
   * them in one by one. Not saved. null after reset or when none landed there.
   */
  unsortedArrival: UnsortedArrival | null;
  /** Replaces the notes with ones from a file. Clears undo history. */
  loadNotes: (loaded: LoadedNotes) => void;
  moveNotes: (noteIds: string[], topicId: string) => void;
  addSecondaryTopic: (noteId: string, topicId: string) => void;
  createTopic: (input: CreateTopicInput) => string;
  mergeTopics: (sourceId: string, targetId: string) => void;
  nestTopic: (topicId: string, parentId: string | null) => void;
  renameTopic: (topicId: string, name: string) => void;
  deleteTopic: (topicId: string) => void;
  lockAssignment: (noteId: string) => void;
  unlockAssignment: (noteId: string) => void;
  recluster: () => void;
  pinNode: (id: string, x: number, y: number) => void;
  unpinNode: (id: string) => void;
  setTheme: (theme: ThemeName) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  resetDemo: () => void;
};

interface TemporalApi {
  temporal: StoreApi<TemporalState<HistorySlice>>;
}

function browserStorage(): StateStorage {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return localStorage;
}

function createInitialState(): AtlasData & { customNotes: Note[] | null } {
  return {
    customNotes: null,
    notes: structuredClone(notes),
    topics: structuredClone(topics),
    assignments: structuredClone(assignments),
    layouts: [],
    settings: structuredClone(defaultSettings),
  };
}

let arrivalTimer: number | undefined;

function clearArrivalTimer(): void {
  if (arrivalTimer !== undefined) {
    window.clearTimeout(arrivalTimer);
    arrivalTimer = undefined;
  }
}

function snapshot(state: AtlasStore): GraphState {
  return {
    notes: state.notes,
    topics: state.topics,
    assignments: state.assignments,
    layouts: state.layouts,
  };
}

function samePatch(current: AtlasStore, patch: Partial<HistorySlice>): boolean {
  return (
    (patch.topics === undefined || patch.topics === current.topics) &&
    (patch.assignments === undefined || patch.assignments === current.assignments) &&
    (patch.layouts === undefined || patch.layouts === current.layouts)
  );
}

export const useAtlasStore = create<AtlasStore>()(
  persist(
    temporal(
      immer((set, get, api) => {
        const commit = (patch: Partial<HistorySlice>) => {
          if (samePatch(get(), patch)) {
            return;
          }
          set((state) => {
            if (patch.topics) {
              state.topics = patch.topics;
            }
            if (patch.assignments) {
              state.assignments = patch.assignments;
            }
            if (patch.layouts) {
              state.layouts = patch.layouts;
            }
          });
        };

        return {
          ...createInitialState(),
          unsortedArrival: null,
          moveNotes: (noteIds, topicId) => {
            commit(moveNotes(snapshot(get()), noteIds, topicId));
          },
          addSecondaryTopic: (noteId, topicId) => {
            commit(addSecondaryTopic(snapshot(get()), noteId, topicId));
          },
          createTopic: (input) => {
            const next = createTopic(snapshot(get()), input);
            commit(next);
            return next.topicId;
          },
          mergeTopics: (sourceId, targetId) => {
            commit(mergeTopics(snapshot(get()), sourceId, targetId));
          },
          nestTopic: (topicId, parentId) => {
            commit(nestTopic(snapshot(get()), topicId, parentId));
          },
          renameTopic: (topicId, name) => {
            commit(renameTopic(snapshot(get()), topicId, name));
          },
          deleteTopic: (topicId) => {
            commit(deleteTopic(snapshot(get()), topicId));
          },
          lockAssignment: (noteId) => {
            commit(lockAssignment(snapshot(get()), noteId));
          },
          unlockAssignment: (noteId) => {
            commit(unlockAssignment(snapshot(get()), noteId));
          },
          recluster: () => {
            commit(reclusterAssignments(snapshot(get())));
          },
          pinNode: (id, x, y) => {
            commit(pinNode(snapshot(get()), id, x, y));
          },
          unpinNode: (id) => {
            commit(unpinNode(snapshot(get()), id));
          },
          setTheme: (theme) => {
            set((state) => {
              state.settings.theme = theme;
            });
          },
          toggleLayer: (layer) => {
            set((state) => {
              state.settings.layers[layer] = !state.settings.layers[layer];
            });
          },
          loadNotes: (loaded) => {
            const next = atlasFromLoaded(loaded, get().topics);
            const inboxId = next.topics.find((topic) => topic.isInbox)?.id;
            const ids = unsortedArrivalIds(next.notes, next.assignments, inboxId);
            const startedAt = performance.now();
            clearArrivalTimer();
            set((state) => {
              state.notes = next.notes;
              state.customNotes = next.notes;
              state.topics = next.topics;
              state.assignments = next.assignments;
              state.layouts = [];
              state.unsortedArrival = ids.length > 0 ? { ids, startedAt, animate: true } : null;
            });
            (api as unknown as TemporalApi).temporal.getState().clear();
            if (ids.length > 0 && typeof window !== 'undefined') {
              arrivalTimer = window.setTimeout(() => {
                arrivalTimer = undefined;
                set((state) => {
                  if (state.unsortedArrival?.startedAt === startedAt) {
                    state.unsortedArrival.animate = false;
                  }
                });
              }, arrivalWindowMs(ids.length));
            }
          },
          resetDemo: () => {
            const fresh = createInitialState();
            clearArrivalTimer();
            set((state) => {
              state.notes = fresh.notes;
              state.customNotes = null;
              state.topics = fresh.topics;
              state.assignments = fresh.assignments;
              state.layouts = fresh.layouts;
              state.settings = fresh.settings;
              state.unsortedArrival = null;
            });
            (api as unknown as TemporalApi).temporal.getState().clear();
          },
        };
      }),
      {
        limit: 100,
        partialize: (state) => ({
          topics: state.topics,
          assignments: state.assignments,
          layouts: state.layouts,
        }),
        equality: (past, current) =>
          past.topics === current.topics &&
          past.assignments === current.assignments &&
          past.layouts === current.layouts,
      },
    ),
    {
      name: ATLAS_STORAGE_KEY,
      version: ATLAS_STORAGE_VERSION,
      storage: createJSONStorage(browserStorage),
      partialize: (state) => ({
        topics: state.topics,
        assignments: state.assignments,
        layouts: state.layouts,
        settings: state.settings,
        customNotes: state.customNotes,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AtlasStore>;
        const customNotes = saved.customNotes ?? null;
        return {
          ...current,
          ...saved,
          customNotes,
          notes: customNotes ?? current.notes,
        };
      },
    },
  ),
);

function temporalApi(): TemporalState<HistorySlice> {
  return (useAtlasStore as unknown as TemporalApi).temporal.getState();
}

export function undoAtlas(): void {
  temporalApi().undo();
}

export function redoAtlas(): void {
  temporalApi().redo();
}

export function atlasSettings(): Settings {
  return useAtlasStore.getState().settings;
}
