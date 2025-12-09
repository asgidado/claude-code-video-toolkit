# Video Toolkit Roadmap

This document tracks the development of claude-code-video-toolkit.

## Vision

An open-source, AI-native video production workspace for Claude Code, featuring:
- Reusable templates for common video types
- Brand profiles for consistent visual identity
- Claude skills providing deep domain knowledge
- Automated asset pipelines (recording, conversion, audio generation)
- Slash commands for guided workflows

**Repository:** https://github.com/digitalsamba/claude-code-video-toolkit

---

## Current Status

**Phase:** 3 - Templates & Brands
**Focus:** Extracting reusable templates, building brand system

---

## Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Sprint review template with theme system
- [x] Config-driven video content
- [x] `/new-sprint-video` slash command
- [x] Narrator PiP component
- [x] Remotion skill (stable)
- [x] ElevenLabs skill (stable)

### Phase 2: Skills & Automation ✅ COMPLETE

**Skills:**
- [x] FFmpeg skill (beta) - common video/audio conversions
- [x] Playwright recording skill (beta) - browser demo capture
- [x] Review and validate FFmpeg skill
- [x] Review and validate Playwright skill

**Python Tools:**
- [x] `voiceover.py` - CLI for ElevenLabs TTS generation
- [x] `music.py` - CLI for background music generation
- [x] `sfx.py` - CLI for sound effects with presets
- [x] `config.py` - Shared configuration (env vars + registry fallback)

**Commands:**
- [x] `/generate-voiceover` - streamlined audio generation
- [x] `/record-demo` - guided Playwright recording
- [ ] `/video-status` - project dashboard (deferred to Phase 4)

**Infrastructure:**
- [x] Playwright recording setup (`playwright/`)
- [x] Centralize voice ID (env var with registry fallback)

### Phase 2.5: Open Source Release ✅ COMPLETE

- [x] Directory restructure for public release
  - `templates/` - video templates
  - `projects/` - user video projects
  - `brands/` - brand profiles
  - `docs/` - documentation
  - `_internal/` - toolkit metadata (renamed from `_toolkit/`)
- [x] Brand profiles system (`brands/default/`)
  - `brand.json` - colors, fonts, typography
  - `voice.json` - ElevenLabs voice settings
  - `assets/` - logos, backgrounds
- [x] Secrets audit and `.gitignore`
- [x] Environment variable support (`ELEVENLABS_VOICE_ID`)
- [x] README, LICENSE (MIT), CONTRIBUTING.md
- [x] Documentation (`docs/getting-started.md`, `creating-brands.md`, `creating-templates.md`)
- [x] GitHub repo: digitalsamba/claude-code-video-toolkit
- [x] Initial commit and push

### Phase 3: Templates & Brands 🔄 IN PROGRESS

**Brand Profiles:**
- [x] Default brand profile
- [ ] Digital Samba brand profile (public example)
  - [ ] Extract colors from digitalsamba.com
  - [ ] Add DS logos to `brands/digital-samba/assets/`
  - [ ] Configure voice settings
- [ ] `/new-brand` command - guided brand creation
  - [ ] Mine colors/fonts from URL
  - [ ] Interactive color picker
  - [ ] Logo upload guidance
  - [ ] Voice selection

**Templates:**
- [ ] Product demo template (extract from digital-samba-skill-demo)
- [ ] `/new-marketing-video` command
- [ ] Shared component library (workspace-level)
- [ ] Tutorial template
- [ ] Changelog/release notes template

**Template-Brand Integration:**
- [ ] Templates load brand from config
- [ ] Brand override per-project

### Phase 4: Polish & Advanced

**Commands:**
- [ ] `/video-status` - project dashboard
- [ ] `/convert-asset` - FFmpeg helper
- [ ] `/sync-timing` - voiceover/demo timing calculator

**Output & Accessibility:**
- [ ] Multi-format output (MP4, WebM, GIF, social formats)
- [ ] Subtitle generation from voiceover scripts
- [ ] Thumbnail auto-generation
- [ ] Pre-render validation command

**Skills:**
- [ ] Video accessibility skill
- [ ] Terminal recording skill (asciinema)
- [ ] Video timing skill

---

## Skill Maturity Levels

| Status | Meaning |
|--------|---------|
| **draft** | Just created, untested, may have errors |
| **beta** | Functional, needs real-world validation |
| **stable** | Battle-tested, well-documented, recommended |

### Current Skill Status

| Skill | Status | Notes |
|-------|--------|-------|
| remotion | stable | Core framework knowledge |
| elevenlabs | stable | Audio generation |
| ffmpeg | beta | Asset conversion |
| playwright-recording | beta | Browser demo capture |

---

## Review Process

**draft → beta:**
- Verify code examples work
- Test core functionality
- Document issues in `_internal/reviews/`
- Fix critical issues

**beta → stable:**
- Use in a real project
- Gather feedback
- Complete documentation
- No known critical issues

---

## Metrics

**Templates:** 1 (sprint-review)
**Brands:** 1 (default) + 1 planned (digital-samba)
**Skills:** 4 (2 stable, 2 beta)
**Tools:** 3 (voiceover, music, sfx)
**Commands:** 3 (new-sprint-video, record-demo, generate-voiceover)
**Example Projects:** 2 (sprint-review-cho-oyu, digital-samba-skill-demo)

---

## Next Actions

1. Create Digital Samba brand profile
2. Design `/new-brand` command
3. Extract product demo template from digital-samba-skill-demo
4. Review sprint-review template for brand integration
