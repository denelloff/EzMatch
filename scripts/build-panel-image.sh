#!/usr/bin/env bash
# Build ez-panel image and pack a transferable tarball.
# Run on a machine with Docker (repo root):
#   bash scripts/build-panel-image.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${PANEL_IMAGE_TAG:-ez-panel:0.1.0}"
OUT_DIR="${PANEL_IMAGE_OUT:-$ROOT/dist-images}"
TAR="$OUT_DIR/ez-panel-0.1.0.tar"

mkdir -p "$OUT_DIR"

echo "==> docker build $TAG"
docker build -f Dockerfile.panel -t "$TAG" .

echo "==> docker save -> $TAR"
docker save -o "$TAR" "$TAG"

echo "Done."
echo "  Image: $TAG"
echo "  File:  $TAR"
echo
echo "On the server:"
echo "  docker load -i ez-panel-0.1.0.tar"
echo "  cp .env.panel.example .env.panel   # set DATABASE_URL to 128.0.141.214"
echo "  docker compose -f docker-compose.panel.yml --env-file .env.panel up -d"
