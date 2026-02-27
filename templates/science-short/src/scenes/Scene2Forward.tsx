// src/scenes/Scene2Forward.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { TravelingDot } from '../components/TravelingDot';
import { BRAND } from '../config/brand';

const WAYPOINTS: [number, number][] = [
  [160, 540], [480, 540], [960, 540], [1440, 540],
];

export const Scene2Forward: React.FC = () => {
  const frame = useCurrentFrame();

  const dotProgress = interpolate(frame, [30, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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

  const inputOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const outputOpacity = interpolate(frame, [270, 330], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const errorOpacity = interpolate(frame, [330, 420], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      {frame >= 30 && frame <= 290 && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

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
        <text
          x={1440} y={480}
          fill={BRAND.orange} fontSize={64} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
          opacity={outputOpacity}
        >
          7
        </text>
      </svg>

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
            whiteSpace: 'nowrap',
          }}
        >
          Expected: 9 &nbsp;·&nbsp; Got: 7 &nbsp;·&nbsp; Error: −2
        </div>
      </div>
    </AbsoluteFill>
  );
};
