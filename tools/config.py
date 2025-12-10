"""Shared configuration for video toolkit tools."""

import json
import os
from pathlib import Path

# Find workspace root (where _internal/ lives)
def find_workspace_root() -> Path:
    """Find the workspace root by looking for _internal directory."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        if (current / "_internal").exists():
            return current
        current = current.parent
    # Fallback to parent of tools/
    return Path(__file__).resolve().parent.parent


def load_registry() -> dict:
    """Load the skills registry configuration."""
    root = find_workspace_root()
    registry_path = root / "_internal" / "toolkit-registry.json"

    if not registry_path.exists():
        return {"config": {}}

    with open(registry_path) as f:
        return json.load(f)


def get_voice_id() -> str | None:
    """Get the default voice ID from env var, falling back to registry."""
    from dotenv import load_dotenv
    load_dotenv()

    # First check environment variable
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    if voice_id and voice_id != "your_voice_id_here":
        return voice_id

    # Fall back to registry
    registry = load_registry()
    return registry.get("config", {}).get("voiceId")


def get_elevenlabs_api_key() -> str | None:
    """Get ElevenLabs API key from environment."""
    from dotenv import load_dotenv
    load_dotenv()
    return os.getenv("ELEVENLABS_API_KEY")


def get_default_output_dir(project_path: str | None = None) -> Path:
    """Get default audio output directory for a project."""
    if project_path:
        return Path(project_path) / "public" / "audio"
    return find_workspace_root() / "public" / "audio"
