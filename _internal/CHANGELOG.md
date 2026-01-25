# Toolkit Changelog

All notable changes to claude-code-video-toolkit.

> Releases are automated via GitHub Actions. See `.github/workflows/release.yml`.

---

## 2026-01-25 (v0.9.2)

### Added
- **Per-scene voiceover generation** - New recommended workflow for audio
  - `voiceover.py --scene-dir` processes all `.txt` files in a directory
  - `voiceover.py --concat` joins scene audio for SadTalker narrator
  - Each scene's `<Audio>` starts at frame 0 within its `Series.Sequence`
  - Regenerate individual scenes without re-doing the whole video
  - Scene durations match audio naturally (no manual offset calculations)

- **Sprint-review template per-scene audio support**
  - `audioFile` field on `DemoConfig`, `info`, `overview`, `summary`
  - SprintReview.tsx renders per-scene `<Audio>` elements
  - Backward compatible: global voiceover track still works

- **Updated `/generate-voiceover` command**
  - Detects `public/audio/scenes/*.txt` and offers per-scene mode
  - Per-scene is now the default when scene scripts exist
  - Concat option for SadTalker integration

### Changed
- Updated documentation (CLAUDE.md, README.md, getting-started.md)

---

## 2025-12-30 (v0.7.0)

### Added
- **`tools/dewatermark.py`** - AI-powered watermark removal using ProPainter
  - Cloud GPU processing via RunPod serverless (~$0.05-0.30/video)
  - Local processing for NVIDIA GPU users (8GB+ VRAM)
  - Auto resize-ratio: 1.0 for <30s, 0.75 for <1min, 0.5 for longer
  - Chunked processing for long videos with overlap stitching
  - Cloudflare R2 for reliable file transfer
  - Automated `--setup` for one-command RunPod configuration
  - Presets: notebooklm, tiktok, sora, stock-br, stock-bl, stock-center

- **`tools/locate_watermark.py`** - Helper tool for finding watermark coordinates
  - Coordinate grid overlay for visual identification
  - Region verification across multiple frames
  - Preset support for common watermarks
  - Requires ImageMagick (`brew install imagemagick`)

- **`tools/notebooklm_brand.py`** - Post-processing for NotebookLM videos
  - Trims NotebookLM visual outro while preserving full audio
  - Adds custom branded outro with logo and URL
  - Handles freeze-frame bridging when audio exceeds video

- **Docker infrastructure** for RunPod serverless (`docker/runpod-propainter/`)
  - Dockerfile, handler.py, README
  - Public image available for quick deployment

- **Documentation**
  - `docs/optional-components.md` - ML component installation guide
  - `docs/runpod-setup.md` - Cloud GPU setup guide

### Changed
- ElevenLabs TTS: Added `eleven_v3` (alpha) model option
- Updated `CLAUDE.md` with dewatermark and locate_watermark documentation
- Updated `.env.example` with RunPod and R2 configuration

---

## 2025-12-28 (v0.6.0)

### Added
- **`redub.py --sync`** - Word-level time remapping for TTS synchronization
  - Uses ElevenLabs `convert_with_timestamps` API for character-level alignment
  - Uses Scribe word-level timestamps from original audio
  - Builds segment mapping (configurable via `--segment-size`, default: 15 words)
  - Applies variable speed per segment via FFmpeg filtergraph
  - Fixes audio drift when TTS voice speaks at different pace than original
  - Solves: TTS often starts fast and ends slow, causing 3-4+ second drift

### Changed
- Updated `CLAUDE.md` with Redub Sync Mode documentation
- TTS duration now measured via ffprobe (more accurate than timestamp data)

---

## 2025-12-28 (v0.5.0)

### Added
- **`tools/addmusic.py`** - Add background music to existing videos
  - Generate music via ElevenLabs or use existing audio file
  - Options: `--music-volume`, `--fade-in`, `--fade-out`
  - Works on any video file without requiring a project structure

### Changed
- Updated `CLAUDE.md` with addmusic documentation

---

## 2025-12-28 (v0.4.0)

### Added
- **`/redub` command** - Redub existing videos with a different voice
  - Guided workflow for voice selection and transcript handling
  - Supports transcript review/editing before TTS generation
  - Works on any video file without requiring a project structure

- **`tools/redub.py`** - Voice replacement utility tool
  - Extracts audio from video (FFmpeg)
  - Transcribes audio to text (ElevenLabs Scribe STT)
  - Generates new audio with target voice (ElevenLabs TTS)
  - Replaces audio track in video (FFmpeg)
  - Options: `--save-transcript`, `--transcript`, `--keep-temp`, `--speed`
  - Warns about duration mismatches between original and new audio

- **Utility tools concept** - Documented distinction between project tools and utility tools
  - Project tools (voiceover, music, sfx): Used during video creation workflow
  - Utility tools (redub): Quick transformations on existing videos, no project needed

### Changed
- Updated `CLAUDE.md` with utility tools documentation
- Updated Python Tools section to include redub

---

## 2025-12-20

### Added
- **GitHub Actions release automation** (`.github/workflows/release.yml`)
  - Tag-triggered releases (`v*` tags)
  - Manual dispatch option with version input
  - Auto-generates changelog from commits since last tag
  - Reads version from `toolkit-registry.json`

- **`/versions` command** - Check dependency versions and toolkit updates
  - Detects Remotion package version mismatches in projects
  - Compares local toolkit version against GitHub releases
  - Offers to fix version mismatches by pinning and reinstalling
  - Documents common issues and prevention strategies

### Fixed
- **Remotion version mismatch** in digital-samba-free-intro project
  - Pinned all Remotion packages to 4.0.387 (was mixing 4.0.383 and 4.0.387)
  - Removed `^` prefix to prevent future drift

---

## 2025-12-10

### Added
- **`/scene-review` command** - Dedicated scene-by-scene review with Remotion Studio
  - Starts Remotion Studio for visual verification
  - Walks through scenes one by one (not summary tables)
  - Generic - works with any template's config
  - `/video` now delegates to `/scene-review` when phase is `review`
  - `/generate-voiceover` warns if review not complete
  - Fixes: Review kept getting skipped because `/video` command was too long

### Changed
- **Consolidated tracking files** - Simplified from 4 files to 3:
  - `ROADMAP.md` - What we're building (removed duplicate "Next Actions" and "In Progress" sections)
  - `BACKLOG.md` - What we might build (removed all implemented items, now only future ideas)
  - `CHANGELOG.md` - What we built (historical record)
  - Removed `FEEDBACK.md` - Evolution principles moved to `docs/contributing.md`
- Created `docs/contributing.md` with evolution principles and contribution workflow

### Fixed
- **Slash commands not loading** - Renamed `/skill` to `/skills` to avoid conflict with built-in `Skill` tool. The naming collision was silently preventing ALL custom commands from loading. Bug reported to Anthropic.

### Removed
- **`/review` command** - Clashed with Claude Code's built-in PR review command. Replaced by `/scene-review`.

### Added
- **Animation components** (`lib/components/`)
  - Envelope - 3D envelope with opening flap animation, configurable message
  - PointingHand - Animated hand emoji with directional slide-in and pulse effect
- **`/contribute` command** - Guided contribution workflow
  - Report issues via `gh issue create`
  - Submit PRs for improvements
  - Share skills and templates
  - Safety checks to exclude private project work
- **Evolution narrative** across all commands
  - Consistent "## Evolution" section in each command
  - Local improvement workflow
  - Remote contribution links (GitHub issues + PRs)
  - Command history tracking
- **Template evolution guidance** in `/template` command
  - How to add features to existing templates
  - Template maturity indicators
  - Pattern extraction to shared lib/
- **Product demo template README** (`templates/product-demo/README.md`)
  - Quick start guide, configuration, project structure
  - All 7 scene types documented with examples
  - Narrator PiP and demo chrome options

### Changed
- **`projects/` now fully gitignored** - User video work stays completely private
  - Only `.gitkeep` is tracked to preserve directory structure
  - Safe to contribute without exposing project content
- **New `examples/` directory** for shareable showcase projects
  - Configs, scripts, and docs are tracked
  - Large media files (mp4, mp3) are gitignored
  - Each example includes `ASSETS-NEEDED.md` documenting required media
- **`/contribute` now supports example projects** (Option 5)
  - Guides copying from projects/ to examples/
  - Auto-generates ASSETS-NEEDED.md
  - Creates README with quick start instructions
  - **Contributor recognition** with backlinks to website/org
- **CONTRIBUTORS.md** - Recognition for organizations and individuals who share examples
- **Documentation updates**
  - `docs/getting-started.md` - Updated for `/video` command, added multi-session workflow
  - `docs/creating-brands.md` - Updated for `/brand` command integration
- **Renamed `skills-registry.json` → `toolkit-registry.json`**
  - Consistent format across all entries (path, description, status, created, updated)
  - Added `components` section for shared lib/components
  - Synced with actual commands (7), templates (2), components (9)

---

## 2025-12-09

### Added
- **Multi-session project system** (`lib/project/`)
  - `types.ts` - TypeScript schema for project.json
  - `README.md` - Documentation for project lifecycle and phases
  - Projects now track: phase, scenes, assets, audio, session history
  - Filesystem reconciliation (compares intent vs reality)
  - Auto-generated CLAUDE.md per project for instant context

- **Unified commands** - Context-aware entry points that list existing items or create new:
  - `/video` - Replaces `/new-video`. Scans projects, offers resume or new
  - `/brand` - Replaces `/new-brand`. Lists brands, edit or create new
  - `/template` - Lists templates or creates new ones (copy, minimal, from project)
  - `/skill` - Lists installed skills or creates new ones

### Changed
- **Command pattern unified** - All domain commands now scan first, then offer actions
- Commands integrate with project.json for state tracking
- README.md updated with new commands and multi-session workflow

### Removed
- `/new-video` - Replaced by `/video`
- `/new-brand` - Replaced by `/brand`

### Notes
- After creating/modifying commands or skills, restart Claude Code to load changes

---

## 2025-12-09

### Added
- **Shared component library** (`lib/`)
  - `lib/theme/` - ThemeProvider, useTheme, createStyles, type definitions
  - `lib/components/` - Reusable video components:
    - AnimatedBackground (supports subtle, tech, warm, dark variants)
    - SlideTransition (fade, zoom, slide-up, blur-fade)
    - Label (floating badge with optional JIRA ref)
    - Vignette (cinematic edge darkening)
    - LogoWatermark (corner branding)
    - SplitScreen (side-by-side video layout)
    - NarratorPiP (picture-in-picture presenter - needs refinement)
  - `lib/index.ts` - Unified exports for templates

### Changed
- **Templates now import from shared library**
  - sprint-review: Uses lib components via re-exports
  - product-demo: Uses lib components (keeps local NarratorPiP for different API)
  - Both templates use shared ThemeProvider from lib/theme
  - Deleted duplicate component files from templates
- Updated ROADMAP.md - Shared component library marked complete
- Updated BACKLOG.md - Added NarratorPiP API refinement task

---

## 2025-12-09 (earlier)

### Added
- **Product demo template** (`templates/product-demo/`)
  - Scene-based composition (title, problem, solution, demo, stats, CTA)
  - Config-driven content via `demo-config.ts`
  - Dark tech aesthetic with animated background
  - Narrator PiP (picture-in-picture presenter)
  - Browser/terminal chrome for demo videos
  - Stats cards with spring animations
- **`/new-brand` command** - guided brand profile creation
  - Extract colors from website URL
  - Manual color entry with palette generation
  - Logo and voice configuration guidance
- **Digital Samba brand profile** (`brands/digital-samba/`)
- **Template-brand integration**
  - Brand loader utility (`lib/brand.ts`)
  - `brand.ts` in each template (generated at project creation)
  - `project.json` for tracking project metadata
  - Brand generator script (`lib/generate-brand-ts.ts`)
- **`/new-video` command** - unified project creation wizard
  - Choose template (sprint-review, product-demo)
  - Choose brand from available brands
  - **Scene-centric workflow:**
    - Content gathering (URLs, notes, paste)
    - Claude proposes scene breakdown
    - Interactive scene refinement
    - Scene types: title, overview, demo, split-demo, stats, credits, problem, solution, feature, cta
    - Visual types: `[DEMO]`, `[SCREENSHOT]`, `[EXTERNAL VIDEO]`, `[SLIDE]`
  - Generates VOICEOVER-SCRIPT.md with narration and asset checklist
  - Creates project.json with scene tracking
  - Guides through asset creation phase
  - Ongoing project support (resume any project)

### Changed
- **Replaced `/new-sprint-video` with `/new-video`** - single entry point for all templates
- Templates now load theme from `brand.ts` instead of hardcoded values
- Updated CLAUDE.md with new workflow and commands
- Updated ROADMAP.md - Phase 3 template-brand integration complete
- **Added Video Timing section to CLAUDE.md** - pacing rules, scene durations, timing calculations
- **Removed `/convert-asset` from backlog** - FFmpeg skill handles this conversationally
- **Removed `/sync-timing` from backlog** - timing knowledge now in CLAUDE.md

---

## 2025-12-08

### Added
- **Open source release** - Published to GitHub at digitalsamba/claude-code-video-toolkit
- **Brand profiles system** (`brands/`)
  - `brand.json` for colors, fonts, typography
  - `voice.json` for ElevenLabs voice settings
  - `assets/` for logos and backgrounds
  - Default brand profile included
- **Documentation** (`docs/`)
  - `getting-started.md` - First video walkthrough
  - `creating-brands.md` - Brand profile guide
  - `creating-templates.md` - Template creation guide
- **Environment variable support**
  - `ELEVENLABS_VOICE_ID` - Set voice ID via env var
  - Falls back to `_internal/skills-registry.json` if not set
- `/generate-voiceover` command - guided ElevenLabs TTS generation
- `/record-demo` command - guided Playwright browser recording
- Interactive recording stop controls (Escape key, Stop button)
- Window scaling for laptop screens (`--scale` option, default 0.75)
- FFmpeg skill (beta) - common video/audio conversion commands
- Playwright recording skill (beta) - browser demo capture
- Playwright infrastructure (`playwright/`) with recording scripts
- Python tools: `voiceover.py`, `music.py`, `sfx.py`
- Skills registry for centralized config
- README.md, LICENSE (MIT), CONTRIBUTING.md
- `.env.example` template

### Changed
- **Directory restructure for open source:**
  - `templates/` - Video templates (moved from root)
  - `projects/` - User video projects (moved from root)
  - `brands/` - Brand profiles (new)
  - `assets/` - Shared assets (consolidated)
  - `_internal/` - Toolkit metadata (renamed from `_toolkit/`)
- Updated `/new-sprint-video` command paths
- `tools/config.py` reads from `_internal/` and supports env vars
- Playwright recordings output at 30fps (matches Remotion)

### Fixed
- Removed hardcoded voice ID from committed files
- Proper `.gitignore` for secrets and build artifacts
- FFmpeg trim command syntax (use `-to` not `-t` for end time)
- Playwright double navigation issue
- Recording frame rate mismatch (was 25fps, now 30fps)

---

## 2025-12-04

### Added
- Sprint review template (`templates/sprint-review/`)
  - Theme system with colors, fonts, spacing
  - Config-driven content via `sprint-config.ts`
  - Slide components: Title, Overview, Summary, EndCredits
  - Demo components: DemoSection, SplitScreen
  - NarratorPiP component for picture-in-picture narrator
  - Audio integration (voiceover, background music, SFX)
- `/new-sprint-video` slash command for guided project creation
- Initial workspace setup
- Remotion skill documentation
- ElevenLabs skill documentation
- First video project: sprint-review-cho-oyu
- Voice cloning workflow with ElevenLabs
