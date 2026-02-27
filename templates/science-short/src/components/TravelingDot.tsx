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
