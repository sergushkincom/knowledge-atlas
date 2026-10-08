'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { buildTopicTree, formatNoteDate, notesForTopic, SOURCE_LABELS } from '@/lib/selectors';
import { useAtlasStore } from '@/lib/store';
import { topicSwatch } from '@/lib/theme/palette';
import type { Note, NoteSource } from '@/lib/types';

const TOPIC_EMOJI: Record<string, string> = {
  'topic-meetings': '📅',
  'topic-one-on-ones': '👤',
  'topic-interviews': '🎯',
  'topic-design': '✏️',
  'topic-reading': '📚',
  'topic-health': '🏃',
  'topic-life': '🏠',
  'topic-german': '🇩🇪',
  'topic-inbox': '📥',
};

function matches(note: Note, query: string, sources: NoteSource[] | null): boolean {
  if (sources && !sources.includes(note.source)) {
    return false;
  }
  const text = query.trim().toLowerCase();
  if (!text) {
    return true;
  }
  return (
    note.title.toLowerCase().includes(text) ||
    note.people.some((person) => person.toLowerCase().includes(text)) ||
    note.tags.some((tag) => tag.toLowerCase().includes(text))
  );
}

export function CollectionViews({
  view,
  query,
  sources,
  selectedId,
  onSelect,
}: {
  view: 'list' | 'folder';
  query: string;
  sources: NoteSource[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const notes = useAtlasStore((state) => state.notes);
  const topics = useAtlasStore((state) => state.topics);
  const assignments = useAtlasStore((state) => state.assignments);
  const theme = useAtlasStore((state) => state.settings.theme);
  const [openTopicId, setOpenTopicId] = useState<string | null>('topic-meetings');
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  if (view === 'list') {
    const rows = notes
      .filter((note) => matches(note, query, sources))
      .map((note) => ({
        note,
        topicId: assignments.find((item) => item.noteId === note.id)?.topicId,
      }))
      .sort((left, right) => right.note.updatedAt.localeCompare(left.note.updatedAt));

    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 flex h-8 items-center gap-3 border-b border-border bg-background px-4 text-[12px] text-muted">
          <span className="min-w-0 flex-1">Name</span>
          <span className="w-40 shrink-0">Topic</span>
          <span className="w-28 shrink-0">Updated</span>
        </div>
        <ul>
          {rows.map(({ note, topicId }) => {
            const topic = topicId ? topicById.get(topicId) : undefined;
            const swatch = topic ? topicSwatch(topic.color, theme) : undefined;
            const selected = selectedId === note.id;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onSelect(note.id)}
                  className={`flex h-9 w-full items-center gap-3 px-4 text-left text-[14px] hover:bg-hover ${
                    selected ? 'bg-hover' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="mr-2" aria-hidden>
                      {note.icon ?? '📄'}
                    </span>
                    {note.title}
                  </span>
                  <span className="flex w-40 shrink-0 items-center gap-1.5 truncate text-[13px] text-muted">
                    {swatch ? (
                      <span className="size-2 shrink-0 rounded-full" style={{ background: swatch.node }} />
                    ) : null}
                    {topic?.name ?? 'Unsorted'}
                  </span>
                  <span className="w-28 shrink-0 text-[13px] text-muted">{formatNoteDate(note.updatedAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const tree = buildTopicTree(topics);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
      <ul>
        {tree.map(({ topic, depth }) => {
          const open = openTopicId === topic.id;
          const rows = notesForTopic(notes, assignments, topic.id).filter(({ note }) =>
            matches(note, query, sources),
          );
          return (
            <li key={topic.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenTopicId(open ? null : topic.id)}
                className="flex h-8 w-full items-center gap-1.5 rounded-md pr-2 text-left text-[14px] hover:bg-hover"
                style={{ paddingLeft: 8 + depth * 16 }}
              >
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`}
                />
                <span aria-hidden>{TOPIC_EMOJI[topic.id] ?? '📁'}</span>
                <span className="min-w-0 flex-1 truncate">{topic.name}</span>
                <span className="text-[12px] text-muted tabular-nums">{rows.length}</span>
              </button>
              {open ? (
                <ul className="mb-1">
                  {rows.map(({ note }) => (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(note.id)}
                        className={`flex h-8 w-full items-center gap-2 rounded-md pr-2 text-left text-[14px] hover:bg-hover ${
                          selectedId === note.id ? 'bg-hover' : ''
                        }`}
                        style={{ paddingLeft: 36 + depth * 16 }}
                      >
                        <span aria-hidden>{note.icon ?? '📄'}</span>
                        <span className="min-w-0 flex-1 truncate">{note.title}</span>
                        <span className="shrink-0 text-[12px] text-muted">{SOURCE_LABELS[note.source]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
