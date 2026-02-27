# Neural Network Explainer Animation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 90-second Remotion animated explainer for the Soma YouTube channel showing how a neural network learns, using bespoke SVG animations with the Soma brand.

**Architecture:** Custom standalone Remotion project (not config-driven). Five scene components composed with `<Series>`. Three reusable SVG primitives (NetworkGraph, TravelingDot, LossCurve) shared across scenes. All animation via `interpolate()` and `spring()` from Remotion — no canvas, no d3, no external animation libs.

**Tech Stack:** Remotion 4.0.425, React 18, TypeScript, SVG, `@remotion/google-fonts`

---

## Network Topology Reference

Fixed throughout all scenes. Memorize or paste where needed.

```
n0: (480, 380)   layer 0, input top
n1: (480, 700)   layer 0, input bottom
n2: (960, 240)   layer 1, hidden top
n3: (960, 540)   layer 1, hidden middle
n4: (960, 840)   layer 1, hidden bottom
n5: (1440, 540)  layer 2, output

Edges (9 total):
e0 n0→n2   e1 n0→n3   e2 n0→n4
e3 n1→n2   e4 n1→n3   e5 n1→n4
e6 n2→n5   e7 n3→n5   e8 n4→n5

First group (draw first):  e0–e5  (layer 0→1)
Second group (draw after): e6–e8  (layer 1→2)
```

## Timing Reference

```
Scene 1 — Question:          300f   (f    0 –  299)  10s
Scene 2 — Forward Pass:      600f   (f  300 –  899)  20s
Scene 3 — Adjust:            750f   (f  900 – 1649)  25s
Scene 4 — Rapid Repetition:  750f   (f 1650 – 2399)  25s
Scene 5 — Final:             300f   (f 2400 – 2699)  10s
Total: 2700f @ 30fps = 90s
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `projects/explainer-video/` (copy from template)

**Step 1: Copy template**

```bash
cp -r templates/product-demo projects/explainer-video
cd projects/explainer-video
```

**Step 2: Update package.json**

Replace the entire `projects/explainer-video/package.json` with:

```json
{
  "name": "explainer-video",
  "version": "1.0.0",
  "description": "Soma — How a Neural Network Learns",
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render NeuralNetworkVideo out/neural-network.mp4",
    "render:preview": "remotion render NeuralNetworkVideo out/preview.mp4 --scale=0.5"
  },
  "dependencies": {
    "@remotion/cli": "4.0.425",
    "@remotion/google-fonts": "4.0.425",
    "@remotion/transitions": "4.0.425",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "remotion": "4.0.425"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 3: Delete template source files**

```bash
rm -rf src/components src/scenes 2>/dev/null; mkdir -p src/components src/scenes src/config
```

**Step 4: Install deps**

```bash
npm install
```

Expected: clean install, no errors.

**Step 5: Commit**

```bash
git add projects/explainer-video/package.json projects/explainer-video/package-lock.json
git commit -m "feat: scaffold explainer-video Remotion project"
```

---

## Task 2: Brand config

**Files:**
- Create: `projects/explainer-video/src/config/brand.ts`

**Step 1: Write brand.ts**

```typescript
// src/config/brand.ts
export const BRAND = {
  bg: '#0A0E1A',
  bgMid: '#111827',
  cyan: '#00C8C8',
  cyanLight: '#33D6D6',
  cyanDim: 'rgba(0, 200, 200, 0.3)',
  orange: '#F5A623',
  orangeLight: '#F7BB55',
  orangeDim: 'rgba(245, 166, 35, 0.3)',
  text: '#E2E8F0',
  textMuted: '#64748B',
  green: '#4ADE80',
  red: '#F87171',
  font: '"Space Grotesk", system-ui, -apple-system, sans-serif',
} as const;
```

**Step 2: Commit**

```bash
git add src/config/brand.ts
git commit -m "feat: add Soma brand config"
```

---

## Task 3: Network data constants

**Files:**
- Create: `projects/explainer-video/src/config/network.ts`

**Step 1: Write network.ts**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/config/network.ts
git commit -m "feat: add network topology constants"
```

---

## Task 4: NetworkGraph component

**Files:**
- Create: `projects/explainer-video/src/components/NetworkGraph.tsx`

This is the SVG backbone used in every scene.

**Step 1: Write NetworkGraph.tsx**

```typescript
// src/components/NetworkGraph.tsx
import React from 'react';
import { interpolate } from 'remotion';
import { NODES, EDGES, getNode, edgeLength } from '../config/network';
import { BRAND } from '../config/brand';

export interface NodeState {
  color?: string;
  glowIntensity?: number; // 0–1
  scale?: number;         // default 1
}

export interface NetworkGraphProps {
  /** 0→1: edges draw in L→R, nodes pop in per-layer */
  drawProgress: number;
  /** Per-node overrides. Keys are node IDs (n0–n5). */
  nodeStates?: Record<string, NodeState>;
  /** Per-edge strokeWidth multiplier. Keys are edge IDs (e0–e8). */
  edgeWeights?: Record<string, number>;
  /** Show +/− annotation labels on edges (Scene 3) */
  showWeightLabels?: boolean;
  width?: number;
  height?: number;
}

const NODE_RADIUS = 28;
const BASE_EDGE_WIDTH = 2.5;

// Weight label text: positive = "+", negative (< 1) = "−"
const WEIGHT_LABEL: Record<string, string> = {
  e0: '+', e1: '−', e2: '+', e3: '−', e4: '+', e5: '+',
  e6: '−', e7: '+', e8: '+',
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  drawProgress,
  nodeStates = {},
  edgeWeights = {},
  showWeightLabels = false,
  width = 1920,
  height = 1080,
}) => {
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
    >
      <defs>
        <filter id="ng-node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Edges ── */}
      {EDGES.map((edge, i) => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);
        const len = edgeLength(edge);

        // e0–e5 draw during first half; e6–e8 during second half
        const isFirst = i < 6;
        const ep = isFirst
          ? interpolate(drawProgress, [0, 0.55], [0, 1], { extrapolateRight: 'clamp' })
          : interpolate(drawProgress, [0.5, 1.0], [0, 1], { extrapolateRight: 'clamp' });

        const weight = edgeWeights[edge.id] ?? 1;
        const strokeWidth = BASE_EDGE_WIDTH * weight;
        const dashOffset = len * (1 - ep);

        // Midpoint for weight label
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;

        return (
          <g key={edge.id}>
            <line
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke={BRAND.cyan}
              strokeWidth={strokeWidth}
              strokeOpacity={0.55}
              strokeDasharray={len}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
            {showWeightLabels && ep > 0.8 && (
              <text
                x={mx} y={my - 10}
                fill={weight >= 1 ? BRAND.orange : BRAND.textMuted}
                fontSize={22}
                fontFamily={BRAND.font}
                fontWeight={700}
                textAnchor="middle"
                opacity={interpolate(ep, [0.8, 1], [0, 1])}
              >
                {WEIGHT_LABEL[edge.id]}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {NODES.map((node) => {
        // Each layer pops in at different drawProgress thresholds
        const thresholds: Record<number, [number, number]> = {
          0: [0.0, 0.15],
          1: [0.35, 0.55],
          2: [0.75, 0.95],
        };
        const [t0, t1] = thresholds[node.layer];
        const nodeScale = interpolate(drawProgress, [t0, t1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const state = nodeStates[node.id] ?? {};
        const color = state.color ?? BRAND.cyan;
        const glow = state.glowIntensity ?? 0;
        const extraScale = state.scale ?? 1;
        const r = NODE_RADIUS * nodeScale * extraScale;

        return (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            {/* Glow halo */}
            {glow > 0 && (
              <circle
                r={r * 2.5 * glow}
                fill={color}
                opacity={0.18 * glow}
              />
            )}
            {/* Node ring */}
            <circle
              r={r}
              fill={BRAND.bg}
              stroke={color}
              strokeWidth={2.5}
              filter={glow > 0.3 ? 'url(#ng-node-glow)' : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
};
```

**Step 2: Visual verify**

```bash
# In projects/explainer-video/
npm run studio
```

Add a temporary Root.tsx that shows `<NetworkGraph drawProgress={1} />` on a dark background and confirm all 6 nodes and 9 edges appear. (Remove temp code before committing.)

**Step 3: Commit**

```bash
git add src/components/NetworkGraph.tsx
git commit -m "feat: add NetworkGraph SVG component"
```

---

## Task 5: TravelingDot component

**Files:**
- Create: `projects/explainer-video/src/components/TravelingDot.tsx`

The dot travels along a sequence of `[x, y]` waypoints. It pauses briefly at each waypoint (simulating "processing"). Glow effect via SVG filter.

**Step 1: Write TravelingDot.tsx**

```typescript
// src/components/TravelingDot.tsx
import React from 'react';
import { interpolate } from 'remotion';
import { BRAND } from '../config/brand';

export interface TravelingDotProps {
  /** Sequence of [x, y] positions to travel through */
  waypoints: [number, number][];
  /**
   * 0→1 over the ENTIRE path (including pauses).
   * Internal: each segment gets equal share of progress space,
   * but the dot eases in/out around waypoints.
   */
  progress: number;
  color?: string;
  radius?: number;
  width?: number;
  height?: number;
}

export const TravelingDot: React.FC<TravelingDotProps> = ({
  waypoints,
  progress,
  color = BRAND.cyan,
  radius = 13,
  width = 1920,
  height = 1080,
}) => {
  if (waypoints.length < 2 || progress <= 0) return null;

  // Divide progress space equally among segments
  const segCount = waypoints.length - 1;
  const segSize = 1 / segCount;

  // Which segment are we in?
  const clampedProgress = Math.min(progress, 0.9999);
  const segIndex = Math.min(Math.floor(clampedProgress / segSize), segCount - 1);
  const segProgress = (clampedProgress - segIndex * segSize) / segSize;

  // Ease: slow start + slow end within each segment (simulates pause at nodes)
  const eased = interpolate(segProgress, [0, 0.15, 0.85, 1.0], [0, 0.05, 0.95, 1.0]);

  const [x1, y1] = waypoints[segIndex];
  const [x2, y2] = waypoints[segIndex + 1];

  const cx = x1 + (x2 - x1) * eased;
  const cy = y1 + (y2 - y1) * eased;

  const opacity = progress < 0.02
    ? interpolate(progress, [0, 0.02], [0, 1])
    : progress > 0.97
    ? interpolate(progress, [0.97, 1], [1, 0])
    : 1;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        <filter id="td-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer halo */}
      <circle cx={cx} cy={cy} r={radius * 2.8} fill={color} opacity={0.15 * opacity} />
      {/* Mid glow */}
      <circle cx={cx} cy={cy} r={radius * 1.6} fill={color} opacity={0.25 * opacity} />
      {/* Core */}
      <circle cx={cx} cy={cy} r={radius} fill={color} opacity={opacity} filter="url(#td-glow)" />
      {/* Bright center specular */}
      <circle cx={cx} cy={cy} r={radius * 0.35} fill="white" opacity={0.85 * opacity} />
    </svg>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/TravelingDot.tsx
git commit -m "feat: add TravelingDot SVG component"
```

---

## Task 6: LossCurve component

**Files:**
- Create: `projects/explainer-video/src/components/LossCurve.tsx`

Used in Scene 4. A polyline that grows rightward, y-value descending toward zero as iterations increase.

**Step 1: Write LossCurve.tsx**

```typescript
// src/components/LossCurve.tsx
import React from 'react';
import { BRAND } from '../config/brand';

// Pre-defined loss trajectory (15 data points, one per pass)
const LOSS_VALUES = [
  0.92, 0.78, 0.63, 0.51, 0.41,
  0.33, 0.26, 0.21, 0.17, 0.13,
  0.10, 0.08, 0.06, 0.05, 0.04,
];

export interface LossCurveProps {
  /** 0–15: how many data points to draw */
  passCount: number;
  width?: number;
  height?: number;
  /** Top-left offset in parent coordinate space */
  x?: number;
  y?: number;
}

export const LossCurve: React.FC<LossCurveProps> = ({
  passCount,
  width = 340,
  height = 160,
  x = 0,
  y = 0,
}) => {
  const maxPasses = LOSS_VALUES.length;
  const visibleCount = Math.min(Math.floor(passCount), maxPasses);
  if (visibleCount < 1) return null;

  const points = LOSS_VALUES.slice(0, visibleCount).map((loss, i) => {
    const px = (i / (maxPasses - 1)) * width;
    const py = height - loss * height * 0.95; // top-pad 5%
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });

  return (
    <svg
      width={width + 60}
      height={height + 50}
      style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}
    >
      {/* Axis lines */}
      <line x1={40} y1={0} x2={40} y2={height} stroke={BRAND.textMuted} strokeWidth={1} opacity={0.35} />
      <line x1={40} y1={height} x2={width + 40} y2={height} stroke={BRAND.textMuted} strokeWidth={1} opacity={0.35} />

      {/* Axis labels */}
      <text
        x={(width / 2) + 40} y={height + 34}
        fill={BRAND.textMuted} fontSize={18} textAnchor="middle"
        fontFamily={BRAND.font}
      >
        iterations
      </text>
      <text
        x={14} y={height / 2}
        fill={BRAND.textMuted} fontSize={18} textAnchor="middle"
        fontFamily={BRAND.font}
        transform={`rotate(-90, 14, ${height / 2})`}
      >
        error
      </text>

      {/* Loss polyline — translate 40 right to clear y-axis */}
      <polyline
        points={points.map((p) => {
          const [px, py] = p.split(',').map(Number);
          return `${px + 40},${py}`;
        }).join(' ')}
        fill="none"
        stroke={BRAND.orange}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Current point dot */}
      {visibleCount > 0 && (() => {
        const lastI = visibleCount - 1;
        const lastLoss = LOSS_VALUES[lastI];
        const dotX = (lastI / (maxPasses - 1)) * width + 40;
        const dotY = height - lastLoss * height * 0.95;
        return (
          <circle cx={dotX} cy={dotY} r={5} fill={BRAND.orange} />
        );
      })()}
    </svg>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/LossCurve.tsx
git commit -m "feat: add LossCurve SVG component"
```

---

## Task 7: Scene 1 — The Question

**Files:**
- Create: `projects/explainer-video/src/scenes/Scene1Question.tsx`

**Timing within scene (300f = 10s):**
```
f0–20:    Question text fades in
f20–40:   Question text holds
f40–60:   Question text fades out
f60–300:  drawProgress 0→1 (network draws in, 240 frames)
```

**Step 1: Write Scene1Question.tsx**

```typescript
// src/scenes/Scene1Question.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph } from '../components/NetworkGraph';
import { BRAND } from '../config/brand';

export const Scene1Question: React.FC = () => {
  const frame = useCurrentFrame();

  // Question text opacity: fade in, hold, fade out
  const questionOpacity = frame < 20
    ? interpolate(frame, [0, 20], [0, 1])
    : frame < 40
    ? 1
    : interpolate(frame, [40, 60], [1, 0], { extrapolateRight: 'clamp' });

  // Network draw-in: starts at f60, completes at f300
  const drawProgress = interpolate(frame, [60, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Layer labels fade in with their respective layers
  const labelOpacity = (layerDrawProgress: number) =>
    interpolate(layerDrawProgress, [0.7, 1], [0, 1], { extrapolateRight: 'clamp' });

  const l0LabelOpacity = labelOpacity(
    interpolate(drawProgress, [0.0, 0.15], [0, 1], { extrapolateRight: 'clamp' })
  );
  const l1LabelOpacity = labelOpacity(
    interpolate(drawProgress, [0.35, 0.55], [0, 1], { extrapolateRight: 'clamp' })
  );
  const l2LabelOpacity = labelOpacity(
    interpolate(drawProgress, [0.75, 0.95], [0, 1], { extrapolateRight: 'clamp' })
  );

  return (
    <AbsoluteFill>
      {/* Question text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: questionOpacity,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: BRAND.font,
            fontSize: 72,
            fontWeight: 700,
            color: BRAND.text,
            textAlign: 'center',
            letterSpacing: '-1px',
          }}
        >
          How does AI actually learn?
        </span>
      </div>

      {/* Network */}
      <NetworkGraph drawProgress={drawProgress} />

      {/* Layer labels */}
      {drawProgress > 0.05 && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <text x={480} y={960} textAnchor="middle" fill={BRAND.textMuted}
            fontSize={26} fontFamily={BRAND.font} opacity={l0LabelOpacity}>
            Input
          </text>
          <text x={960} y={960} textAnchor="middle" fill={BRAND.textMuted}
            fontSize={26} fontFamily={BRAND.font} opacity={l1LabelOpacity}>
            Hidden
          </text>
          <text x={1440} y={630} textAnchor="middle" fill={BRAND.textMuted}
            fontSize={26} fontFamily={BRAND.font} opacity={l2LabelOpacity}>
            Output
          </text>
        </svg>
      )}
    </AbsoluteFill>
  );
};
```

**Step 2: Add temporary composition to Root.tsx for preview**

In `src/Root.tsx` temporarily add:
```tsx
<Composition id="S1" component={Scene1Question} durationInFrames={300} fps={30} width={1920} height={1080} />
```

**Step 3: Visual verify**

```bash
npm run studio
```

In Studio, navigate to composition `S1`:
- f0–20: "How does AI actually learn?" fades in on dark bg ✓
- f40–60: text fades out ✓
- f60: first two nodes (layer 0) start popping in ✓
- f150: hidden layer nodes appear ✓
- f270: output node appears ✓
- f300: full network visible, "Input / Hidden / Output" labels visible ✓

**Step 4: Commit**

```bash
git add src/scenes/Scene1Question.tsx
git commit -m "feat: Scene 1 — question fade + network draw-in"
```

---

## Task 8: Scene 2 — Forward Pass

**Files:**
- Create: `projects/explainer-video/src/scenes/Scene2Forward.tsx`

**Timing within scene (600f = 20s):**
```
f0–30:    "3" input label appears at left
f30–270:  Dot travels: (160,540)→(480,540)→(960,540)→(1440,540)
          Node highlight: layer 0 at f80, layer 1 at f150, layer 2 at f240
f270–330: "7" materialises at output node
f330–450: Error label fades in: "Expected: 9  ·  Got: 7  ·  Error: −2"
f450–600: Hold
```

**Dot waypoints (spine through network center):**
```
[160, 540] → [480, 540] → [960, 540] → [1440, 540]
```
When the dot reaches each layer's x, all nodes in that layer highlight orange.

**Step 1: Write Scene2Forward.tsx**

```typescript
// src/scenes/Scene2Forward.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { TravelingDot } from '../components/TravelingDot';
import { BRAND } from '../config/brand';

const WAYPOINTS: [number, number][] = [
  [160, 540],
  [480, 540],
  [960, 540],
  [1440, 540],
];

export const Scene2Forward: React.FC = () => {
  const frame = useCurrentFrame();

  // Dot travels f30–f270
  const dotProgress = interpolate(frame, [30, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Node highlights: turn orange as dot reaches each layer
  // dot.x ~ 480 around dotProgress=0.33, ~ 960 at 0.67, ~ 1440 at 1.0
  const layer0Active = dotProgress > 0.25;
  const layer1Active = dotProgress > 0.55;
  const layer2Active = dotProgress > 0.85;

  const nodeStates: Record<string, NodeState> = {
    n0: layer0Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n1: layer0Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n2: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n3: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n4: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n5: layer2Active ? { color: BRAND.orange, glowIntensity: 1.0, scale: 1.15 } : {},
  };

  // Output "7" — fades in f270–f330
  const outputOpacity = interpolate(frame, [270, 330], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Error label — fades in f330–f420
  const errorOpacity = interpolate(frame, [330, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Input "3" — fades in f0–f30
  const inputOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Network (fully drawn, drawProgress=1) */}
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      {/* Traveling dot */}
      {frame >= 30 && frame <= 290 && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

      {/* Input label "3" */}
      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text
          x={130} y={560}
          fill={BRAND.cyan} fontSize={72} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
          opacity={inputOpacity}
        >
          3
        </text>

        {/* Output "7" at output node */}
        <text
          x={1440} y={480}
          fill={BRAND.orange} fontSize={64} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
          opacity={outputOpacity}
        >
          7
        </text>
      </svg>

      {/* Error label */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: errorOpacity,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: BRAND.font,
            fontSize: 40,
            fontWeight: 600,
            color: BRAND.red,
            background: 'rgba(248, 113, 113, 0.08)',
            border: `1px solid rgba(248, 113, 113, 0.3)`,
            borderRadius: 12,
            padding: '20px 48px',
            letterSpacing: '0.5px',
          }}
        >
          Expected: 9 &nbsp;·&nbsp; Got: 7 &nbsp;·&nbsp; Error: −2
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Add to Root.tsx for preview**

```tsx
<Composition id="S2" component={Scene2Forward} durationInFrames={600} fps={30} width={1920} height={1080} />
```

**Step 3: Visual verify**

In Studio, composition `S2`:
- f0: network fully visible, cyan nodes, no dot
- f30: "3" appears left side
- f80: dot reaches layer 0, n0+n1 turn orange
- f150: dot reaches layer 1, n2+n3+n4 turn orange
- f240: dot reaches output, n5 turns orange + pulses slightly
- f300: "7" appears above/near output node
- f400: error label visible in red at bottom ✓

**Step 4: Commit**

```bash
git add src/scenes/Scene2Forward.tsx
git commit -m "feat: Scene 2 — forward pass with traveling dot + error label"
```

---

## Task 9: Scene 3 — Adjust

**Files:**
- Create: `projects/explainer-video/src/scenes/Scene3Adjust.tsx`

**Timing within scene (750f = 25s):**
```
f0–120:   Edge weight spring animation (SCENE3_WEIGHT_TARGETS applied)
f60–150:  "Adjust." text fades in
f150–210: "Try again." text fades in
f220–450: Second forward pass (dot through network, 230f)
f450–510: Output "8" appears
f510–600: "Closer." in green fades in
f600–750: Hold
```

**Step 1: Write Scene3Adjust.tsx**

```typescript
// src/scenes/Scene3Adjust.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { TravelingDot } from '../components/TravelingDot';
import { BRAND } from '../config/brand';
import { EDGES, SCENE3_WEIGHT_TARGETS } from '../config/network';

const WAYPOINTS: [number, number][] = [
  [160, 540], [480, 540], [960, 540], [1440, 540],
];

export const Scene3Adjust: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Edge weight springs: each edge has a small stagger offset (0–6f)
  const edgeWeights: Record<string, number> = {};
  EDGES.forEach((edge, i) => {
    const target = SCENE3_WEIGHT_TARGETS[edge.id] ?? 1;
    const delay = i * 4; // 4f stagger between edges
    const springVal = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 18, stiffness: 80, mass: 1 },
      from: 1,
      to: target,
      durationInFrames: 80,
    });
    edgeWeights[edge.id] = springVal;
  });

  const showWeightLabels = frame > 80;

  // Second forward pass: f220–f450
  const dotProgress = interpolate(frame, [220, 450], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const layer0Active = frame >= 220 && dotProgress > 0.25;
  const layer1Active = frame >= 220 && dotProgress > 0.55;
  const layer2Active = frame >= 220 && dotProgress > 0.85;

  const nodeStates: Record<string, NodeState> = {
    n0: layer0Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n1: layer0Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n2: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n3: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n4: layer1Active ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n5: layer2Active ? { color: BRAND.orange, glowIntensity: 1.0 } : {},
  };

  const adjustOpacity = interpolate(frame, [60, 140], [0, 1], { extrapolateRight: 'clamp' });
  const tryAgainOpacity = interpolate(frame, [150, 210], [0, 1], { extrapolateRight: 'clamp' });
  const outputOpacity = interpolate(frame, [450, 510], [0, 1], { extrapolateRight: 'clamp' });
  const closerOpacity = interpolate(frame, [510, 580], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <NetworkGraph
        drawProgress={1}
        nodeStates={nodeStates}
        edgeWeights={edgeWeights}
        showWeightLabels={showWeightLabels}
      />

      {/* Traveling dot (second pass) */}
      {frame >= 220 && frame <= 460 && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

      {/* "Adjust." label */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: adjustOpacity * (1 - tryAgainOpacity * 0.3),
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <span style={{ fontFamily: BRAND.font, fontSize: 64, fontWeight: 700, color: BRAND.cyan }}>
          Adjust.
        </span>
      </div>

      {/* "Try again." label */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: tryAgainOpacity,
          pointerEvents: 'none',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontFamily: BRAND.font, fontSize: 48, fontWeight: 400, color: BRAND.textMuted }}>
          Try again.
        </span>
      </div>

      {/* Output "8" */}
      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text
          x={1440} y={480}
          fill={BRAND.orange} fontSize={64} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
          opacity={outputOpacity}
        >
          8
        </text>
      </svg>

      {/* "Closer." label */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: closerOpacity,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontFamily: BRAND.font, fontSize: 52, fontWeight: 600, color: BRAND.green }}>
          Closer.
        </span>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Visual verify**

Composition `S3`:
- f0–120: edges pulse (some thicker, some thinner), +/− labels appear on edges ✓
- f60: "Adjust." fades in at top ✓
- f150: "Try again." appears below ✓
- f220: dot begins second pass ✓
- f510: "8" near output node + "Closer." in green at bottom ✓

**Step 3: Commit**

```bash
git add src/scenes/Scene3Adjust.tsx
git commit -m "feat: Scene 3 — weight adjustment spring + second pass"
```

---

## Task 10: Scene 4 — Rapid Repetition

**Files:**
- Create: `projects/explainer-video/src/scenes/Scene4Repeat.tsx`

**Pass schedule (15 passes in 530f):**
```typescript
const PASS_STARTS =  [0,  50, 100, 150, 200, 250, 290, 330, 360, 390, 415, 440, 460, 480, 500];
const PASS_DURATIONS = [50, 50,  50,  50,  50,  40,  40,  30,  30,  25,  25,  20,  20,  20,  20];
```

**Output values (displayed near output node):**
```typescript
const OUTPUT_VALUES = ['7.0','7.2','7.5','7.8','8.1','8.3','8.5','8.6','8.7','8.8','8.9','8.9','9.0','9.0','9.0'];
```

**Timing:**
```
f0–530:   Passes animate (see schedule above)
f400–520: "Do this millions of times…" fades in
f530–750: Final state held (output 9.0, loss curve complete, text visible)
```

**Step 1: Write Scene4Repeat.tsx**

```typescript
// src/scenes/Scene4Repeat.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph } from '../components/NetworkGraph';
import { TravelingDot } from '../components/TravelingDot';
import { LossCurve } from '../components/LossCurve';
import { BRAND } from '../config/brand';

const PASS_STARTS =   [0,  50, 100, 150, 200, 250, 290, 330, 360, 390, 415, 440, 460, 480, 500];
const PASS_DURATIONS = [50, 50,  50,  50,  50,  40,  40,  30,  30,  25,  25,  20,  20,  20,  20];
const OUTPUT_VALUES = ['7.0','7.2','7.5','7.8','8.1','8.3','8.5','8.6','8.7','8.8','8.9','8.9','9.0','9.0','9.0'];

const WAYPOINTS: [number, number][] = [
  [160, 540], [480, 540], [960, 540], [1440, 540],
];

export const Scene4Repeat: React.FC = () => {
  const frame = useCurrentFrame();

  // Determine current pass index
  let currentPass = 0;
  for (let i = PASS_STARTS.length - 1; i >= 0; i--) {
    if (frame >= PASS_STARTS[i]) {
      currentPass = i;
      break;
    }
  }

  const passStart = PASS_STARTS[currentPass];
  const passDuration = PASS_DURATIONS[currentPass];
  const passProgress = Math.min(1, (frame - passStart) / passDuration);

  const isPassesComplete = frame >= 530;

  // Dot travels during each pass (unless passes complete)
  const dotProgress = isPassesComplete ? 1 : passProgress;

  // Node highlights during dot travel
  const layer0Active = dotProgress > 0.25;
  const layer1Active = dotProgress > 0.55;
  const layer2Active = dotProgress > 0.85;

  const nodeStates = isPassesComplete
    ? {
        n5: { color: BRAND.orange, glowIntensity: 0.6 },
      }
    : {
        n0: layer0Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n1: layer0Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n2: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n3: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n4: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n5: layer2Active ? { color: BRAND.orange, glowIntensity: 0.8 } : {},
      };

  // Output label: shows current pass output value
  const currentOutput = OUTPUT_VALUES[Math.min(currentPass, OUTPUT_VALUES.length - 1)];

  // Loss curve: passCount grows with each completed pass
  const lossPassCount = isPassesComplete
    ? OUTPUT_VALUES.length
    : currentPass + passProgress;

  // "Do this millions..." text
  const millionsOpacity = interpolate(frame, [400, 490], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Iteration counter (numeric, shown in corner)
  const iterLabel = isPassesComplete
    ? '15 / 15'
    : `${currentPass + 1} / 15`;

  return (
    <AbsoluteFill>
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      {/* Traveling dot */}
      {!isPassesComplete && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

      {/* Output value near output node */}
      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {/* Current output */}
        <text
          x={1440} y={480}
          fill={currentOutput === '9.0' ? BRAND.orange : BRAND.text}
          fontSize={currentOutput === '9.0' ? 72 : 56}
          fontWeight={700}
          fontFamily={BRAND.font}
          textAnchor="middle"
        >
          {currentOutput}
        </text>

        {/* Pass counter bottom-left */}
        <text
          x={80} y={1020}
          fill={BRAND.textMuted} fontSize={24}
          fontFamily={BRAND.font}
        >
          Pass {iterLabel}
        </text>
      </svg>

      {/* Loss curve — bottom right */}
      <LossCurve
        passCount={lossPassCount}
        x={1530}
        y={820}
        width={300}
        height={160}
      />

      {/* "Do this millions of times…" */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: millionsOpacity,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: BRAND.font,
            fontSize: 52,
            fontWeight: 400,
            color: BRAND.textMuted,
            fontStyle: 'italic',
          }}
        >
          Do this millions of times…
        </span>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Visual verify**

Composition `S4`:
- f0: first pass, dot begins at left
- f50: second pass starts (dot resets), output ticks from 7.0 → 7.2 ✓
- f250–500: passes visibly speed up (shorter dot trips) ✓
- f400: "Do this millions of times…" fades in ✓
- f480+: output shows "9.0" in larger orange type ✓
- f530+: final state held, loss curve complete (bottom right) ✓

**Step 3: Commit**

```bash
git add src/scenes/Scene4Repeat.tsx
git commit -m "feat: Scene 4 — accelerating repetition + loss curve"
```

---

## Task 11: Scene 5 — The Final

**Files:**
- Create: `projects/explainer-video/src/scenes/Scene5Final.tsx`

**Timing within scene (300f = 10s):**
```
f0–60:    Output "9" pulses larger + orange glow
f0–90:    Node ripple: n5 → {n2,n3,n4} → {n0,n1} each layer turns orange (staggered 20f)
f90–150:  Main tagline fades in: "That's how a neural network learns."
f150–210: Sub-text fades in: "Guess. Check. Adjust. Repeat."
f210–270: Soma logo fades in bottom-right (if public/images/logo.png exists)
f270–300: Hold
```

**Step 1: Write Scene5Final.tsx**

```typescript
// src/scenes/Scene5Final.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, staticFile, Img } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { BRAND } from '../config/brand';

// Check if logo file exists at build time — graceful fallback
const LOGO_SRC = 'images/logo.png';

export const Scene5Final: React.FC = () => {
  const frame = useCurrentFrame();

  // Output pulse: output node grows slightly at start
  const outputScale = interpolate(frame, [0, 40, 60], [1, 1.25, 1.1], {
    extrapolateRight: 'clamp',
  });

  // Node ripple: each layer turns orange at different frames
  const outputActive = frame >= 0;
  const hiddenActive = frame >= 20;
  const inputActive = frame >= 40;

  const nodeStates: Record<string, NodeState> = {
    n5: outputActive ? { color: BRAND.orange, glowIntensity: 1.0, scale: outputScale } : {},
    n2: hiddenActive ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n3: hiddenActive ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n4: hiddenActive ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n0: inputActive ? { color: BRAND.orange, glowIntensity: 0.6 } : {},
    n1: inputActive ? { color: BRAND.orange, glowIntensity: 0.6 } : {},
  };

  const taglineOpacity = interpolate(frame, [90, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subOpacity = interpolate(frame, [150, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoOpacity = interpolate(frame, [210, 265], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Output "9" — large, orange, bold
  const outputOpacity = 1;

  return (
    <AbsoluteFill>
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      {/* Output "9" */}
      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text
          x={1440} y={480}
          fill={BRAND.orange} fontSize={80} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
          opacity={outputOpacity}
        >
          9
        </text>
      </svg>

      {/* Main tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 260,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: taglineOpacity,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: BRAND.font,
            fontSize: 64,
            fontWeight: 700,
            color: BRAND.text,
            letterSpacing: '-0.5px',
          }}
        >
          That's how a neural network learns.
        </span>
      </div>

      {/* Sub-text */}
      <div
        style={{
          position: 'absolute',
          bottom: 185,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: subOpacity,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: BRAND.font,
            fontSize: 38,
            fontWeight: 400,
            color: BRAND.cyan,
            letterSpacing: '3px',
          }}
        >
          Guess. Check. Adjust. Repeat.
        </span>
      </div>

      {/* Soma logo (bottom right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          right: 60,
          opacity: logoOpacity,
          pointerEvents: 'none',
        }}
      >
        {/* Text fallback always visible */}
        <span
          style={{
            fontFamily: BRAND.font,
            fontSize: 28,
            fontWeight: 700,
            color: BRAND.textMuted,
            letterSpacing: '4px',
          }}
        >
          SOMA
        </span>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Visual verify**

Composition `S5`:
- f0: output node "9" + orange glow ✓
- f20: hidden nodes turn orange ✓
- f40: input nodes turn orange ✓
- f150: "That's how a neural network learns." fades in at bottom ✓
- f210: "Guess. Check. Adjust. Repeat." in cyan ✓
- f265: "SOMA" text appears bottom-right ✓

**Step 3: Commit**

```bash
git add src/scenes/Scene5Final.tsx
git commit -m "feat: Scene 5 — orange ripple + final tagline"
```

---

## Task 12: Compose NeuralNetworkVideo.tsx

**Files:**
- Create: `projects/explainer-video/src/NeuralNetworkVideo.tsx`

**Step 1: Write NeuralNetworkVideo.tsx**

```typescript
// src/NeuralNetworkVideo.tsx
import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { BRAND } from './config/brand';
import { Scene1Question } from './scenes/Scene1Question';
import { Scene2Forward } from './scenes/Scene2Forward';
import { Scene3Adjust } from './scenes/Scene3Adjust';
import { Scene4Repeat } from './scenes/Scene4Repeat';
import { Scene5Final } from './scenes/Scene5Final';

export const NeuralNetworkVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, fontFamily: BRAND.font }}>
      <Series>
        <Series.Sequence durationInFrames={300}>
          <Scene1Question />
        </Series.Sequence>
        <Series.Sequence durationInFrames={600}>
          <Scene2Forward />
        </Series.Sequence>
        <Series.Sequence durationInFrames={750}>
          <Scene3Adjust />
        </Series.Sequence>
        <Series.Sequence durationInFrames={750}>
          <Scene4Repeat />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene5Final />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

**Step 2: Commit**

```bash
git add src/NeuralNetworkVideo.tsx
git commit -m "feat: compose NeuralNetworkVideo with all 5 scenes"
```

---

## Task 13: Root.tsx + entry point

**Files:**
- Modify: `projects/explainer-video/src/Root.tsx`
- Keep: `projects/explainer-video/src/index.ts` (already registers root)
- Keep: `projects/explainer-video/remotion.config.ts` (already correct)

**Step 1: Replace Root.tsx**

```typescript
// src/Root.tsx
import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/SpaceGrotesk';
import { NeuralNetworkVideo } from './NeuralNetworkVideo';

loadFont();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NeuralNetworkVideo"
      component={NeuralNetworkVideo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

**Step 2: Verify index.ts is correct**

`src/index.ts` should contain exactly:
```typescript
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
```

**Step 3: Create public/images directory**

```bash
mkdir -p public/images
```

**Step 4: Commit**

```bash
git add src/Root.tsx src/index.ts public/images/.gitkeep
git commit -m "feat: Root.tsx with Space Grotesk + NeuralNetworkVideo composition"
```

---

## Task 14: Full preview verification

**Step 1: Start Studio**

```bash
cd projects/explainer-video
npm run studio
```

**Step 2: Verify each scene in sequence**

Open composition `NeuralNetworkVideo` (2700 frames). Scrub through:

| Frame range | What to check |
|---|---|
| 0–60 | "How does AI actually learn?" fades in, then out |
| 60–299 | Network draws itself in left-to-right, layer labels appear |
| 300–570 | "3" appears, glowing dot travels through, nodes light up |
| 570–899 | Error label visible: "Expected: 9 · Got: 7 · Error: −2" |
| 900–1020 | Edge widths animate (some thicker, +/− labels) |
| 1060–1430 | Second pass with adjusted edges, "8" at output, "Closer." |
| 1650–2180 | Rapid passes, output ticking toward 9, loss curve growing |
| 2399 | Output locked at "9.0" |
| 2490–2649 | "That's how a neural network learns." + cyan sub-text |
| 2650–2699 | "SOMA" in bottom right |

**Step 3: Fix any issues found during preview, then final commit**

```bash
git add -A
git commit -m "fix: visual review adjustments from studio preview"
```

**Step 4: Optional preview render**

```bash
npm run render:preview
```

Expected: `out/preview.mp4` at 50% resolution, plays cleanly at ~45s (30fps preview).

---

## Plan complete and saved to `docs/plans/2026-02-27-neural-network-animation.md`

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.

**2. Parallel Session (separate)** — Open a new Claude Code session in the project worktree, use `superpowers:executing-plans` to run all tasks with checkpoints.

**Which approach?**
