# SadTalker RunPod Serverless Worker
# Generates talking head videos from image + audio
#
# Build:
#   docker build -t video-toolkit-sadtalker .
#
# Test locally:
#   docker run --gpus all -p 8000:8000 video-toolkit-sadtalker

FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone SadTalker
RUN git clone --depth 1 https://github.com/OpenTalker/SadTalker.git
WORKDIR /app/SadTalker

# Install Python dependencies
# Note: Base image has PyTorch 2.1, which works with SadTalker
RUN pip install --no-cache-dir \
    dlib \
    face_alignment \
    imageio \
    imageio-ffmpeg \
    kornia \
    librosa \
    numpy \
    pydub \
    scipy \
    tqdm \
    yacs \
    safetensors

# Install additional dependencies for face restoration
RUN pip install --no-cache-dir \
    gfpgan \
    basicsr \
    facexlib \
    realesrgan

# Install RunPod SDK and utilities
RUN pip install --no-cache-dir \
    runpod \
    boto3 \
    requests

# Download SadTalker model weights at build time (faster cold start)
# Models are ~1.5GB total
RUN mkdir -p checkpoints && \
    cd checkpoints && \
    wget -q https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar && \
    wget -q https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar && \
    wget -q https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors && \
    wget -q https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_512.safetensors

# Download BFM model for 3DMM
RUN mkdir -p checkpoints/BFM_Fitting && \
    cd checkpoints/BFM_Fitting && \
    wget -q https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/BFM_Fitting.zip && \
    unzip -q BFM_Fitting.zip && \
    rm BFM_Fitting.zip

# Download hub models for face detection
RUN mkdir -p gfpgan/weights && \
    wget -q -P gfpgan/weights https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth

# Pre-download face detection model
RUN python -c "import face_alignment; fa = face_alignment.FaceAlignment(face_alignment.LandmarksType.TWO_D, device='cpu')" || true

WORKDIR /app

# Copy handler
COPY handler.py /app/handler.py

# Environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/SadTalker

# Start handler
CMD ["python", "-u", "/app/handler.py"]
