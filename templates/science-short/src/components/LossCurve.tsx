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
