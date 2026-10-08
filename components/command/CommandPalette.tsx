'use client';

import { useEffect, useRef } from 'react';
import { searchAtlas, type SearchHit } from '@/lib/search';
import { useAtlasStore } from '@/lib/store';

export function CommandPalette({
  open,
  query,
  onQuery,
  onClose,
  onChoose,
}: {
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onClose: () => void;
  onChoose: (hit: SearchHit) => void;
}) {
  const notes = useAtlasStore((state) => state.notes);
  const topics = useAtlasStore((state) => state.topics);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = searchAtlas(query, notes, topics);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label="Search"
        className="w-full max-w-lg overflow-hidden rounded-md border border-border bg-elevated shadow-sm"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Notes, topics, people, tags"
          className="h-11 w-full bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-muted"
        />
        <ul className="max-h-80 overflow-y-auto border-t border-border">
          {hits.length === 0 ? (
            <li className="px-3 py-3 text-[13px] text-muted">Type to search the workspace.</li>
          ) : (
            hits.map((hit) => (
              <li key={`${hit.kind}:${hit.label}`}>
                <button
                  type="button"
                  onClick={() => onChoose(hit)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface"
                >
                  <span className="truncate text-[13px] text-foreground">{hit.label}</span>
                  <span className="shrink-0 text-[11px] text-muted capitalize">{hit.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
