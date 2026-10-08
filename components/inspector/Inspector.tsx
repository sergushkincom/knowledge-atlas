'use client';

import { useState, type ReactNode } from 'react';
import { ExternalLink, Lock, LockOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { LOW_CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { formatNoteDate, notesForTopic, SOURCE_LABELS } from '@/lib/selectors';
import { topicSwatch } from '@/lib/theme/palette';
import { undoAtlas, useAtlasStore } from '@/lib/store';

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

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-start gap-2 py-1 text-[14px]">
      <div className="w-[120px] shrink-0 pt-0.5 text-muted">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Inspector({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const notes = useAtlasStore((state) => state.notes);
  const topics = useAtlasStore((state) => state.topics);
  const assignments = useAtlasStore((state) => state.assignments);
  const theme = useAtlasStore((state) => state.settings.theme);
  const moveNotes = useAtlasStore((state) => state.moveNotes);
  const lockAssignment = useAtlasStore((state) => state.lockAssignment);
  const unlockAssignment = useAtlasStore((state) => state.unlockAssignment);
  const [moving, setMoving] = useState(false);

  const note = notes.find((item) => item.id === selectedId);
  const topic = topics.find((item) => item.id === selectedId);
  const assignment = note ? assignments.find((item) => item.noteId === note.id) : undefined;

  if (!note && !topic) {
    return null;
  }

  if (topic) {
    const rows = notesForTopic(notes, assignments, topic.id);
    return (
      <aside className="flex h-full w-[420px] shrink-0 flex-col border-l border-border bg-background">
        <div className="flex h-11 items-center justify-end px-2">
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-12 pb-10">
          <div className="text-[56px] leading-none">{TOPIC_EMOJI[topic.id] ?? '📄'}</div>
          <h2 className="mt-3 text-[32px] leading-tight font-bold tracking-tight">{topic.name}</h2>
          <p className="mt-2 text-[15px] leading-6 text-muted">{topic.description}</p>
          <p className="mt-4 text-[14px] text-muted">{rows.length} notes</p>
          <ul className="mt-2">
            {rows.map(({ note: row }) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-[14px] hover:bg-hover"
                >
                  <span aria-hidden>{row.icon ?? '📄'}</span>
                  <span className="min-w-0 flex-1 truncate">{row.title}</span>
                  <span className="shrink-0 text-[12px] text-muted">{formatNoteDate(row.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

  if (!note || !assignment) {
    return null;
  }

  const primary = topics.find((item) => item.id === assignment.topicId);
  const swatch = primary ? topicSwatch(primary.color, theme) : topicSwatch('gray', theme);
  const percent = Math.round(assignment.confidence * 100);

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col border-l border-border bg-background">
      <div className="flex h-11 items-center justify-between px-3">
        <a href={note.notionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-muted hover:bg-hover hover:text-foreground">
          <ExternalLink size={13} /> Open in Notion
        </a>
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-12 pb-12">
        <div className="text-[56px] leading-none">{note.icon ?? '📄'}</div>
        <h2 className="mt-3 text-[32px] leading-tight font-bold tracking-tight">{note.title}</h2>

        <div className="mt-6">
          <Property label="Source">{SOURCE_LABELS[note.source]}</Property>
          <Property label="Topic">
            <button
              type="button"
              onClick={() => setMoving((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-hover"
            >
              <span className="size-2 rounded-full" style={{ background: swatch.node }} />
              {primary?.name ?? 'Unsorted'}
            </button>
            {moving ? (
              <ul className="mt-1 max-h-44 overflow-y-auto rounded-md border border-border bg-elevated py-1">
                {topics.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        moveNotes([note.id], item.id);
                        setMoving(false);
                        toast(`Moved ‘${note.title}’ to ${item.name}`, {
                          action: { label: 'Undo', onClick: () => undoAtlas() },
                        });
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1 text-left text-[14px] hover:bg-hover"
                    >
                      <span aria-hidden>{TOPIC_EMOJI[item.id] ?? '📄'}</span>
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Property>
          <Property label="Confidence">
            <div className="flex items-center gap-2 pt-1">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
              <span className={percent < LOW_CONFIDENCE_THRESHOLD * 100 ? 'text-foreground' : 'text-muted'}>
                {percent}%
              </span>
            </div>
            <p className="mt-1 text-[14px] leading-5 text-foreground">{assignment.reason}</p>
          </Property>
          <Property label="Lock">
            <button
              type="button"
              onClick={() => (assignment.locked ? unlockAssignment(note.id) : lockAssignment(note.id))}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-hover"
            >
              {assignment.locked ? <Lock size={13} /> : <LockOpen size={13} />}
              {assignment.locked ? 'Locked by you' : 'Unlocked'}
            </button>
          </Property>
          <Property label="People">{note.people.length > 0 ? note.people.join(', ') : 'Empty'}</Property>
          <Property label="Tags">{note.tags.length > 0 ? note.tags.join(', ') : 'Empty'}</Property>
          <Property label="Updated">{formatNoteDate(note.updatedAt)}</Property>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-[16px] leading-7">
          {note.content.split('\n').map((line, index) => (
            <p key={`${note.id}-${index}`}>{line}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}
