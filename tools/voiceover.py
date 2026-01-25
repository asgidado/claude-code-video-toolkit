#!/usr/bin/env python3
"""
Generate voiceover audio using ElevenLabs TTS.

Usage:
    # From script file
    python tools/voiceover.py --script VOICEOVER-SCRIPT.md --output public/audio/voiceover.mp3

    # From stdin (for AI piping)
    echo "Hello world" | python tools/voiceover.py --output voiceover.mp3

    # With custom voice
    python tools/voiceover.py --script script.txt --voice-id ABC123 --output out.mp3

    # JSON output for machine parsing
    python tools/voiceover.py --script script.txt --output out.mp3 --json

    # Per-scene generation (recommended)
    python tools/voiceover.py --scene-dir public/audio/scenes --json

    # With concat for SadTalker narrator
    python tools/voiceover.py --scene-dir public/audio/scenes --concat public/audio/voiceover-concat.mp3
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import VoiceSettings, save
from elevenlabs.client import ElevenLabs

# Add parent to path for local imports
sys.path.insert(0, str(Path(__file__).parent))
from config import get_elevenlabs_api_key, get_voice_id


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate voiceover using ElevenLabs TTS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/voiceover.py --script VOICEOVER-SCRIPT.md --output public/audio/voiceover.mp3
  echo "Hello" | python tools/voiceover.py --output hello.mp3
  python tools/voiceover.py --script script.txt --voice-id ABC123 --output out.mp3 --json
  python tools/voiceover.py --scene-dir public/audio/scenes --json
  python tools/voiceover.py --scene-dir public/audio/scenes --concat public/audio/voiceover-concat.mp3
        """,
    )
    parser.add_argument(
        "--script",
        "-s",
        type=str,
        help="Path to script file (reads from stdin if not provided)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        help="Output audio file path (.mp3). Required for single-file mode.",
    )
    parser.add_argument(
        "--scene-dir",
        type=str,
        help="Directory of .txt scripts to process (per-scene mode). Each .txt generates a .mp3.",
    )
    parser.add_argument(
        "--concat",
        type=str,
        help="Output path for concatenated audio (use with --scene-dir for SadTalker)",
    )
    parser.add_argument(
        "--voice-id",
        "-v",
        type=str,
        help="ElevenLabs voice ID (uses default from toolkit-registry.json if not provided)",
    )
    parser.add_argument(
        "--model",
        "-m",
        type=str,
        default="eleven_multilingual_v2",
        choices=["eleven_multilingual_v2", "eleven_flash_v2_5", "eleven_turbo_v2_5", "eleven_v3"],
        help="ElevenLabs model (default: eleven_multilingual_v2). eleven_v3 is alpha.",
    )
    parser.add_argument(
        "--stability",
        type=float,
        default=0.85,
        help="Voice stability 0-1 (default: 0.85, higher = more consistent)",
    )
    parser.add_argument(
        "--similarity",
        type=float,
        default=0.95,
        help="Similarity boost 0-1 (default: 0.95, higher = closer to original)",
    )
    parser.add_argument(
        "--style",
        type=float,
        default=0.0,
        help="Style exaggeration 0-1 (default: 0.0, lower = more neutral)",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Speech speed multiplier (default: 1.0)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output result as JSON (for machine parsing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making API calls",
    )
    return parser.parse_args()


def read_script(script_path: str | None) -> str:
    """Read script from file or stdin."""
    if script_path:
        with open(script_path) as f:
            return f.read().strip()
    else:
        if sys.stdin.isatty():
            print("Reading script from stdin (Ctrl+D to end):", file=sys.stderr)
        return sys.stdin.read().strip()


def get_audio_duration(file_path: str) -> float | None:
    """Get audio duration using ffprobe if available."""
    import subprocess

    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                file_path,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            return float(result.stdout.strip())
    except (FileNotFoundError, ValueError):
        pass
    return None


def generate_single_audio(
    client: ElevenLabs,
    script: str,
    output_path: Path,
    voice_id: str,
    model: str,
    stability: float,
    similarity: float,
    style: float,
    speed: float,
) -> dict:
    """Generate a single audio file from script text. Returns result dict."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    audio = client.text_to_speech.convert(
        text=script,
        voice_id=voice_id,
        model_id=model,
        voice_settings=VoiceSettings(
            stability=stability,
            similarity_boost=similarity,
            style=style,
            speed=speed,
        ),
    )

    save(audio, str(output_path))

    duration = get_audio_duration(str(output_path))

    result = {
        "success": True,
        "output": str(output_path),
        "script_chars": len(script),
    }
    if duration:
        result["duration_seconds"] = round(duration, 2)
        result["duration_frames_30fps"] = int(duration * 30)

    return result


def process_scene_directory(
    client: ElevenLabs,
    scene_dir: Path,
    voice_id: str,
    model: str,
    stability: float,
    similarity: float,
    style: float,
    speed: float,
    dry_run: bool = False,
    json_output: bool = False,
) -> list[dict]:
    """Process all .txt files in directory, generate .mp3 for each."""
    txt_files = sorted(scene_dir.glob("*.txt"))

    if not txt_files:
        print(f"Error: No .txt files found in {scene_dir}", file=sys.stderr)
        sys.exit(1)

    results = []
    total_duration = 0.0
    total_chars = 0

    for txt_file in txt_files:
        mp3_file = txt_file.with_suffix(".mp3")
        script = txt_file.read_text().strip()

        if not script:
            print(f"Warning: Empty script in {txt_file.name}, skipping", file=sys.stderr)
            continue

        total_chars += len(script)

        if dry_run:
            results.append({
                "dry_run": True,
                "script": str(txt_file),
                "output": str(mp3_file),
                "script_chars": len(script),
            })
            if not json_output:
                print(f"  {txt_file.name} → {mp3_file.name} ({len(script)} chars)")
        else:
            if not json_output:
                print(f"Generating {mp3_file.name}...", file=sys.stderr)

            result = generate_single_audio(
                client=client,
                script=script,
                output_path=mp3_file,
                voice_id=voice_id,
                model=model,
                stability=stability,
                similarity=similarity,
                style=style,
                speed=speed,
            )
            result["script"] = str(txt_file)
            results.append(result)

            if result.get("duration_seconds"):
                total_duration += result["duration_seconds"]

            if not json_output:
                duration_str = f" ({result.get('duration_seconds', '?')}s)"
                print(f"  ✅ {mp3_file.name}{duration_str}", file=sys.stderr)

    return results, total_duration, total_chars


def concat_audio_files(mp3_files: list[Path], output_path: Path) -> dict:
    """Use ffmpeg concat demuxer to join audio files."""
    import subprocess
    import tempfile

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Create concat list file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        for mp3 in mp3_files:
            # FFmpeg concat requires specific format with escaped paths
            escaped_path = str(mp3).replace("'", "'\\''")
            f.write(f"file '{escaped_path}'\n")
        concat_list = f.name

    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",  # Overwrite output
                "-f", "concat",
                "-safe", "0",
                "-i", concat_list,
                "-c", "copy",
                str(output_path),
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"Error concatenating audio: {result.stderr}", file=sys.stderr)
            return {"success": False, "error": result.stderr}

        duration = get_audio_duration(str(output_path))
        return {
            "success": True,
            "output": str(output_path),
            "duration_seconds": round(duration, 2) if duration else None,
            "source_files": len(mp3_files),
        }
    finally:
        Path(concat_list).unlink(missing_ok=True)


def main():
    load_dotenv()
    args = parse_args()

    # Validate argument combinations
    if args.scene_dir and args.script:
        print("Error: Cannot use both --scene-dir and --script", file=sys.stderr)
        sys.exit(1)

    if args.concat and not args.scene_dir:
        print("Error: --concat requires --scene-dir", file=sys.stderr)
        sys.exit(1)

    if not args.scene_dir and not args.output:
        print("Error: --output is required for single-file mode", file=sys.stderr)
        sys.exit(1)

    # Get API key
    api_key = get_elevenlabs_api_key()
    if not api_key:
        print("Error: ELEVENLABS_API_KEY not found in environment", file=sys.stderr)
        sys.exit(1)

    # Get voice ID
    voice_id = args.voice_id or get_voice_id()
    if not voice_id:
        print(
            "Error: No voice ID provided and none found in toolkit-registry.json",
            file=sys.stderr,
        )
        sys.exit(1)

    client = ElevenLabs(api_key=api_key)

    # Per-scene mode
    if args.scene_dir:
        scene_dir = Path(args.scene_dir)
        if not scene_dir.is_dir():
            print(f"Error: Scene directory not found: {scene_dir}", file=sys.stderr)
            sys.exit(1)

        if not args.json:
            txt_count = len(list(scene_dir.glob("*.txt")))
            print(f"Processing {txt_count} scene scripts in {scene_dir}...", file=sys.stderr)

        if args.dry_run:
            if not args.json:
                print("Would generate:")
            results, total_duration, total_chars = process_scene_directory(
                client=client,
                scene_dir=scene_dir,
                voice_id=voice_id,
                model=args.model,
                stability=args.stability,
                similarity=args.similarity,
                style=args.style,
                speed=args.speed,
                dry_run=True,
                json_output=args.json,
            )
            result = {
                "dry_run": True,
                "mode": "per_scene",
                "scene_dir": str(scene_dir),
                "voice_id": voice_id,
                "model": args.model,
                "total_chars": total_chars,
                "scenes": results,
                "settings": {
                    "stability": args.stability,
                    "similarity": args.similarity,
                    "style": args.style,
                    "speed": args.speed,
                },
            }
            if args.concat:
                result["concat_output"] = args.concat
            if args.json:
                print(json.dumps(result, indent=2))
            return

        # Generate per-scene audio
        results, total_duration, total_chars = process_scene_directory(
            client=client,
            scene_dir=scene_dir,
            voice_id=voice_id,
            model=args.model,
            stability=args.stability,
            similarity=args.similarity,
            style=args.style,
            speed=args.speed,
            dry_run=False,
            json_output=args.json,
        )

        # Build final result
        result = {
            "success": True,
            "mode": "per_scene",
            "scene_dir": str(scene_dir),
            "voice_id": voice_id,
            "model": args.model,
            "total_chars": total_chars,
            "total_duration_seconds": round(total_duration, 2),
            "total_duration_frames_30fps": int(total_duration * 30),
            "scenes": results,
        }

        # Concat if requested
        if args.concat:
            mp3_files = [Path(r["output"]) for r in results if r.get("success")]
            if not args.json:
                print(f"\nConcatenating {len(mp3_files)} files...", file=sys.stderr)
            concat_result = concat_audio_files(mp3_files, Path(args.concat))
            result["concat"] = concat_result
            if not args.json and concat_result.get("success"):
                print(f"  ✅ {args.concat} ({concat_result.get('duration_seconds')}s)", file=sys.stderr)

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"\nPer-scene audio generated:", file=sys.stderr)
            print(f"  Total: {total_duration:.1f}s ({int(total_duration * 30)} frames @ 30fps)", file=sys.stderr)
            print(f"  Characters: {total_chars}", file=sys.stderr)
        return

    # Single-file mode (original behavior)
    script = read_script(args.script)
    if not script:
        print("Error: Empty script", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output)

    # Dry run mode
    if args.dry_run:
        result = {
            "dry_run": True,
            "mode": "single",
            "voice_id": voice_id,
            "model": args.model,
            "script_length": len(script),
            "script_chars": len(script),
            "output": str(output_path),
            "settings": {
                "stability": args.stability,
                "similarity": args.similarity,
                "style": args.style,
                "speed": args.speed,
            },
        }
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Would generate voiceover:")
            print(f"  Voice ID: {voice_id}")
            print(f"  Model: {args.model}")
            print(f"  Script: {len(script)} characters")
            print(f"  Output: {output_path}")
        return

    # Generate voiceover
    if not args.json:
        print(f"Generating voiceover ({len(script)} chars)...", file=sys.stderr)

    result = generate_single_audio(
        client=client,
        script=script,
        output_path=output_path,
        voice_id=voice_id,
        model=args.model,
        stability=args.stability,
        similarity=args.similarity,
        style=args.style,
        speed=args.speed,
    )
    result["mode"] = "single"
    result["voice_id"] = voice_id
    result["model"] = args.model

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Voiceover saved to: {output_path}", file=sys.stderr)
        duration = result.get("duration_seconds")
        if duration:
            print(
                f"Duration: {duration:.2f}s ({int(duration * 30)} frames @ 30fps)",
                file=sys.stderr,
            )


if __name__ == "__main__":
    main()
