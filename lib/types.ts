import { z } from 'zod';

export const TOPIC_COLORS = [
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'teal',
] as const;

export const topicColorSchema = z.enum(TOPIC_COLORS);
export type TopicColor = z.infer<typeof topicColorSchema>;

export const noteSourceSchema = z.enum([
  'meeting-notes',
  'docs',
  'journal',
  'wiki',
  'tasks',
]);
export type NoteSource = z.infer<typeof noteSourceSchema>;

export const originSchema = z.enum(['ai', 'user']);
export type Origin = z.infer<typeof originSchema>;

export const noteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  icon: z.string().optional(),
  source: noteSourceSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  excerpt: z.string(),
  content: z.string(),
  people: z.array(z.string()),
  tags: z.array(z.string()),
  links: z.array(z.string()),
  notionUrl: z.url(),
});
export type Note = z.infer<typeof noteSchema>;

export const topicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  color: topicColorSchema,
  parentId: z.string().nullable(),
  origin: originSchema,
  isInbox: z.boolean().optional(),
});
export type Topic = z.infer<typeof topicSchema>;

export const assignmentSchema = z.object({
  noteId: z.string().min(1),
  topicId: z.string().min(1),
  secondaryTopicIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  origin: originSchema,
  locked: z.boolean(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const edgeKindSchema = z.enum([
  'belongs',
  'link',
  'similar',
  'tag',
  'person',
]);
export type EdgeKind = z.infer<typeof edgeKindSchema>;

export const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: edgeKindSchema,
  weight: z.number().optional(),
});
export type Edge = z.infer<typeof edgeSchema>;

export const nodeLayoutSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  pinned: z.boolean(),
});
export type NodeLayout = z.infer<typeof nodeLayoutSchema>;

export const layoutModeSchema = z.enum(['clustered', 'free', 'timeline']);
export type LayoutMode = z.infer<typeof layoutModeSchema>;

export const layerVisibilitySchema = z.object({
  topics: z.boolean(),
  links: z.boolean(),
  similarity: z.boolean(),
  tags: z.boolean(),
  people: z.boolean(),
});
export type LayerVisibility = z.infer<typeof layerVisibilitySchema>;

export const themeNameSchema = z.enum(['dark', 'light']);
export type ThemeName = z.infer<typeof themeNameSchema>;

export const settingsSchema = z.object({
  theme: themeNameSchema,
  layers: layerVisibilitySchema,
  layoutMode: layoutModeSchema,
  confidenceThreshold: z.number().min(0).max(1),
  onlyManualChanges: z.boolean(),
  hasSeenOnboarding: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const atlasDataSchema = z.object({
  notes: z.array(noteSchema),
  topics: z.array(topicSchema),
  assignments: z.array(assignmentSchema),
  layouts: z.array(nodeLayoutSchema),
  settings: settingsSchema,
});
export type AtlasData = z.infer<typeof atlasDataSchema>;

export const defaultSettings: Settings = {
  theme: 'dark',
  layers: {
    topics: true,
    links: true,
    similarity: false,
    tags: false,
    people: false,
  },
  layoutMode: 'clustered',
  confidenceThreshold: 0,
  onlyManualChanges: false,
  hasSeenOnboarding: false,
};
