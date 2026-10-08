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
  renameTopic,
  unlockAssignment,
  unpinNode,
  type CreateTopicInput,
  type GraphState,
} from '@/lib/actions';
import { ATLAS_STORAGE_KEY, ATLAS_STORAGE_VERSION } from '@/lib/constants';
import type { AtlasData, LayerVisibility, Settings, ThemeName } from '@/lib/types';
import { defaultSettings } from '@/lib/types';

type HistorySlice = Pick<GraphState, 'topics' | 'assignments' | 'layouts'>;

export type AtlasStore = AtlasData & {
  moveNotes: (noteIds: string[], topicId: string) => void;
  addSecondaryTopic: (noteId: string, topicId: string) => void;
  createTopic: (input: CreateTopicInput) => string;
  mergeTopics: (sourceId: string, targetId: string) => void;
  nestTopic: (topicId: string, parentId: string | null) => void;
  renameTopic: (topicId: string, name: string) => void;
  deleteTopic: (topicId: string) => void;
  lockAssignment: (noteId: string) => void;
  unlockAssignment: (noteId: string) => void;
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

function createInitialState(): AtlasData {
  return {
    notes: structuredClone(notes),
    topics: structuredClone(topics),
    assignments: structuredClone(assignments),
    layouts: [],
    settings: structuredClone(defaultSettings),
  };
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
          resetDemo: () => {
            const fresh = createInitialState();
            set((state) => {
              state.topics = fresh.topics;
              state.assignments = fresh.assignments;
              state.layouts = fresh.layouts;
              state.settings = fresh.settings;
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
      }),
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
