// src/ScienceShort.tsx
// ─────────────────────────────────────────────────────────────────────────────
// science-short template — main composition
//
// CUSTOMIZE:
//  1. Import and arrange your scenes in the <Series> below
//  2. Set durationInFrames per scene (frames = seconds × 30)
//  3. The example scenes (Scene1–5) show patterns for intro/concept/mechanism
//
// Scene types in this template:
//  intro      — Hook question that fades, then a diagram draws itself in
//  concept    — Animated SVG diagram (node graph, flow, structure)
//  mechanism  — Step-by-step process: input travels through, state changes
//
// Total frames must match Root.tsx durationInFrames.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { BRAND } from './config/brand';

// Example scenes from the neural-network explainer — use as reference.
// Replace with your own scenes or adapt these for your topic.
import { Scene1Question } from './scenes/Scene1Question';    // intro (10s)
import { Scene2Forward } from './scenes/Scene2Forward';      // mechanism (20s)
import { Scene3Adjust } from './scenes/Scene3Adjust';        // mechanism (25s)
import { Scene4Repeat } from './scenes/Scene4Repeat';        // concept (25s)
import { Scene5Final } from './scenes/Scene5Final';          // outro (10s)

export const ScienceShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, fontFamily: BRAND.font }}>
      <Series>
        {/* ── INTRO (10s) ── hook question + diagram draw-in */}
        <Series.Sequence durationInFrames={300}>
          <Scene1Question />
        </Series.Sequence>

        {/* ── MECHANISM (20s) ── first pass / demonstration */}
        <Series.Sequence durationInFrames={600}>
          <Scene2Forward />
        </Series.Sequence>

        {/* ── MECHANISM (25s) ── adjustment / correction */}
        <Series.Sequence durationInFrames={750}>
          <Scene3Adjust />
        </Series.Sequence>

        {/* ── CONCEPT (25s) ── rapid repetition / the big idea */}
        <Series.Sequence durationInFrames={750}>
          <Scene4Repeat />
        </Series.Sequence>

        {/* ── OUTRO (10s) ── tagline + brand */}
        <Series.Sequence durationInFrames={300}>
          <Scene5Final />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
