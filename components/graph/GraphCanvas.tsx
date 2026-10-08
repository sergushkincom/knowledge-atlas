'use client';

import { forceCollide } from 'd3-force';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { buildGraph } from '@/lib/graph/buildGraph';
import { createClusterForce, seededPosition, type ClusterBody } from '@/lib/graph/forces';
import { buildClusterHulls, drawBubbleHull, type Point } from '@/lib/graph/hulls';
import { findHubDropTarget, findNoteDropTarget, type HubPoint } from '@/lib/graph/hitTest';
import { topicSwatch } from '@/lib/theme/palette';
import { useAtlasStore } from '@/lib/store';
import type { EdgeKind, LayerVisibility, NoteSource, ThemeName, TopicColor } from '@/lib/types';

export interface GraphCanvasHandle {
  focus: (id: string) => void;
  fit: () => void;
}

interface SimNode extends ClusterBody {
  label: string;
  color: TopicColor;
  radius: number;
  pinned: boolean;
  lowConfidence: boolean;
  confidence?: number;
}

interface SimLink {
  id: string;
  kind: EdgeKind;
  weight?: number;
  source: string | SimNode;
  target: string | SimNode;
}

interface GraphApi {
  d3Force: (name: string, fn?: object | null) => unknown;
  d3ReheatSimulation: () => void;
  centerAt: (x?: number, y?: number, duration?: number) => void;
  zoom: (scale?: number, duration?: number) => number;
  zoomToFit: (duration?: number, padding?: number) => void;
  graph2ScreenCoords: (x: number, y: number) => { x: number; y: number };
}

interface DropChip {
  x: number;
  y: number;
  label: string;
}

interface TooltipState {
  x: number;
  y: number;
  title: string;
  meta: string;
}

const ACCENT = '#2383E2';
const AtlasGraph = ForceGraph2D as unknown as (props: Record<string, unknown> & { ref?: Ref<GraphApi> }) => ReactElement;

function truncate(label: string, max = 28): string {
  return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
}

function endpointId(value: string | SimNode | undefined): string {
  if (!value) {
    return '';
  }
  return typeof value === 'string' ? value : value.id;
}

function linkVisible(kind: EdgeKind, layers: LayerVisibility): boolean {
  if (kind === 'belongs') {
    return layers.topics;
  }
  if (kind === 'link') {
    return layers.links;
  }
  if (kind === 'similar') {
    return layers.similarity;
  }
  if (kind === 'tag') {
    return layers.tags;
  }
  return layers.people;
}

function edgeColor(kind: EdgeKind, theme: ThemeName, alpha: number): string {
  if (kind === 'link') {
    return `rgba(140, 170, 210, ${0.38 * alpha})`;
  }
  if (kind === 'belongs') {
    const channel = theme === 'dark' ? '230, 230, 230' : '25, 25, 25';
    return `rgba(${channel}, ${0.28 * alpha})`;
  }
  const channel = theme === 'dark' ? '180, 180, 180' : '70, 70, 70';
  return `rgba(${channel}, ${0.55 * alpha})`;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, {
  selectedId: string | null;
  query: string;
  sources: NoteSource[] | null;
  onSelect: (id: string | null) => void;
  onMoved: (noteId: string, topicId: string) => void;
  onMerged: (sourceId: string, targetId: string) => void;
  onPinned: (id: string, x: number, y: number) => void;
  onUnpinned: (id: string) => void;
}>(function GraphCanvas({
  selectedId,
  query,
  sources,
  onSelect,
  onMoved,
  onMerged,
  onPinned,
  onUnpinned,
}, ref) {
  const notes = useAtlasStore((state) => state.notes);
  const topics = useAtlasStore((state) => state.topics);
  const assignments = useAtlasStore((state) => state.assignments);
  const layouts = useAtlasStore((state) => state.layouts);
  const layers = useAtlasStore((state) => state.settings.layers);
  const theme = useAtlasStore((state) => state.settings.theme);

  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<GraphApi | null>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const hullsRef = useRef(new Map<string, Point[]>());
  const frameRef = useRef(0);
  const fittedRef = useRef(false);
  const dragRef = useRef(false);
  const zoomRef = useRef(1);
  const [size, setSize] = useState({ width: 800, height: 640 });
  const [chip, setChip] = useState<DropChip | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const viewRef = useRef({
    layers,
    theme,
    query,
    sources,
    selectedId,
    hoverId: null as string | null,
    dropId: null as string | null,
  });
  viewRef.current = {
    ...viewRef.current,
    layers,
    theme,
    query,
    sources,
    selectedId,
  };

  const topicIds = useMemo(() => topics.map((topic) => topic.id), [topics]);
  const notesById = useMemo(() => new Map(notes.map((note) => [note.id, note])), [notes]);
  const topicsById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const inboxId = topics.find((topic) => topic.isInbox)?.id;

  const graphData = useMemo(() => {
    const derived = buildGraph({ notes, topics, assignments });
    const nodes: SimNode[] = derived.nodes.map((node) => {
      const saved = positions.current.get(node.id);
      const seeded = seededPosition(node.id, node.kind, node.topicId, topicIds);
      return {
        id: node.id,
        kind: node.kind,
        topicId: node.topicId,
        label: node.label,
        color: node.color,
        radius: node.radius,
        pinned: node.pinned,
        lowConfidence: node.lowConfidence,
        confidence: node.confidence,
        x: saved?.x ?? seeded.x,
        y: saved?.y ?? seeded.y,
      };
    });
    const links: SimLink[] = derived.edges.map((edge) => ({
      id: edge.id,
      kind: edge.kind,
      weight: edge.weight,
      source: edge.source,
      target: edge.target,
    }));
    return { nodes, links };
  }, [notes, topics, assignments, topicIds]);

  const dataRef = useRef(graphData);
  dataRef.current = graphData;

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) {
      return;
    }
    const measure = () => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) {
      return;
    }
    const charge = fg.d3Force('charge') as { strength: (fn: (node: SimNode) => number) => void } | undefined;
    charge?.strength((node) => (node.kind === 'topic' ? -420 : -14));
    const link = fg.d3Force('link') as {
      distance: (fn: (item: SimLink) => number) => void;
      strength: (fn: (item: SimLink) => number) => void;
    } | undefined;
    link?.distance((item) => (item.kind === 'belongs' ? (item.weight === 1 ? 58 : 96) : 120));
    link?.strength((item) => {
      if (item.kind === 'belongs') {
        return item.weight === 1 ? 0.62 : 0.04;
      }
      if (item.kind === 'link') {
        return 0.06;
      }
      return 0;
    });
    fg.d3Force('cluster', createClusterForce(0.5));
    fg.d3Force('collision', forceCollide<SimNode>().radius((node) => node.radius + 7).strength(0.85));
    fg.d3ReheatSimulation();
  }, [graphData]);

  useEffect(() => {
    const byId = new Map(layouts.map((layout) => [layout.id, layout]));
    let changed = false;
    for (const node of graphData.nodes) {
      const layout = byId.get(node.id);
      if (layout?.pinned) {
        if (node.fx !== layout.x || node.fy !== layout.y) {
          node.fx = layout.x;
          node.fy = layout.y;
          node.x = layout.x;
          node.y = layout.y;
          changed = true;
        }
        node.pinned = true;
      } else if (!dragRef.current && node.fx != null) {
        node.fx = undefined;
        node.fy = undefined;
        node.pinned = false;
        changed = true;
      }
    }
    if (changed) {
      fgRef.current?.d3ReheatSimulation();
    }
  }, [layouts, graphData]);

  useImperativeHandle(ref, () => ({
    focus: (id: string) => {
      const node = dataRef.current.nodes.find((item) => item.id === id);
      const fg = fgRef.current;
      if (!node || node.x == null || node.y == null || !fg) {
        return;
      }
      fg.centerAt(node.x, node.y, 450);
      fg.zoom(2.4, 450);
    },
    fit: () => {
      fgRef.current?.zoomToFit(450, 72);
    },
  }));

  function remember(nodes: SimNode[]) {
    for (const node of nodes) {
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        positions.current.set(node.id, { x: node.x, y: node.y });
      }
    }
  }

  function hubsOf(nodes: SimNode[]): HubPoint[] {
    return nodes.flatMap((node) =>
      node.kind === 'topic' && node.x != null && node.y != null
        ? [{ id: node.id, x: node.x, y: node.y }]
        : [],
    );
  }

  function nodeAlpha(node: SimNode): number {
    const view = viewRef.current;
    if (view.hoverId) {
      return highlightSet().has(node.id) ? 1 : 0.15;
    }
    if (!isMatch(node)) {
      return 0.15;
    }
    return 1;
  }

  function highlightSet(): Set<string> {
    const hoverId = viewRef.current.hoverId;
    const set = new Set<string>();
    if (!hoverId) {
      return set;
    }
    set.add(hoverId);
    for (const link of dataRef.current.links) {
      if (!linkVisible(link.kind, viewRef.current.layers)) {
        continue;
      }
      const source = endpointId(link.source);
      const target = endpointId(link.target);
      if (source === hoverId) {
        set.add(target);
      }
      if (target === hoverId) {
        set.add(source);
      }
    }
    return set;
  }

  function isMatch(node: SimNode): boolean {
    const view = viewRef.current;
    const queryText = view.query.trim().toLowerCase();
    const note = notesById.get(node.id);
    if (view.sources && node.kind === 'note' && note && !view.sources.includes(note.source)) {
      return false;
    }
    if (!queryText) {
      return true;
    }
    if (node.kind === 'topic') {
      return node.label.toLowerCase().includes(queryText);
    }
    if (!note) {
      return false;
    }
    return (
      note.title.toLowerCase().includes(queryText) ||
      note.people.some((person) => person.toLowerCase().includes(queryText)) ||
      note.tags.some((tag) => tag.toLowerCase().includes(queryText))
    );
  }

  function screenChip(node: SimNode, label: string) {
    const fg = fgRef.current;
    if (!fg || node.x == null || node.y == null) {
      return;
    }
    const point = fg.graph2ScreenCoords(node.x, node.y);
    setChip({ x: point.x, y: point.y - 36, label });
  }

  const background = theme === 'dark' ? '#191919' : '#ffffff';

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <AtlasGraph
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor={background}
        cooldownTicks={180}
        warmupTicks={40}
        d3AlphaDecay={0.028}
        d3VelocityDecay={0.35}
        minZoom={0.25}
        maxZoom={6}
        autoPauseRedraw={false}
        enableNodeDrag
        showPointerCursor
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(raw: SimNode, context: CanvasRenderingContext2D, globalScale: number) => {
          const node = raw;
          if (node.x == null || node.y == null) {
            return;
          }
          if (node.kind === 'topic' && !viewRef.current.layers.topics) {
            return;
          }
          const swatch = topicSwatch(node.color, viewRef.current.theme);
          const selected = node.id === viewRef.current.selectedId;
          const hovered = node.id === viewRef.current.hoverId;
          context.save();
          context.globalAlpha = nodeAlpha(node);
          context.beginPath();
          context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          context.fillStyle = swatch.node;
          context.fill();
          if (node.kind === 'note' && node.lowConfidence) {
            context.beginPath();
            context.arc(node.x, node.y, node.radius + 5 / globalScale, 0, Math.PI * 2);
            context.setLineDash([2.2 / globalScale, 1.6 / globalScale]);
            context.strokeStyle = swatch.label;
            context.lineWidth = 1.15 / globalScale;
            context.stroke();
            context.setLineDash([]);
          }
          if (selected || hovered) {
            context.beginPath();
            context.arc(node.x, node.y, node.radius + 2.5 / globalScale, 0, Math.PI * 2);
            context.strokeStyle = ACCENT;
            context.lineWidth = 1.5 / globalScale;
            context.stroke();
          }
          if (node.pinned || node.fx != null) {
            context.beginPath();
            context.arc(node.x + node.radius * 0.7, node.y - node.radius * 0.75, 2.2 / globalScale, 0, Math.PI * 2);
            context.fillStyle = swatch.label;
            context.fill();
          }
          const showLabel = node.kind === 'topic' || globalScale > 1.3 || selected || hovered;
          if (showLabel) {
            const sizePx = node.kind === 'topic' ? 12 : 10;
            const labelY = node.y + node.radius + (node.kind === 'topic' ? 8 : 4) / globalScale;
            context.font = `${node.kind === 'topic' ? 600 : 400} ${sizePx / globalScale}px Inter, sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'top';
            context.lineWidth = 3 / globalScale;
            context.strokeStyle = background;
            context.strokeText(truncate(node.label), node.x, labelY);
            context.fillStyle = swatch.label;
            context.fillText(truncate(node.label), node.x, labelY);
          }
          context.restore();
        }}
        nodePointerAreaPaint={(raw: SimNode, color: string, context: CanvasRenderingContext2D) => {
          const node = raw;
          if (node.x == null || node.y == null) {
            return;
          }
          if (node.kind === 'topic' && !viewRef.current.layers.topics) {
            return;
          }
          context.fillStyle = color;
          context.beginPath();
          context.arc(node.x, node.y, Math.max(node.radius, 8), 0, Math.PI * 2);
          context.fill();
        }}
        linkVisibility={(raw: SimLink) => linkVisible(raw.kind, viewRef.current.layers)}
        linkColor={(raw: SimLink) => {
          const link = raw;
          const view = viewRef.current;
          let alpha = 1;
          if (view.hoverId) {
            const highlighted = highlightSet();
            const source = endpointId(link.source);
            const target = endpointId(link.target);
            alpha = highlighted.has(source) && highlighted.has(target) ? 1 : 0.08;
          }
          return edgeColor(link.kind, view.theme, alpha);
        }}
        linkWidth={(raw: SimLink) => {
          const link = raw;
          if (link.kind === 'link') {
            return 0.9;
          }
          if (link.kind === 'belongs' && link.weight !== 1) {
            return 0.6;
          }
          return 0.75;
        }}
        linkLineDash={(raw: SimLink) => {
          const kind = raw.kind;
          if (kind === 'similar') {
            return [4, 3];
          }
          if (kind === 'tag' || kind === 'person') {
            return [1, 2.5];
          }
          return null;
        }}
        onZoom={(transform: { k: number }) => {
          zoomRef.current = transform.k;
        }}
        onEngineTick={() => {
          remember(dataRef.current.nodes);
        }}
        onEngineStop={() => {
          if (fittedRef.current) {
            return;
          }
          fittedRef.current = true;
          fgRef.current?.zoomToFit(500, 80);
        }}
        onRenderFramePre={(context: CanvasRenderingContext2D, globalScale: number) => {
          frameRef.current += 1;
          const nodes = dataRef.current.nodes;
          remember(nodes);
          if (dragRef.current || frameRef.current % 3 === 1) {
            hullsRef.current = buildClusterHulls(nodes);
          }
          if (!viewRef.current.layers.topics) {
            return;
          }
          const highlight = viewRef.current.hoverId ? highlightSet() : null;
          for (const [topicId, hull] of hullsRef.current) {
            const topic = topicsById.get(topicId);
            if (!topic) {
              continue;
            }
            const swatch = topicSwatch(topic.color, viewRef.current.theme);
            const glow = viewRef.current.dropId === topicId;
            const dim = highlight ? !highlight.has(topicId) : false;
            context.save();
            context.globalAlpha = dim ? 0.15 : 1;
            try {
              const seed = topicId.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0) / 40;
              drawBubbleHull(
                context,
                hull,
                performance.now() / 1000,
                seed,
                swatch.hull,
                glow ? swatch.node : swatch.hullStroke,
                (glow ? 2.4 : 1) / globalScale,
                window.matchMedia('(prefers-reduced-motion: reduce)').matches,
              );
            } catch {
              // A paint error must not stop the canvas loop.
            } finally {
              context.restore();
            }
          }
        }}
        onNodeHover={(raw: SimNode | null) => {
          const node = raw as SimNode | null;
          viewRef.current.hoverId = node?.id ?? null;
          if (!node || node.x == null || node.y == null || !fgRef.current) {
            setTooltip(null);
            return;
          }
          const point = fgRef.current.graph2ScreenCoords(node.x, node.y);
          if (node.kind === 'topic') {
            const topic = topicsById.get(node.id);
            setTooltip({
              x: point.x,
              y: point.y,
              title: node.label,
              meta: topic?.description ?? 'Topic',
            });
            return;
          }
          const note = notesById.get(node.id);
          const topic = node.topicId ? topicsById.get(node.topicId) : undefined;
          const date = note ? new Date(note.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
          setTooltip({
            x: point.x,
            y: point.y,
            title: node.label,
            meta: [note?.source.replace('-', ' '), date, topic?.name].filter(Boolean).join(' · '),
          });
        }}
        onNodeClick={(raw: SimNode, event: MouseEvent) => {
          const node = raw;
          if (event.detail >= 2) {
            node.fx = undefined;
            node.fy = undefined;
            node.pinned = false;
            onUnpinned(node.id);
            fgRef.current?.d3ReheatSimulation();
            return;
          }
          onSelect(node.id);
        }}
        onBackgroundClick={() => {
          onSelect(null);
        }}
        onNodeDrag={(raw: SimNode) => {
          const node = raw;
          dragRef.current = true;
          setTooltip(null);
          if (node.x == null || node.y == null) {
            return;
          }
          const nodes = dataRef.current.nodes;
          const hulls = buildClusterHulls(nodes);
          hullsRef.current = hulls;
          const hubs = hubsOf(nodes);
          const zoom = zoomRef.current || 1;
          if (node.kind === 'note') {
            const target = findNoteDropTarget(node.x, node.y, zoom, node.topicId, hulls, hubs);
            viewRef.current.dropId = target;
            if (target) {
              screenChip(node, `Move to ‘${topicsById.get(target)?.name ?? 'topic'}’`);
            } else {
              setChip(null);
            }
            return;
          }
          if (node.id === inboxId) {
            viewRef.current.dropId = null;
            setChip(null);
            return;
          }
          const target = findHubDropTarget(node.x, node.y, zoom, node.id, hubs);
          viewRef.current.dropId = target;
          if (target) {
            screenChip(node, `Merge into ‘${topicsById.get(target)?.name ?? 'topic'}’`);
          } else {
            setChip(null);
          }
        }}
        onNodeDragEnd={(raw: SimNode) => {
          const node = raw;
          dragRef.current = false;
          const target = viewRef.current.dropId;
          viewRef.current.dropId = null;
          setChip(null);
          if (node.x == null || node.y == null) {
            return;
          }
          remember([node]);
          if (node.kind === 'note' && target && target !== node.topicId) {
            node.fx = undefined;
            node.fy = undefined;
            node.pinned = false;
            node.topicId = target;
            onMoved(node.id, target);
            fgRef.current?.d3ReheatSimulation();
            return;
          }
          if (node.kind === 'topic' && target) {
            node.fx = undefined;
            node.fy = undefined;
            onMerged(node.id, target);
            fgRef.current?.d3ReheatSimulation();
            return;
          }
          node.fx = node.x;
          node.fy = node.y;
          node.pinned = true;
          onPinned(node.id, node.x, node.y);
        }}
      />
      {chip ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border border-border bg-elevated px-2 py-1 text-[12px] font-medium text-foreground shadow-sm"
          style={{ left: chip.x, top: chip.y }}
        >
          {chip.label}
        </div>
      ) : null}
      {tooltip && !chip ? (
        <div
          className="pointer-events-none absolute z-20 max-w-56 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-elevated px-2 py-1.5 text-left shadow-sm"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          <p className="truncate text-[12px] font-medium text-foreground">{tooltip.title}</p>
          <p className="truncate text-[11px] text-muted">{tooltip.meta}</p>
        </div>
      ) : null}
    </div>
  );
});
