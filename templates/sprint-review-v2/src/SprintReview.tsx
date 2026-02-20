import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, getStaticFiles } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { lightLeak } from '../../../lib/transitions/presentations/light-leak';

import { ThemeProvider, defaultTheme } from './config/theme';
import { sprintConfig, seconds } from './config/sprint-config';

// Core components
import { AnimatedBackground, NarratorPiP, Vignette, FilmGrain } from './components/core';
import { MazeDecoration } from '../../../lib/components';

// Slides
import { TitleSlide, OverviewSlide, SummarySlide, EndCredits } from './components/slides';

// Demos
import { DemoSection, SplitScreen } from './components/demos';

export const SprintReview: React.FC = () => {
  const { info, overview, demos, summary, audio, narrator, mazeDecoration } = sprintConfig;
  const staticFiles = getStaticFiles();

  // Helper to check if an audio file exists
  const audioExists = (path: string | undefined) =>
    path && staticFiles.some((f) => f.name === `audio/${path}`);

  // Check which global audio files exist
  const hasVoiceover = audioExists(audio.voiceoverFile);
  const hasBackgroundMusic = audioExists(audio.backgroundMusicFile);
  const hasChime = audioExists(audio.chimeFile);

  // Check for per-scene audio (any scene has audioFile configured)
  const hasPerSceneAudio =
    audioExists(info.audioFile) ||
    audioExists(overview.audioFile) ||
    audioExists(summary.audioFile) ||
    demos.some((d) => audioExists(d.audioFile));

  // Build TransitionSeries children as a flat array to handle dynamic demos
  const transitionChildren: React.ReactNode[] = [];

  // Title Card - 5 seconds
  transitionChildren.push(
    <TransitionSeries.Sequence key="title" durationInFrames={seconds(5)}>
      {audioExists(info.audioFile) && (
        <Audio src={staticFile(`audio/${info.audioFile}`)} />
      )}
      <TitleSlide />
    </TransitionSeries.Sequence>
  );

  // Title → Overview: fade
  transitionChildren.push(
    <TransitionSeries.Transition
      key="t-title-overview"
      presentation={fade()}
      timing={linearTiming({ durationInFrames: 25 })}
    />
  );

  // Overview - 15 seconds
  transitionChildren.push(
    <TransitionSeries.Sequence key="overview" durationInFrames={seconds(15)}>
      {audioExists(overview.audioFile) && (
        <Audio src={staticFile(`audio/${overview.audioFile}`)} />
      )}
      <OverviewSlide />
    </TransitionSeries.Sequence>
  );

  // Dynamic demo sections with transitions
  demos.forEach((demo, index) => {
    // Transition into this demo
    if (index === 0) {
      // Overview → First Demo: slide from right
      transitionChildren.push(
        <TransitionSeries.Transition
          key={`t-overview-demo`}
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: 20 })}
        />
      );
    } else {
      // Demo → Demo: slide from right (shorter)
      transitionChildren.push(
        <TransitionSeries.Transition
          key={`t-demo-${index}`}
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: 15 })}
        />
      );
    }

    transitionChildren.push(
      <TransitionSeries.Sequence key={`demo-${index}`} durationInFrames={seconds(demo.durationSeconds)}>
        {audioExists(demo.audioFile) && (
          <Audio src={staticFile(`audio/${demo.audioFile}`)} />
        )}
        {demo.type === 'split' ? (
          <SplitScreen
            leftVideo={demo.leftVideo!}
            rightVideo={demo.rightVideo!}
            leftLabel={demo.leftLabel}
            rightLabel={demo.rightLabel}
            bottomLabel={demo.label}
            jiraRef={demo.jiraRef}
            leftStartFrom={demo.leftStartFrom}
            rightStartFrom={demo.rightStartFrom}
            playbackRate={demo.playbackRate}
          />
        ) : (
          <DemoSection
            videoFile={demo.videoFile!}
            label={demo.label}
            jiraRef={demo.jiraRef}
            startFrom={demo.startFrom}
            playbackRate={demo.playbackRate}
          />
        )}
      </TransitionSeries.Sequence>
    );
  });

  // Last scene → Summary: warm light leak
  transitionChildren.push(
    <TransitionSeries.Transition
      key="t-to-summary"
      presentation={lightLeak({ temperature: 'warm' })}
      timing={linearTiming({ durationInFrames: 35 })}
    />
  );

  // Summary - 15 seconds
  transitionChildren.push(
    <TransitionSeries.Sequence key="summary" durationInFrames={seconds(15)}>
      {audioExists(summary.audioFile) && (
        <Audio src={staticFile(`audio/${summary.audioFile}`)} />
      )}
      <SummarySlide />
    </TransitionSeries.Sequence>
  );

  // Summary → Credits: fade
  transitionChildren.push(
    <TransitionSeries.Transition
      key="t-summary-credits"
      presentation={fade()}
      timing={linearTiming({ durationInFrames: 30 })}
    />
  );

  // End Credits - 30 seconds
  transitionChildren.push(
    <TransitionSeries.Sequence key="credits" durationInFrames={seconds(30)}>
      <EndCredits />
    </TransitionSeries.Sequence>
  );

  return (
    <ThemeProvider theme={defaultTheme}>
      <AbsoluteFill>
        {/* Persistent animated background */}
        <AnimatedBackground variant="subtle" />

        {/* Optional maze decoration in corner */}
        {mazeDecoration?.enabled && (
          <MazeDecoration
            corner={mazeDecoration.corner}
            opacity={mazeDecoration.opacity}
            scale={mazeDecoration.scale}
            primaryColor={mazeDecoration.primaryColor || defaultTheme.colors.primary}
            secondaryColor={mazeDecoration.secondaryColor || defaultTheme.colors.bgDark}
          />
        )}

        {/* Scene sequence with cinematic transitions */}
        <TransitionSeries>
          {transitionChildren}
        </TransitionSeries>

        {/* Global voiceover audio track (legacy mode - used when no per-scene audio) */}
        {hasVoiceover && !hasPerSceneAudio && (
          <Sequence from={audio.voiceoverStartFrame || 0}>
            <Audio src={staticFile(`audio/${audio.voiceoverFile}`)} />
          </Sequence>
        )}

        {/* Background music - low volume */}
        {hasBackgroundMusic && (
          <Audio
            src={staticFile(`audio/${audio.backgroundMusicFile}`)}
            volume={audio.backgroundMusicVolume || 0.15}
          />
        )}

        {/* Success chime on summary slide */}
        {hasChime && audio.chimeFrame && (
          <Sequence from={audio.chimeFrame}>
            <Audio src={staticFile(`audio/${audio.chimeFile}`)} volume={0.5} />
          </Sequence>
        )}

        {/* Narrator PiP - synced with voiceover */}
        {narrator?.enabled && (
          <Sequence from={narrator.startFrame || audio.voiceoverStartFrame || 0}>
            <NarratorPiP
              videoFile={narrator.videoFile}
              position={narrator.position}
              size={narrator.size}
            />
          </Sequence>
        )}

        {/* Cinematic overlays (render on top of everything) */}
        <Vignette intensity={0.35} />
        <FilmGrain opacity={0.05} />
      </AbsoluteFill>
    </ThemeProvider>
  );
};
