/**
 * Animated Envelope Component
 *
 * A 3D envelope that can open/close with a rotating flap animation.
 * Useful for email delivery animations in product demos.
 *
 * @example
 * ```tsx
 * import { Envelope } from '../../../../lib/components';
 *
 * // In your component:
 * const flapOpen = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
 *
 * <Envelope
 *   width={600}
 *   height={400}
 *   flapOpen={flapOpen}
 *   message="From Digital Samba, with love"
 *   color="#f5f5dc"
 * />
 * ```
 */

import { interpolate } from 'remotion';

export interface EnvelopeProps {
  /** Width of the envelope in pixels */
  width: number;
  /** Height of the envelope body in pixels */
  height: number;
  /** Flap open state: 0 = closed (flap down), 1 = fully open (flap up) */
  flapOpen: number;
  /** Envelope color (default: cream/beige) */
  color?: string;
  /** Optional message to display on envelope body (bottom-right) */
  message?: string;
  /** Font family for the message */
  messageFont?: string;
  /** Font size for the message */
  messageFontSize?: number;
}

export const Envelope: React.FC<EnvelopeProps> = ({
  width,
  height,
  flapOpen,
  color = '#f5f5dc',
  message,
  messageFont = 'Georgia, serif',
  messageFontSize = 16,
}) => {
  const flapHeight = height * 0.4;
  // flapOpen: 0 = closed (rotated down), 1 = open (rotated up/back)
  const flapRotation = interpolate(flapOpen, [0, 1], [-180, 0]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Envelope body */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, ${color} 0%, #e8e8d0 100%)`,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      />

      {/* Inner shadow/depth */}
      <div
        style={{
          position: 'absolute',
          top: flapHeight * 0.5,
          left: 10,
          right: 10,
          bottom: 10,
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 4,
        }}
      />

      {/* Optional message on envelope */}
      {message && (
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            fontSize: messageFontSize,
            fontFamily: messageFont,
            fontStyle: 'italic',
            color: 'rgba(90, 70, 50, 0.8)',
            letterSpacing: 0.5,
          }}
        >
          {message}
        </div>
      )}

      {/* Envelope flap - positioned above envelope body, hinges from top edge */}
      <div
        style={{
          position: 'absolute',
          top: -flapHeight,
          left: 0,
          width: '100%',
          height: flapHeight,
          transformOrigin: 'bottom center',
          transform: `rotateX(${flapRotation}deg)`,
          transformStyle: 'preserve-3d',
          // When closed (flapOpen < 0.5), flap is behind; when open, flap is in front
          zIndex: flapOpen < 0.5 ? -1 : 2,
        }}
      >
        {/* Flap front - triangle: base at bottom, tip pointing up */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `linear-gradient(0deg, ${color} 0%, #e0e0c8 100%)`,
            clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
            backfaceVisibility: 'hidden',
          }}
        />
        {/* Flap back (visible when opened/rotated) */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, #c8c8b0 0%, #d8d8c0 100%)`,
            clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
            transform: 'rotateX(180deg)',
            backfaceVisibility: 'hidden',
          }}
        />
      </div>
    </div>
  );
};
