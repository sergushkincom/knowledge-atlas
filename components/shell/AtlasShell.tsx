'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Folder, List, MoreHorizontal, Network, Redo2, Search, Star, Undo2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { CommandPalette } from '@/components/command/CommandPalette';
import { Legend } from '@/components/graph/Legend';
import type { GraphCanvasHandle } from '@/components/graph/GraphCanvas';
import { Inspector } from '@/components/inspector/Inspector';
import { ThemeSync } from '@/components/theme/ThemeSync';
import { CollectionViews } from '@/components/views/CollectionViews';
import type { SearchHit } from '@/lib/search';
import { SOURCE_LABELS } from '@/lib/selectors';
import { redoAtlas, undoAtlas, useAtlasStore } from '@/lib/store';
import type { LayerVisibility, NoteSource } from '@/lib/types';

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-[14px] text-muted">Arranging notes…</div>
    ),
  },
);

const LAYERS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'topics', label: 'Topics' },
  { key: 'links', label: 'Links' },
  { key: 'similarity', label: 'Similarity' },
  { key: 'tags', label: 'Tags' },
  { key: 'people', label: 'People' },
];

const VIEWS = [
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'list', label: 'List', icon: List },
  { id: 'folder', label: 'Folder', icon: Folder },
] as const;

type AtlasView = (typeof VIEWS)[number]['id'];

const SOURCES = Object.keys(SOURCE_LABELS) as NoteSource[];

export function AtlasShell() {
  const notes = useAtlasStore((state) => state.notes);
  const topics = useAtlasStore((state) => state.topics);
  const layers = useAtlasStore((state) => state.settings.layers);
  const theme = useAtlasStore((state) => state.settings.theme);
  const toggleLayer = useAtlasStore((state) => state.toggleLayer);
  const moveNotes = useAtlasStore((state) => state.moveNotes);
  const mergeTopics = useAtlasStore((state) => state.mergeTopics);
  const pinNode = useAtlasStore((state) => state.pinNode);
  const unpinNode = useAtlasStore((state) => state.unpinNode);
  const resetDemo = useAtlasStore((state) => state.resetDemo);

  const graphRef = useRef<GraphCanvasHandle>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sources, setSources] = useState<NoteSource[] | null>(null);
  const [live, setLive] = useState('');
  const [view, setView] = useState<AtlasView>('graph');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redoAtlas();
          setLive('Redid the last change');
        } else {
          undoAtlas();
          setLive('Undid the last change');
        }
        return;
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMenuOpen(false);
        setSelectedId(null);
      }
      if (!typing && event.key === '0') {
        graphRef.current?.fit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function announceMove(noteId: string, topicId: string) {
    const title = notes.find((note) => note.id === noteId)?.title ?? 'Note';
    const topicName = topics.find((topic) => topic.id === topicId)?.name ?? 'topic';
    const message = `Moved ‘${title}’ to ${topicName}`;
    setLive(message);
    toast(message, { action: { label: 'Undo', onClick: () => undoAtlas() } });
  }

  function handleMoved(noteId: string, topicId: string) {
    moveNotes([noteId], topicId);
    announceMove(noteId, topicId);
    setSelectedId(noteId);
  }

  function handleMerged(sourceId: string, targetId: string) {
    const sourceName = topics.find((topic) => topic.id === sourceId)?.name ?? 'Topic';
    const targetName = topics.find((topic) => topic.id === targetId)?.name ?? 'topic';
    mergeTopics(sourceId, targetId);
    const message = `Merged ‘${sourceName}’ into ${targetName}`;
    setLive(message);
    toast(message, { action: { label: 'Undo', onClick: () => undoAtlas() } });
    setSelectedId(targetId);
  }

  function choose(hit: SearchHit) {
    setPaletteOpen(false);
    setSelectedId(hit.id);
    if (hit.kind === 'person' || hit.kind === 'tag') {
      setQuery(hit.label);
    } else {
      setQuery('');
    }
    graphRef.current?.focus(hit.id);
  }

  function toggleSource(source: NoteSource) {
    setSources((current) => {
      const all: NoteSource[] = ['meeting-notes', 'docs', 'journal', 'wiki', 'tasks'];
      const active = current ?? all;
      const next = active.includes(source)
        ? active.filter((item) => item !== source)
        : [...active, source];
      return next.length === all.length ? null : next;
    });
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <ThemeSync />
      <Toaster
        theme={theme}
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--elevated)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            fontSize: '14px',
          },
        }}
      />
      <div className="sr-only" aria-live="polite">{live}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-11 shrink-0 items-center gap-2 px-3 text-[14px]">
          <span className="text-muted">Knowledge</span>
          <span className="text-muted">/</span>
          <span>📄</span>
          <span className="truncate">Notes</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-[13px] text-muted sm:inline">Edited just now</span>
            <button
              type="button"
              onClick={() => toast('This demo stays in your browser.')}
              className="mr-1 h-7 rounded-md bg-accent px-3 text-[14px] font-medium text-white"
            >
              Share
            </button>
            <button type="button" aria-label="Favorite" className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground">
              <Star size={15} />
            </button>
            <button type="button" aria-label="Undo" onClick={() => undoAtlas()} className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground">
              <Undo2 size={15} />
            </button>
            <button type="button" aria-label="Redo" onClick={() => redoAtlas()} className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground">
              <Redo2 size={15} />
            </button>
            <button
              type="button"
              aria-label="Page actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-foreground"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          {menuOpen ? (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-10 right-3 z-30 w-56 rounded-md border border-border bg-elevated py-1 text-[14px] shadow-sm">
                <p className="px-3 pt-1.5 pb-1 text-[12px] text-muted">Sources</p>
                {SOURCES.map((source) => {
                  const on = sources === null || sources.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSource(source)}
                      className="flex h-8 w-full items-center gap-2 px-3 text-left hover:bg-hover"
                    >
                      <span
                        className={`size-3.5 rounded-sm border ${on ? 'border-accent bg-accent' : 'border-muted'}`}
                      />
                      {SOURCE_LABELS[source]}
                    </button>
                  );
                })}
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    resetDemo();
                    setMenuOpen(false);
                    setLive('Demo reset');
                  }}
                  className="flex h-8 w-full items-center px-3 text-left text-muted hover:bg-hover hover:text-foreground"
                >
                  Reset demo
                </button>
              </div>
            </>
          ) : null}
        </header>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
              <div className="flex items-center gap-0.5" role="tablist" aria-label="View">
                {VIEWS.map((item) => {
                  const Icon = item.icon;
                  const selected = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setView(item.id)}
                      className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[14px] ${
                        selected ? 'bg-hover text-foreground' : 'text-muted hover:bg-hover hover:text-foreground'
                      }`}
                    >
                      <Icon size={14} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <label className="ml-auto flex h-7 min-w-52 max-w-sm flex-1 items-center gap-2 rounded-md px-2 hover:bg-hover">
                <Search size={13} className="shrink-0 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setPaletteOpen(true);
                    }
                  }}
                  placeholder="Find a page, database, or property"
                  aria-label="Search notes"
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
                />
              </label>
              {view === 'graph'
                ? LAYERS.map((layer) => {
                    const on = layers[layer.key];
                    return (
                      <button
                        key={layer.key}
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => toggleLayer(layer.key)}
                        className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[13px] text-foreground hover:bg-hover"
                      >
                        <span
                          className={`relative h-3.5 w-6 shrink-0 rounded-full ${on ? 'bg-accent' : 'bg-border'}`}
                        >
                          <span
                            className={`absolute top-0.5 size-2.5 rounded-full bg-white ${on ? 'left-3' : 'left-0.5'}`}
                          />
                        </span>
                        {layer.label}
                      </button>
                    );
                  })
                : null}
              {view === 'graph' ? (
                <button
                  type="button"
                  onClick={() => graphRef.current?.fit()}
                  className="h-7 rounded-md px-2 text-[13px] text-muted hover:bg-hover hover:text-foreground"
                >
                  Fit
                </button>
              ) : null}
            </div>
            <div className={view === 'graph' ? 'relative min-h-0 flex-1' : 'hidden'}>
              <GraphCanvas
                ref={graphRef}
                selectedId={selectedId}
                query={query}
                sources={sources}
                onSelect={setSelectedId}
                onMoved={handleMoved}
                onMerged={handleMerged}
                onPinned={(id, x, y) => pinNode(id, x, y)}
                onUnpinned={(id) => unpinNode(id)}
              />
              <Legend />
              <p className="pointer-events-none absolute right-3 bottom-3 z-10 max-w-[220px] text-right text-[12px] leading-4 text-muted">
                Click a node to focus it and see details. Drag to move, scroll to zoom, click empty space to reset.
              </p>
            </div>
            {view === 'graph' ? null : (
              <CollectionViews
                view={view}
                query={query}
                sources={sources}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  graphRef.current?.focus(id);
                }}
              />
            )}
          </div>
          <Inspector
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              graphRef.current?.focus(id);
            }}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        query={query}
        onQuery={setQuery}
        onClose={() => setPaletteOpen(false)}
        onChoose={choose}
      />
    </div>
  );
}
