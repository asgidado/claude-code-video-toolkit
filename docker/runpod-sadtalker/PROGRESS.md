# SadTalker Integration Progress

**Branch:** `experiment/sadtalker`
**Last updated:** 2026-01-06

## Completed
- [x] Dockerfile with baked-in models (~1.5GB)
- [x] handler.py with R2 integration and chunking (45s chunks)
- [x] tools/sadtalker.py CLI with --setup
- [x] README.md documentation

## Not Yet Done
- [ ] Build and push Docker image to ghcr.io
- [ ] Deploy endpoint via --setup
- [ ] Test with short audio (30s)
- [ ] Test with long audio (3+ min, verify chunking)
- [ ] Template swapping support (optional - share endpoint with other tools)

## Resume Instructions

```bash
# Switch to branch
git checkout experiment/sadtalker

# Build Docker image (takes ~10-15 min for model downloads)
cd docker/runpod-sadtalker
docker build -t ghcr.io/conalmullan/video-toolkit-sadtalker:latest .
docker push ghcr.io/conalmullan/video-toolkit-sadtalker:latest

# Deploy endpoint
python tools/sadtalker.py --setup

# Test
python tools/sadtalker.py --image avatar.png --audio test.mp3 --output test.mp4
```

## Key Files
- `docker/runpod-sadtalker/Dockerfile` - Docker build
- `docker/runpod-sadtalker/handler.py` - RunPod worker
- `tools/sadtalker.py` - CLI tool

## See Also
- `.ai_dev/sadtalker-integration.md` - Full integration plan (gitignored but useful)
