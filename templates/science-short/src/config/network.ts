// src/config/network.ts
export interface NodeDef {
  id: string;
  x: number;
  y: number;
  layer: number;
}

export interface EdgeDef {
  id: string;
  from: string;
  to: string;
}

export const NODES: NodeDef[] = [
  { id: 'n0', x: 480,  y: 380, layer: 0 },
  { id: 'n1', x: 480,  y: 700, layer: 0 },
  { id: 'n2', x: 960,  y: 240, layer: 1 },
  { id: 'n3', x: 960,  y: 540, layer: 1 },
  { id: 'n4', x: 960,  y: 840, layer: 1 },
  { id: 'n5', x: 1440, y: 540, layer: 2 },
];

export const EDGES: EdgeDef[] = [
  { id: 'e0', from: 'n0', to: 'n2' },
  { id: 'e1', from: 'n0', to: 'n3' },
  { id: 'e2', from: 'n0', to: 'n4' },
  { id: 'e3', from: 'n1', to: 'n2' },
  { id: 'e4', from: 'n1', to: 'n3' },
  { id: 'e5', from: 'n1', to: 'n4' },
  { id: 'e6', from: 'n2', to: 'n5' },
  { id: 'e7', from: 'n3', to: 'n5' },
  { id: 'e8', from: 'n4', to: 'n5' },
];

export function getNode(id: string): NodeDef {
  const node = NODES.find((n) => n.id === id);
  if (!node) throw new Error(`Node ${id} not found`);
  return node;
}

// Pre-computed edge lengths for strokeDasharray
export function edgeLength(edge: EdgeDef): number {
  const from = getNode(edge.from);
  const to = getNode(edge.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Edge weight targets for Scene 3 (deterministic, pre-designed)
export const SCENE3_WEIGHT_TARGETS: Record<string, number> = {
  e0: 2.5,
  e1: 0.4,
  e2: 1.8,
  e3: 0.5,
  e4: 2.2,
  e5: 1.1,
  e6: 0.6,
  e7: 2.8,
  e8: 1.5,
};
