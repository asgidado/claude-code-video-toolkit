// src/scenes/Scene4Repeat.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { NetworkGraph, NodeState } from '../components/NetworkGraph';
import { TravelingDot } from '../components/TravelingDot';
import { LossCurve } from '../components/LossCurve';
import { BRAND } from '../config/brand';

const PASS_STARTS =    [0,  50, 100, 150, 200, 250, 290, 330, 360, 390, 415, 440, 460, 480, 500];
const PASS_DURATIONS = [50, 50,  50,  50,  50,  40,  40,  30,  30,  25,  25,  20,  20,  20,  20];
const OUTPUT_VALUES =  ['7.0','7.2','7.5','7.8','8.1','8.3','8.5','8.6','8.7','8.8','8.9','8.9','9','9','9'];

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

  const dotProgress = isPassesComplete ? 1 : passProgress;

  const layer0Active = dotProgress > 0.25;
  const layer1Active = dotProgress > 0.55;
  const layer2Active = dotProgress > 0.85;

  const nodeStates: Record<string, NodeState> = isPassesComplete
    ? { n5: { color: BRAND.orange, glowIntensity: 0.6 } }
    : {
        n0: layer0Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n1: layer0Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n2: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n3: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n4: layer1Active ? { color: BRAND.orange, glowIntensity: 0.5 } : {},
        n5: layer2Active ? { color: BRAND.orange, glowIntensity: 0.8 } : {},
      };

  const currentOutput = OUTPUT_VALUES[Math.min(currentPass, OUTPUT_VALUES.length - 1)];
  const lossPassCount = isPassesComplete ? OUTPUT_VALUES.length : currentPass + passProgress;

  const millionsOpacity = interpolate(frame, [400, 490], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const iterLabel = isPassesComplete ? '15 / 15' : `${currentPass + 1} / 15`;

  return (
    <AbsoluteFill>
      <NetworkGraph drawProgress={1} nodeStates={nodeStates} />

      {!isPassesComplete && (
        <TravelingDot waypoints={WAYPOINTS} progress={dotProgress} />
      )}

      <svg
        width={1920} height={1080}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <text
          x={1440} y={480}
          fill={currentOutput === '9' ? BRAND.orange : BRAND.text}
          fontSize={currentOutput === '9' ? 72 : 56}
          fontWeight={700}
          fontFamily={BRAND.font}
          textAnchor="middle"
        >
          {currentOutput}
        </text>
        <text x={80} y={1020} fill={BRAND.textMuted} fontSize={24} fontFamily={BRAND.font}>
          Pass {iterLabel}
        </text>
      </svg>

      <LossCurve passCount={lossPassCount} x={1530} y={820} width={300} height={160} />

      <div style={{
        position: 'absolute', top: 100, left: '50%',
        transform: 'translateX(-50%)',
        opacity: millionsOpacity, pointerEvents: 'none',
        whiteSpace: 'nowrap', textAlign: 'center',
      }}>
        <span style={{
          fontFamily: BRAND.font, fontSize: 52, fontWeight: 400,
          color: BRAND.textMuted, fontStyle: 'italic',
        }}>
          Do this millions of times…
        </span>
      </div>
    </AbsoluteFill>
  );
};
