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

  const edgeWeights: Record<string, number> = {};
  EDGES.forEach((edge, i) => {
    const target = SCENE3_WEIGHT_TARGETS[edge.id] ?? 1;
    const delay = i * 4;
    edgeWeights[edge.id] = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 18, stiffness: 80, mass: 1 },
      from: 1,
      to: target,
      durationInFrames: 80,
    });
  });

  const showWeightLabels = frame > 80;

  const dotProgress = interpolate(frame, [220, 450], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
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

      {frame >= 220 && frame <= 460 && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

      <div style={{
        position: 'absolute', top: 120, left: '50%',
        transform: 'translateX(-50%)',
        opacity: adjustOpacity, pointerEvents: 'none', textAlign: 'center',
      }}>
        <span style={{ fontFamily: BRAND.font, fontSize: 64, fontWeight: 700, color: BRAND.cyan }}>
          Adjust.
        </span>
      </div>

      <div style={{
        position: 'absolute', top: 210, left: '50%',
        transform: 'translateX(-50%)',
        opacity: tryAgainOpacity, pointerEvents: 'none', textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontFamily: BRAND.font, fontSize: 48, fontWeight: 400, color: BRAND.textMuted }}>
          Try again.
        </span>
      </div>

      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text x={1440} y={480} fill={BRAND.orange} fontSize={64} fontWeight={700}
          fontFamily={BRAND.font} textAnchor="middle" opacity={outputOpacity}>
          8
        </text>
      </svg>

      <div style={{
        position: 'absolute', bottom: 160, left: '50%',
        transform: 'translateX(-50%)',
        opacity: closerOpacity, pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontFamily: BRAND.font, fontSize: 52, fontWeight: 600, color: BRAND.green }}>
          Closer.
        </span>
      </div>
    </AbsoluteFill>
  );
};
