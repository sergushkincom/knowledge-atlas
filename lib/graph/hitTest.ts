import { quadtree } from 'd3-quadtree';
import { polygonContains } from 'd3-polygon';
import type { Point } from '@/lib/graph/hulls';

export interface HubPoint {
  id: string;
  x: number;
  y: number;
}

/**
 * Topic under a dragged note: inside another hull, or within 80 screen pixels of its hub.
 * Own topic is ignored. Overlapping hulls resolve to the nearest hub.
 */
export function findNoteDropTarget(
  x: number,
  y: number,
  zoom: number,
  currentTopicId: string | undefined,
  hulls: ReadonlyMap<string, Point[]>,
  hubs: readonly HubPoint[],
): string | null {
  let closest: { id: string; distance: number } | null = null;
  for (const [topicId, polygon] of hulls) {
    if (topicId === currentTopicId || polygon.length < 3) {
      continue;
    }
    if (!polygonContains(polygon, [x, y])) {
      continue;
    }
    const hub = hubs.find((item) => item.id === topicId);
    const distance = hub ? Math.hypot(hub.x - x, hub.y - y) : 0;
    if (!closest || distance < closest.distance) {
      closest = { id: topicId, distance };
    }
  }
  if (closest) {
    return closest.id;
  }

  const reach = 80 / Math.max(zoom, 0.2);
  const others = hubs.filter((hub) => hub.id !== currentTopicId);
  const tree = quadtree<HubPoint>()
    .x((hub) => hub.x)
    .y((hub) => hub.y)
    .addAll(others);
  return tree.find(x, y, reach)?.id ?? null;
}

/** Dragging one hub onto another. Reach is about 72 screen pixels. */
export function findHubDropTarget(
  x: number,
  y: number,
  zoom: number,
  sourceId: string,
  hubs: readonly HubPoint[],
): string | null {
  const reach = 72 / Math.max(zoom, 0.2);
  const others = hubs.filter((hub) => hub.id !== sourceId);
  const tree = quadtree<HubPoint>()
    .x((hub) => hub.x)
    .y((hub) => hub.y)
    .addAll(others);
  return tree.find(x, y, reach)?.id ?? null;
}
