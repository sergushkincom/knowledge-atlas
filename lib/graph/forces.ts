import type { SimulationNodeDatum } from 'd3-force';

export interface ClusterBody extends SimulationNodeDatum {
  id: string;
  kind: 'note' | 'topic';
  topicId?: string;
  fx?: number | null;
}

/** Pulls each unpinned note toward its topic hub. Pinned notes (fx set) stay put. */
export function createClusterForce(strength = 0.45) {
  let nodes: ClusterBody[] = [];

  const force = (alpha: number) => {
    const hubs = new Map<string, ClusterBody>();
    for (const node of nodes) {
      if (node.kind === 'topic') {
        hubs.set(node.id, node);
      }
    }
    for (const node of nodes) {
      if (node.kind !== 'note' || node.fx != null || node.x == null || node.y == null) {
        continue;
      }
      const hub = node.topicId ? hubs.get(node.topicId) : undefined;
      if (!hub || hub.x == null || hub.y == null) {
        continue;
      }
      node.vx = (node.vx ?? 0) + (hub.x - node.x) * strength * alpha;
      node.vy = (node.vy ?? 0) + (hub.y - node.y) * strength * alpha;
    }
  };

  force.initialize = (next: ClusterBody[]) => {
    nodes = next;
  };

  return force;
}

function hashUnit(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return hash / 997;
}

/** First-paint arrangement: topics on an ellipse, notes already near their hub. */
export function seededPosition(
  id: string,
  kind: 'note' | 'topic',
  topicId: string | undefined,
  topicIds: readonly string[],
): { x: number; y: number } {
  const count = Math.max(topicIds.length, 1);
  const indexOf = new Map(topicIds.map((topic, index) => [topic, index]));
  const index = kind === 'topic' ? (indexOf.get(id) ?? 0) : (topicId ? (indexOf.get(topicId) ?? 0) : 0);
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const hubX = Math.cos(angle) * 360;
  const hubY = Math.sin(angle) * 250;
  if (kind === 'topic') {
    return { x: hubX, y: hubY };
  }
  const unit = hashUnit(id);
  const noteAngle = unit * Math.PI * 2;
  const noteRadius = 32 + Math.floor(unit * 70);
  return {
    x: hubX + Math.cos(noteAngle) * noteRadius,
    y: hubY + Math.sin(noteAngle) * noteRadius,
  };
}
