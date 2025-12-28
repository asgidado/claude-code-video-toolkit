#!/usr/bin/env python3
"""
Redub a video with a different voice using ElevenLabs.

Pipeline:
    1. Extract audio from video (FFmpeg)
    2. Transcribe audio (ElevenLabs Scribe STT)
    3. Generate new audio with different voice (ElevenLabs TTS)
    4. Replace audio track in video (FFmpeg)

Usage:
    # Basic usage - redub video with a new voice
    python tools/redub.py --input video.mp4 --voice-id NEW_VOICE_ID --output dubbed.mp4

    # Save transcript for review/editing
    python tools/redub.py --input video.mp4 --voice-id NEW_VOICE_ID --output dubbed.mp4 --save-transcript transcript.txt

    # Use existing transcript (skip STT step)
    python tools/redub.py --input video.mp4 --voice-id NEW_VOICE_ID --transcript edited.txt --output dubbed.mp4

    # Keep intermediate files (extracted audio, new audio)
    python tools/redub.py --input video.mp4 --voice-id NEW_VOICE_ID --output dubbed.mp4 --keep-temp

    # JSON output for machine parsing
    python tools/redub.py --input video.mp4 --voice-id NEW_VOICE_ID --output dubbed.mp4 --json
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import VoiceSettings, save
from elevenlabs.client import ElevenLabs

# Add parent to path for local imports
sys.path.insert(0, str(Path(__file__).parent))
from config import get_elevenlabs_api_key, get_voice_id


def parse_args():
    parser = argparse.ArgumentParser(
        description="Redub a video with a different voice using ElevenLabs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/redub.py --input video.mp4 --voice-id ABC123 --output dubbed.mp4
  python tools/redub.py --input video.mp4 --voice-id ABC123 --output dubbed.mp4 --save-transcript script.txt
  python tools/redub.py --input video.mp4 --voice-id ABC123 --transcript edited.txt --output dubbed.mp4
        """,
    )
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        required=True,
        help="Input video file path",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        required=True,
        help="Output video file path",
    )
    parser.add_argument(
        "--voice-id",
        "-v",
        type=str,
        help="Target ElevenLabs voice ID for the new voice",
    )
    parser.add_argument(
        "--transcript",
        "-t",
        type=str,
        help="Use existing transcript file instead of transcribing (skips STT)",
    )
    parser.add_argument(
        "--save-transcript",
        type=str,
        help="Save transcription to file for review",
    )
    parser.add_argument(
        "--language",
        "-l",
        type=str,
        help="Language code for transcription (e.g., 'en', 'es'). Auto-detects if not specified.",
    )
    parser.add_argument(
        "--model",
        "-m",
        type=str,
        default="eleven_multilingual_v2",
        choices=["eleven_multilingual_v2", "eleven_flash_v2_5", "eleven_turbo_v2_5"],
        help="ElevenLabs TTS model (default: eleven_multilingual_v2)",
    )
    parser.add_argument(
        "--stt-model",
        type=str,
        default="scribe_v1",
        choices=["scribe_v1", "scribe_v1_experimental"],
        help="ElevenLabs STT model (default: scribe_v1)",
    )
    parser.add_argument(
        "--stability",
        type=float,
        default=0.85,
        help="Voice stability 0-1 (default: 0.85)",
    )
    parser.add_argument(
        "--similarity",
        type=float,
        default=0.95,
        help="Similarity boost 0-1 (default: 0.95)",
    )
    parser.add_argument(
        "--style",
        type=float,
        default=0.0,
        help="Style exaggeration 0-1 (default: 0.0)",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Speech speed multiplier (default: 1.0)",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="Keep intermediate files (extracted audio, generated audio)",
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


def get_media_duration(file_path: str) -> float | None:
    """Get media duration using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
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


def extract_audio(video_path: str, audio_path: str, verbose: bool = True) -> bool:
    """Extract audio from video using FFmpeg."""
    if verbose:
        print(f"Extracting audio from {video_path}...", file=sys.stderr)

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",  # Overwrite output
            "-i", video_path,
            "-vn",  # No video
            "-acodec", "libmp3lame",
            "-q:a", "2",  # High quality
            audio_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}", file=sys.stderr)
        return False

    return True


def transcribe_audio(client: ElevenLabs, audio_path: str, model_id: str, language: str | None = None, verbose: bool = True) -> dict | None:
    """Transcribe audio using ElevenLabs Scribe."""
    if verbose:
        print(f"Transcribing audio with {model_id}...", file=sys.stderr)

    try:
        with open(audio_path, "rb") as audio_file:
            result = client.speech_to_text.convert(
                file=audio_file,
                model_id=model_id,
                language_code=language,
                tag_audio_events=False,  # We just want the speech text
            )

        return {
            "text": result.text,
            "language_code": result.language_code,
            "language_probability": getattr(result, "language_probability", None),
        }
    except Exception as e:
        print(f"Transcription error: {e}", file=sys.stderr)
        return None


def generate_tts(
    client: ElevenLabs,
    text: str,
    voice_id: str,
    output_path: str,
    model_id: str,
    stability: float,
    similarity: float,
    style: float,
    speed: float,
    verbose: bool = True,
) -> bool:
    """Generate TTS audio using ElevenLabs."""
    if verbose:
        print(f"Generating TTS with voice {voice_id}...", file=sys.stderr)

    try:
        audio = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=model_id,
            voice_settings=VoiceSettings(
                stability=stability,
                similarity_boost=similarity,
                style=style,
                speed=speed,
            ),
        )

        save(audio, output_path)
        return True
    except Exception as e:
        print(f"TTS error: {e}", file=sys.stderr)
        return False


def replace_audio(video_path: str, audio_path: str, output_path: str, verbose: bool = True) -> bool:
    """Replace audio track in video using FFmpeg."""
    if verbose:
        print(f"Replacing audio in video...", file=sys.stderr)

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",  # Overwrite output
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",  # Copy video stream
            "-map", "0:v:0",  # Use video from first input
            "-map", "1:a:0",  # Use audio from second input
            "-shortest",  # Match shortest stream duration
            output_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}", file=sys.stderr)
        return False

    return True


def main():
    load_dotenv()
    args = parse_args()

    # Validate input file exists
    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
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
            "Error: No voice ID provided. Use --voice-id or set ELEVENLABS_VOICE_ID",
            file=sys.stderr,
        )
        sys.exit(1)

    # Prepare output directory
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Get input duration for reference
    input_duration = get_media_duration(args.input)

    verbose = not args.json

    # Dry run mode
    if args.dry_run:
        result = {
            "dry_run": True,
            "input": args.input,
            "output": str(output_path),
            "voice_id": voice_id,
            "tts_model": args.model,
            "stt_model": args.stt_model,
            "language": args.language,
            "using_transcript": args.transcript,
            "input_duration": input_duration,
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
            print("Would perform redub:")
            print(f"  Input: {args.input}")
            if input_duration:
                print(f"  Duration: {input_duration:.2f}s")
            print(f"  Voice ID: {voice_id}")
            print(f"  Output: {output_path}")
            if args.transcript:
                print(f"  Using transcript: {args.transcript}")
            else:
                print(f"  Will transcribe with: {args.stt_model}")
        return

    # Create temp directory for intermediate files
    temp_dir = tempfile.mkdtemp(prefix="redub_")
    extracted_audio = Path(temp_dir) / "extracted.mp3"
    generated_audio = Path(temp_dir) / "generated.mp3"

    try:
        client = ElevenLabs(api_key=api_key)

        # Step 1: Extract audio from video
        if not extract_audio(args.input, str(extracted_audio), verbose=verbose):
            print("Error: Failed to extract audio from video", file=sys.stderr)
            sys.exit(1)

        # Step 2: Get transcript (from file or via STT)
        if args.transcript:
            # Use provided transcript
            if verbose:
                print(f"Using transcript from {args.transcript}", file=sys.stderr)
            with open(args.transcript) as f:
                transcript_text = f.read().strip()
            transcription = {"text": transcript_text, "language_code": args.language}
        else:
            # Transcribe with ElevenLabs Scribe
            transcription = transcribe_audio(
                client,
                str(extracted_audio),
                args.stt_model,
                args.language,
                verbose=verbose,
            )
            if not transcription:
                print("Error: Failed to transcribe audio", file=sys.stderr)
                sys.exit(1)

            # Save transcript if requested
            if args.save_transcript:
                with open(args.save_transcript, "w") as f:
                    f.write(transcription["text"])
                if verbose:
                    print(f"Transcript saved to {args.save_transcript}", file=sys.stderr)

        transcript_text = transcription["text"]

        if verbose:
            print(f"Transcript: {len(transcript_text)} characters", file=sys.stderr)

        # Step 3: Generate TTS with new voice
        if not generate_tts(
            client,
            transcript_text,
            voice_id,
            str(generated_audio),
            args.model,
            args.stability,
            args.similarity,
            args.style,
            args.speed,
            verbose=verbose,
        ):
            print("Error: Failed to generate TTS audio", file=sys.stderr)
            sys.exit(1)

        # Step 4: Replace audio in video
        if not replace_audio(args.input, str(generated_audio), str(output_path), verbose=verbose):
            print("Error: Failed to replace audio in video", file=sys.stderr)
            sys.exit(1)

        # Get output duration
        output_duration = get_media_duration(str(output_path))
        new_audio_duration = get_media_duration(str(generated_audio))

        # Build result
        result = {
            "success": True,
            "input": args.input,
            "output": str(output_path),
            "voice_id": voice_id,
            "tts_model": args.model,
            "transcript_chars": len(transcript_text),
        }

        if transcription.get("language_code"):
            result["language"] = transcription["language_code"]

        if input_duration:
            result["input_duration"] = round(input_duration, 2)
        if output_duration:
            result["output_duration"] = round(output_duration, 2)
        if new_audio_duration:
            result["new_audio_duration"] = round(new_audio_duration, 2)

        # Warn about duration mismatch
        if input_duration and new_audio_duration:
            diff = abs(new_audio_duration - input_duration)
            if diff > 2.0:
                result["warning"] = f"Audio duration differs by {diff:.1f}s from original"

        if args.save_transcript:
            result["transcript_file"] = args.save_transcript

        # Keep temp files if requested
        if args.keep_temp:
            kept_extracted = output_path.parent / f"{output_path.stem}_extracted.mp3"
            kept_generated = output_path.parent / f"{output_path.stem}_generated.mp3"

            import shutil
            shutil.copy(extracted_audio, kept_extracted)
            shutil.copy(generated_audio, kept_generated)

            result["temp_files"] = {
                "extracted_audio": str(kept_extracted),
                "generated_audio": str(kept_generated),
            }

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Redub complete: {output_path}", file=sys.stderr)
            if input_duration and new_audio_duration:
                diff = new_audio_duration - input_duration
                sign = "+" if diff > 0 else ""
                print(
                    f"Duration: {input_duration:.1f}s -> {new_audio_duration:.1f}s ({sign}{diff:.1f}s)",
                    file=sys.stderr,
                )
            if result.get("warning"):
                print(f"Warning: {result['warning']}", file=sys.stderr)

    finally:
        # Cleanup temp directory
        if not args.keep_temp:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
