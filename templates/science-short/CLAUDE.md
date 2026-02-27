# science-short Template

A Remotion template for **short-form science explainer videos** (~60–120s). Uses animated SVG primitives — no video files required. Everything is programmatic: diagrams draw themselves, data flows through systems, metrics converge.

Born from the Soma "How a Neural Network Learns" video.

## Quick Start

```bash
cd templates/science-short
npm install
npm run studio     # Preview at localhost:3000
npm run render     # Export MP4
```

## Scene Types

| Type | Purpose | Example scene |
|------|---------|---------------|
| `intro` | Hook question + diagram draws itself in | Scene1Question |
| `mechanism` | Step-by-step: something travels through a system, state changes | Scene2Forward, Scene3Adjust |
| `concept` | The big idea — rapid repetition, convergence, accumulation | Scene4Repeat |
| `outro` | Key takeaway + brand mark | Scene5Final |

## File Structure

```
src/
├── ScienceShort.tsx        ← Main composition — arrange scenes here
├── Root.tsx                ← Remotion entry — set total durationInFrames here
├── config/
│   ├── brand.ts            ← Colors, font — edit for your brand
│   └── network.ts          ← Diagram topology — nodes, edges, positions
├── components/
│   ├── NetworkGraph.tsx    ← Reusable SVG: nodes + edges with draw-in animation
│   ├── TravelingDot.tsx    ← Glowing dot that travels through waypoints
│   └── LossCurve.tsx       ← Animated loss/convergence chart
└── scenes/
    ├── Scene1Question.tsx  ← EXAMPLE: intro scene
    ├── Scene2Forward.tsx   ← EXAMPLE: first mechanism pass
    ├── Scene3Adjust.tsx    ← EXAMPLE: adjustment / correction mechanism
    ├── Scene4Repeat.tsx    ← EXAMPLE: rapid repetition concept
    └── Scene5Final.tsx     ← EXAMPLE: outro
```

## Reusable Primitives

These components work for any science topic — not just neural networks.

### `NetworkGraph`

Draws any node-and-edge diagram. Supports:
- `drawProgress` (0→1): edges stroke-draw left-to-right, nodes pop in per-layer
- `nodeStates`: per-node color + glow (highlight active nodes)
- `edgeWeights`: per-edge stroke thickness (show importance/activation)
- `showWeightLabels`: +/− annotations on edges

Reuse for: neural nets, decision trees, protein folding, circuit diagrams, flowcharts.

### `TravelingDot`

A glowing dot that travels through a sequence of `[x, y]` waypoints. Built-in easing pauses at each node.

Reuse for: data flowing through a network, electrons moving through a circuit, signals propagating.

### `LossCurve`

An SVG polyline that grows rightward as `passCount` increases, y-value descending — showing convergence/improvement.

Reuse for: error decreasing, accuracy increasing, any metric that improves over iterations.

## Customizing for a New Topic

### 1. Update brand colors

Edit `src/config/brand.ts`:
```typescript
export const BRAND = {
  bg: '#0A0E1A',       // background
  cyan: '#00C8C8',     // primary color (nodes, lines, dot)
  orange: '#F5A623',   // accent color (active/highlighted)
  // ...
};
```

### 2. Define your diagram topology

Edit `src/config/network.ts` — change node positions, edge connections, and layer structure to match your concept:

```typescript
export const NODES: NodeDef[] = [
  { id: 'n0', x: 480, y: 400, layer: 0 },
  // ... define nodes for your diagram
];

export const EDGES: EdgeDef[] = [
  { id: 'e0', from: 'n0', to: 'n1' },
  // ... define connections
];
```

### 3. Write your scenes

Each scene is a React component that receives `useCurrentFrame()` and uses `interpolate()` / `spring()` for animation. Copy an example scene and adapt the timing and content.

### 4. Compose in ScienceShort.tsx

```tsx
<Series>
  <Series.Sequence durationInFrames={300}><MyIntroScene /></Series.Sequence>
  <Series.Sequence durationInFrames={600}><MyMechanismScene /></Series.Sequence>
  <Series.Sequence durationInFrames={300}><MyOutroScene /></Series.Sequence>
</Series>
```

Update `durationInFrames` in `Root.tsx` to match the sum.

## Timing Reference

```
frames = seconds × 30  (this template uses 30fps)

Typical scene lengths:
  intro:      300f (10s)
  mechanism:  600f (20s) — first pass
  mechanism:  750f (25s) — adjustment
  concept:    750f (25s) — rapid repetition
  outro:      300f (10s)
  ────────────────────────
  total:     2700f (90s)
```

## Audio

Place voiceover at `public/audio/voiceover.mp3` and add to `ScienceShort.tsx`:

```tsx
import { Audio, staticFile } from 'remotion';

// Inside the AbsoluteFill:
<Audio src={staticFile('audio/voiceover.mp3')} volume={1} />
```

Generate voiceover with `/generate-voiceover` from the toolkit.

## Example: Adapting for "How Diffusion Models Work"

1. Keep `NetworkGraph` — swap the topology to show: noise → denoising steps → image
2. Keep `TravelingDot` — show a pixel "clarifying" as it passes through timesteps
3. Modify `Scene3Adjust` — instead of weight springs, show noise level decreasing
4. Modify `Scene4Repeat` — show multiple diffusion steps converging to a clean image
5. Update brand colors if needed
