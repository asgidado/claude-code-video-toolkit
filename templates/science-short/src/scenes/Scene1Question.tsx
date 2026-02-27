// src/scenes/Scene1Question.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph } from '../components/NetworkGraph';
import { BRAND } from '../config/brand';

export const Scene1Question: React.FC = () => {
  const frame = useCurrentFrame();

  const questionOpacity = frame < 20
    ? interpolate(frame, [0, 20], [0, 1])
    : frame < 40
    ? 1
    : interpolate(frame, [40, 60], [1, 0], { extrapolateRight: 'clamp' });

  const drawProgress = interpolate(frame, [60, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const l0LabelOpacity = interpolate(drawProgress, [0.1, 0.25], [0, 1], { extrapolateRight: 'clamp' });
  const l1LabelOpacity = interpolate(drawProgress, [0.45, 0.6], [0, 1], { extrapolateRight: 'clamp' });
  const l2LabelOpacity = interpolate(drawProgress, [0.8, 0.95], [0, 1], { extrapolateRight: 'clamp' });

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
      <svg
        width={1920} height={1080}
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
    </AbsoluteFill>
  );
};
