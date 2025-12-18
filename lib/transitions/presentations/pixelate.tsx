/**
 * Pixelate Transition
 *
 * Digital pixelation/mosaic effect that dissolves the scene into blocks.
 * Creates a retro gaming or digital artifact aesthetic.
 *
 * Best for: Tech themes, retro/gaming content, digital transformations
 */
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

export type PixelateProps = {
  /** Maximum block size at peak pixelation. Default: 40 */
  maxBlockSize?: number;
  /** Include color posterization with pixelation. Default: true */
  posterize?: boolean;
  /** Pixelation pattern: 'uniform' or 'random'. Default: 'uniform' */
  pattern?: 'uniform' | 'random';
};

const PixelatePresentation: React.FC<
  TransitionPresentationComponentProps<PixelateProps>
> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const {
    maxBlockSize = 40,
    posterize = true,
    pattern = 'uniform',
  } = passedProps;

  const progress = presentationDirection === 'exiting'
    ? 1 - presentationProgress
    : presentationProgress;

  // Pixelation intensity peaks in the middle
  const pixelIntensity = useMemo(() => {
    return interpolate(progress, [0, 0.5, 1], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }, [progress]);

  // Block size calculation (starts small, gets big, then small again)
  const blockSize = useMemo(() => {
    const minSize = 1;
    return Math.max(minSize, Math.round(maxBlockSize * pixelIntensity));
  }, [maxBlockSize, pixelIntensity]);

  // Simple linear crossfade opacity (use presentationProgress directly)
  const opacity = presentationDirection === 'exiting'
    ? interpolate(presentationProgress, [0, 1], [1, 0])
    : interpolate(presentationProgress, [0, 1], [0, 1]);

  // Posterization reduces color depth via contrast/saturation manipulation
  const posterizeAmount = posterize
    ? interpolate(pixelIntensity, [0, 1], [100, 200])
    : 100;

  // Calculate scale factor for pixelation effect
  // We scale down then back up to create the blocky look
  const scaleFactor = useMemo(() => {
    if (blockSize <= 1) return 1;
    // Scale down to create larger "pixels"
    return Math.max(0.02, 1 / blockSize);
  }, [blockSize]);

  const shouldApplyEffect = pixelIntensity > 0.05;

  // Noise offset for random pattern
  const noiseTransform = useMemo(() => {
    if (pattern !== 'random' || pixelIntensity < 0.3) return '';
    const offset = Math.sin(progress * Math.PI * 4) * pixelIntensity * 5;
    return `translate(${offset}px, ${offset * 0.5}px)`;
  }, [pattern, pixelIntensity, progress]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Main pixelated content */}
      <AbsoluteFill
        style={{
          opacity,
          overflow: 'hidden',
        }}
      >
        {shouldApplyEffect ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Outer container scales back up */}
            <div
              style={{
                width: `${100 / scaleFactor}%`,
                height: `${100 / scaleFactor}%`,
                transform: `scale(${scaleFactor}) ${noiseTransform}`,
                transformOrigin: 'center center',
                imageRendering: 'pixelated',
                filter: posterize ? `contrast(${posterizeAmount}%) saturate(${150 - pixelIntensity * 50}%)` : undefined,
              }}
            >
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </AbsoluteFill>

      {/* Scanline overlay for CRT effect */}
      {pixelIntensity > 0.3 && (
        <AbsoluteFill
          style={{
            opacity: pixelIntensity * 0.25,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.4) 2px,
              rgba(0, 0, 0, 0.4) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Color banding effect for retro feel */}
      {posterize && pixelIntensity > 0.2 && (
        <AbsoluteFill
          style={{
            opacity: pixelIntensity * 0.2,
            background: `linear-gradient(
              180deg,
              rgba(0, 255, 0, 0.08) 0%,
              rgba(255, 0, 255, 0.08) 50%,
              rgba(0, 255, 255, 0.08) 100%
            )`,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Grid overlay to enhance pixel boundaries */}
      {blockSize > 8 && pixelIntensity > 0.4 && (
        <AbsoluteFill
          style={{
            opacity: pixelIntensity * 0.15,
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${blockSize}px ${blockSize}px`,
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const pixelate = (
  props: PixelateProps = {}
): TransitionPresentation<PixelateProps> => {
  return { component: PixelatePresentation, props };
};
