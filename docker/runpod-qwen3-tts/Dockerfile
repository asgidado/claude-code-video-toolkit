# Qwen3-TTS RunPod Serverless Worker
# Generates speech from text with voice cloning and emotion control
#
# Build (from repo root):
#   docker build --platform linux/amd64 -t ghcr.io/conalmullan/video-toolkit-qwen3-tts:latest docker/runpod-qwen3-tts/
#   docker push ghcr.io/conalmullan/video-toolkit-qwen3-tts:latest
#
# Test locally:
#   docker run --gpus all -p 8000:8000 ghcr.io/conalmullan/video-toolkit-qwen3-tts:latest

FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

# Install ffmpeg for WAV→MP3 conversion
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

# Install torchaudio (matching PyTorch 2.4.0 from base image)
RUN pip install --no-cache-dir torchaudio==2.4.0

# Install qwen-tts and dependencies
RUN pip install --no-cache-dir \
    qwen-tts \
    soundfile \
    runpod \
    boto3 \
    requests

# Copy handler
COPY handler.py /app/handler.py

WORKDIR /app

# Set HF cache location - models downloaded at runtime
ENV HF_HOME=/root/.cache/huggingface
ENV PYTHONUNBUFFERED=1

# Start handler
CMD ["python", "-u", "/app/handler.py"]
