---
description: Generate AI voiceover from script
---

# Generate Voiceover

Help me generate a voiceover for a Remotion video project using ElevenLabs TTS.

## Project Integration

Before gathering configuration, check if we're in a project context:

1. **Check for active project:**
   - Look for `project.json` in current directory or parent `projects/*/`
   - If found, read it to understand project state

2. **Check review status:**
   If project has `phase: "review"` or no `reviewStatus` on scenes:
   ```
   ⚠️  Scene review not complete.

   Generating voiceover before review risks:
   - Narration that doesn't match visuals
   - Timing mismatches
   - Wasted API credits if script needs changes

   Run `/scene-review` first to verify each scene in Remotion Studio.

   Options:
   1. Run /scene-review first (recommended)
   2. Generate voiceover anyway (not recommended)
   ```

   Only proceed if user explicitly chooses option 2.

3. **Check for per-scene scripts (preferred):**
   Look for `public/audio/scenes/*.txt` files in the project directory.

   If found:
   ```
   I see you're working on: {project.name}

   Found per-scene scripts in public/audio/scenes/ (recommended):
     - 01-title.txt (estimate: ~3s)
     - 02-overview.txt (estimate: ~15s)
     - 03-demo.txt (estimate: ~20s)
     - 04-summary.txt (estimate: ~12s)

   Total estimated: ~50 seconds of narration

   Options:
   1. Generate per-scene audio (recommended)
   2. Generate single voiceover file (legacy)
   ```

   Default to option 1 (per-scene) when scene scripts exist.

4. **If no scene scripts but VOICEOVER-SCRIPT.md exists:**
   ```
   I see you're working on: {project.name}

   Script: VOICEOVER-SCRIPT.md (ready)
   Audio status: ⬜ Not yet generated

   Options:
   1. Split into scene scripts first (recommended for iteration)
   2. Generate single voiceover file
   ```

5. **After generation completes:**
   - Update `project.json`:
     - Set `audio.voiceover.status: "present"`
     - If per-scene, set `audio.voiceover.mode: "per_scene"`
     - Transition `phase` if appropriate (review → audio → editing)
   - Add session entry
   - Regenerate project CLAUDE.md

---

## Your Tasks

1. **Detect Script Source**
   Look for scripts in this order:
   - Check for `public/audio/scenes/*.txt` files (per-scene mode)
   - Check if `VOICEOVER-SCRIPT.md` exists in the current working directory
   - Check if `VOICEOVER-SCRIPT.md` exists in parent directories (up to 3 levels)
   - If not found, ask the user to provide the script text or file path

2. **Gather Configuration**
   Use the AskUserQuestion tool to collect:

   **Question 1 - Generation Mode (if scene scripts found):**
   Options:
   - Per-scene generation (recommended) — each .txt becomes a .mp3
   - Single voiceover file (legacy)

   **Question 2 - Concat for SadTalker (if per-scene and narrator enabled):**
   Options:
   - Yes, concat for SadTalker narrator (recommended)
   - No, keep separate files only

   **Question 3 - Voice Settings (optional):**
   Options:
   - Use defaults (stability: 0.85, similarity: 0.95)
   - Customize settings

3. **Execute Voiceover Generation**

   **Per-scene mode (recommended):**
   ```bash
   cd PROJECT_DIR
   python /Users/conalmullan/work/video/tools/voiceover.py \
     --scene-dir public/audio/scenes \
     --json
   ```

   **With concat for SadTalker:**
   ```bash
   cd PROJECT_DIR
   python /Users/conalmullan/work/video/tools/voiceover.py \
     --scene-dir public/audio/scenes \
     --concat public/audio/voiceover-concat.mp3 \
     --json
   ```

   **Single-file mode (legacy):**
   ```bash
   cd PROJECT_DIR
   python /Users/conalmullan/work/video/tools/voiceover.py \
     --script "SCRIPT_PATH" \
     --output "public/audio/voiceover.mp3" \
     --json
   ```

4. **Report Results**

   **Per-scene results:**
   ```
   Per-scene audio generated:
     ✅ 01-title.mp3 (3.2s)
     ✅ 02-overview.mp3 (15.4s)
     ✅ 03-demo.mp3 (20.1s)
     ✅ 04-summary.mp3 (11.8s)

   Total: 50.5s (1515 frames @ 30fps)
   Characters: 892

   Concatenated: public/audio/voiceover-concat.mp3 (50.5s)

   Next steps:
   1. Update sprint-config.ts with audioFile for each scene
   2. If using narrator, run SadTalker with voiceover-concat.mp3
   ```

   **Single-file results:**
   ```
   Voiceover generated:
     File: public/audio/voiceover.mp3
     Duration: 50.5s (1515 frames @ 30fps)
     Characters: 892

   For your config:
     audio: { voiceoverFile: 'voiceover.mp3' }
   ```

## Tool Location

- Voiceover tool: `/Users/conalmullan/work/video/tools/voiceover.py`
- Config: `_internal/toolkit-registry.json` (voice ID)
- API Key: `.env` file (`ELEVENLABS_API_KEY`)

## Voice Settings Reference

| Setting | Default | Range | Effect |
|---------|---------|-------|--------|
| stability | 0.85 | 0-1 | Higher = more consistent, lower = more expressive |
| similarity | 0.95 | 0-1 | Higher = closer to original voice |
| style | 0.0 | 0-1 | Higher = more stylistic variation |
| speed | 1.0 | 0.5-2.0 | Speech speed multiplier |

## Per-Scene Script Structure

When using per-scene mode, create `.txt` files in `public/audio/scenes/`:

```
public/audio/scenes/
├── 01-title.txt       → 01-title.mp3
├── 02-overview.txt    → 02-overview.mp3
├── 03-demo.txt        → 03-demo.mp3
├── 04-summary.txt     → 04-summary.mp3
└── 05-credits.txt     → 05-credits.mp3
```

Each file contains just the narration text for that scene. Benefits:
- Regenerate individual scenes without re-doing everything
- Scene durations match audio naturally (no offset calculations)
- Each `<Audio>` starts at frame 0 within its `Series.Sequence`

**To split an existing VOICEOVER-SCRIPT.md:**
1. Create the `public/audio/scenes/` directory
2. Copy each scene's narration to a numbered `.txt` file
3. Use naming like `01-title.txt`, `02-overview.txt` for sorted order

## Script Format Tips

Share these tips with the user:
- Use `<break time="1.0s" />` for pauses (SSML-style)
- Keep sentences short for natural pacing
- Test with `--dry-run` flag first to check character count
- The voice ID is configured in `_internal/toolkit-registry.json`

## Error Handling

- If `ELEVENLABS_API_KEY` is missing, tell user to add it to `.env`
- If voice ID is missing, tell user to set `config.voiceId` in `toolkit-registry.json`
- If script file not found, offer to create a template
- If scene directory empty, prompt to create scene scripts first

## Example Output

**Per-scene mode:**
```
Per-scene audio generated:
  ✅ 01-title.mp3 (3.2s)
  ✅ 02-overview.mp3 (15.4s)
  ✅ 03-demo.mp3 (20.1s)
  ✅ 04-summary.mp3 (11.8s)

Total: 50.5s (1515 frames @ 30fps)
Characters: 892

Concatenated: public/audio/voiceover-concat.mp3 (50.5s)
```

**Single-file mode (legacy):**
```
Voiceover generated successfully!

File: public/audio/voiceover.mp3
Duration: 45.2s (1356 frames @ 30fps)
Characters: 892

For your config:
  durationSeconds: 46
```

---

## Evolution

This command evolves through use. If something's awkward or missing:

**Local improvements:**
1. Say "improve this" → Claude captures in `_internal/BACKLOG.md`
2. Edit `.claude/commands/generate-voiceover.md` → Update `_internal/CHANGELOG.md`
3. Share upstream → `gh pr create`

**Remote contributions:**
- Issues: `github.com/digitalsamba/claude-code-video-toolkit/issues`
- PRs welcome for voice features, script formats, documentation
