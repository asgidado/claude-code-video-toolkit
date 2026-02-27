// src/scenes/Scene5Final.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { BRAND } from '../config/brand';

export const Scene5Final: React.FC = () => {
  const frame = useCurrentFrame();

  const outputScale = interpolate(frame, [0, 40, 60], [1, 1.25, 1.1], {
    extrapolateRight: 'clamp',
  });

  const nodeStates: Record<string, NodeState> = {
    n5: { color: BRAND.orange, glowIntensity: 1.0, scale: outputScale },
    n2: frame >= 20 ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n3: frame >= 20 ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n4: frame >= 20 ? { color: BRAND.orange, glowIntensity: 0.7 } : {},
    n0: frame >= 40 ? { color: BRAND.orange, glowIntensity: 0.6 } : {},
    n1: frame >= 40 ? { color: BRAND.orange, glowIntensity: 0.6 } : {},
  };

  const taglineOpacity = interpolate(frame, [90, 150], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const subOpacity = interpolate(frame, [150, 210], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [210, 265], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text
          x={1440} y={480}
          fill={BRAND.orange} fontSize={80} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle"
        >
          9
        </text>
      </svg>

      <div style={{
        position: 'absolute', bottom: 260, left: '50%',
        transform: 'translateX(-50%)',
        opacity: taglineOpacity, pointerEvents: 'none',
        whiteSpace: 'nowrap', textAlign: 'center',
      }}>
        <span style={{
          fontFamily: BRAND.font, fontSize: 64, fontWeight: 700,
          color: BRAND.text, letterSpacing: '-0.5px',
        }}>
          That&apos;s how a neural network learns.
        </span>
      </div>

      <div style={{
        position: 'absolute', bottom: 185, left: '50%',
        transform: 'translateX(-50%)',
        opacity: subOpacity, pointerEvents: 'none',
        whiteSpace: 'nowrap', textAlign: 'center',
      }}>
        <span style={{
          fontFamily: BRAND.font, fontSize: 38, fontWeight: 400,
          color: BRAND.cyan, letterSpacing: '3px',
        }}>
          Guess. Check. Adjust. Repeat.
        </span>
      </div>

      <div style={{
        position: 'absolute', bottom: 48, right: 60,
        opacity: logoOpacity, pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: BRAND.font, fontSize: 28, fontWeight: 700,
          color: BRAND.cyan, letterSpacing: '4px',
        }}>
          SOMA
        </span>
      </div>
    </AbsoluteFill>
  );
};
