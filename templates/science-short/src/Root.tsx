// src/Root.tsx
// ─────────────────────────────────────────────────────────────────────────────
// science-short template
//
// CUSTOMIZE:
//  1. Change the font import if you're using a different Google Font
//  2. Update durationInFrames to match your scene total (sum of all scenes × 30)
//  3. The composition id "ScienceShort" can stay as-is for the render script
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/SpaceGrotesk';
import { ScienceShort } from './ScienceShort';

loadFont();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ScienceShort"
      component={ScienceShort}
      durationInFrames={2700}  // 90s @ 30fps — update to match your scene total
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
