# Design: Soma Neural Network Explainer Animation

**Date:** 2026-02-27
**Project:** `projects/explainer-video`
**Template:** Custom standalone Remotion (Option A)
**Brand:** Soma (`brands/soma`)
**Duration:** ~90 seconds (2700 frames @ 30fps)
**Audience:** General public, no scientific background

---

## Brief

An animated explainer for the Soma YouTube channel explaining how a neural network learns.
Narrative arc: viewer ends understanding that learning = repeated error correction, not magic.
Text-only (no voiceover for initial build). Voiceover can be added later via `/generate-voiceover`.

---

## Project Structure

```
projects/explainer-video/
├── src/
│   ├── Root.tsx                  # Remotion entry — single Composition
│   ├── NeuralNetworkVideo.tsx    # Top-level: Series of 5 scenes + bg + logo
│   ├── config/
│   │   └── brand.ts              # Soma colors/fonts
│   ├── components/
│   │   ├── NetworkGraph.tsx      # Reusable SVG: nodes + edges with draw/weight/glow props
│   │   ├── TravelingDot.tsx      # Reusable: glowing dot interpolated between node coords
│   │   └── LossCurve.tsx         # Reusable: animated SVG polyline loss/progress curve
│   └── scenes/
│       ├── Scene1Question.tsx
│       ├── Scene2Forward.tsx
│       ├── Scene3Adjust.tsx
│       ├── Scene4Repeat.tsx
│       └── Scene5Final.tsx
├── public/images/                # soma logo (optional)
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

---

## Brand

| Token | Value |
|---|---|
| Background | `#0A0E1A` |
| Primary (cyan) | `#00C8C8` |
| Accent (orange) | `#F5A623` |
| Text | `#E2E8F0` |
| Font | Space Grotesk |

---

## Network Topology

Fixed 3-layer fully-connected graph:

```
Layer 0 (input):   2 nodes  — IDs: n0, n1
Layer 1 (hidden):  3 nodes  — IDs: n2, n3, n4
Layer 2 (output):  1 node   — ID: n5
```

9 edges total. Node coordinates are pre-calculated as fractions of the SVG viewport.
The `NetworkGraph` component accepts:

- `drawProgress` (0→1): edges stroke-dashoffset draw-in, staggered L→R per layer
- `nodeStates`: per-node `{ color, glowIntensity }` override
- `edgeWeights`: per-edge thickness multiplier (range 0.3–3×)

---

## Scene Breakdown

### Scene 1 — The Question (10s / 300f)

1. Frames 0–60: "How does AI actually learn?" fades in (center), then fades out
2. Frames 60–300: Network draws itself in left-to-right
   - Layer 0 nodes pop in (scale spring, 0→1)
   - Layer 0→1 edges stroke-draw (dashoffset)
   - Layer 1 nodes pop in (~30f delay)
   - Layer 1→2 edges stroke-draw
   - Layer 2 node pops in
3. Network settles in final position, all nodes cyan

**Technique:** SVG `strokeDasharray`/`strokeDashoffset` for edges. `spring()` for node scale.

---

### Scene 2 — Forward Pass (20s / 600f)

1. Input label "3" appears left of network
2. Glowing cyan dot travels: input→n0→n1 (hop 1), n2/n3/n4 (hop 2, fans out), n5 (hop 3)
3. Dot pauses ~8f at each node, node briefly flashes orange on arrival
4. Output node shows "7"
5. Red label fades in below: `Expected: 9 · Got: 7 · Error: −2`

**Dot path:** `cx`/`cy` interpolated between pre-calculated node coordinates.
**Glow:** SVG `<filter>` with `feGaussianBlur` + `feComposite` for bloom effect on dot and active nodes.

---

### Scene 3 — Adjust (25s / 750f)

1. All edge weights pulse simultaneously (spring to randomised targets: some thicker, some thinner)
2. Small annotation labels on a few edges: `+`, `−` to reinforce the idea
3. Text appears: "Adjust. Try again."
4. Second forward pass: dot travels through again
5. Output node shows "8"
6. Small green label: "Closer."

**Weight targets:** Pre-determined set (not random at runtime) so the animation is deterministic.
**Spring per edge:** Each edge gets independent `spring()` with staggered `delay` (0–6f per edge).

---

### Scene 4 — Rapid Repetition (25s / 750f)

1. 15 rapid forward passes, pass interval shrinks over time:
   - Passes 1–5: 50f each
   - Passes 6–10: 30f each
   - Passes 11–15: 15f each
2. Output counter ticks: 7 → 7.3 → 7.8 → 8.2 → 8.7 → 8.9 → 9 (spread across passes)
3. Loss curve (bottom-right): SVG polyline grows rightward, y-value descends toward baseline
4. Text: "Do this millions of times…" (fades in around pass 8)

**Pass driver:** `Math.floor(frame / currentInterval)` where `currentInterval` = interpolated value.
**Output counter:** mapped from pass index, not frame, so it steps cleanly.

---

### Scene 5 — The Aha (10s / 300f)

1. Output node locks to "9", pulses orange
2. All nodes transition from cyan → orange in a ripple (output → hidden → input, reverse of forward pass)
3. Tagline fades in center: "That's how a neural network learns."
4. Sub-text: "Guess. Check. Adjust. Repeat."
5. Soma logo fades in bottom-right (small, ~8% of width)

**Ripple:** Per-node orange transition staggered by layer (output first).

---

## Shared Animation Primitives

### `NetworkGraph` props
```ts
interface NetworkGraphProps {
  drawProgress: number;           // 0→1, controls edge draw-in
  nodeStates: NodeState[];        // per-node color + glow
  edgeWeights: number[];          // per-edge strokeWidth multiplier
  showWeightLabels?: boolean;     // +/- annotations on edges
  width: number;
  height: number;
}
```

### `TravelingDot` props
```ts
interface TravelingDotProps {
  path: [number, number][];       // sequence of [x, y] waypoints
  progress: number;               // 0→1 over full path
  pauseAtWaypoints?: boolean;     // pause ~8f at each node
  color?: string;
  glowRadius?: number;
}
```

### `LossCurve` props
```ts
interface LossCurveProp {
  iterations: number;             // how many data points to draw
  maxIterations: number;
  width: number;
  height: number;
}
```

---

## Constraints

- No Greek letters, no formulas
- Never use: backpropagation, gradient, weights, parameters
- Use: connections, adjust, error, closer
- Max 3 layers in network diagram
- One focal point per scene — no overcrowding
- 1920×1080, 30fps

---

## Approved

Design approved by user on 2026-02-27. Proceeding to implementation plan.
