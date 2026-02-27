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
