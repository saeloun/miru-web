#!/usr/bin/env bash
set -euo pipefail

# Fast local builds for dev and prod images using Buildx + persistent cache
#
# Usage:
#   scripts/build_images.sh            # build dev + prod locally (default)
#   scripts/build_images.sh --dev      # build dev only
#   scripts/build_images.sh --prod     # build prod only
#   scripts/build_images.sh --prune    # prune buildx cache before building
#   scripts/build_images.sh --push     # push instead of --load (requires tags/registry login)
#
# Env overrides:
#   BUILDER_NAME=miru-builder
#   BUILDX_CACHE_DIR=.buildx-cache
#   DEV_TAG=miru-dev:local
#   PROD_TAG=miru-prod:local

BUILDER_NAME="${BUILDER_NAME:-miru-builder}"
BUILDX_CACHE_DIR="${BUILDX_CACHE_DIR:-.buildx-cache}"
DEV_TAG="${DEV_TAG:-miru-dev:local}"
PROD_TAG="${PROD_TAG:-miru-prod:local}"

BUILD_DEV=true
BUILD_PROD=true
PUSH=false
PRUNE=false

for arg in "$@"; do
  case "$arg" in
    --dev) BUILD_DEV=true; BUILD_PROD=false ;;
    --prod) BUILD_DEV=false; BUILD_PROD=true ;;
    --push) PUSH=true ;;
    --prune) PRUNE=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but not found in PATH" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker Desktop." >&2
  exit 1
fi

# Ensure buildx builder
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --name "$BUILDER_NAME" --use >/dev/null
else
  docker buildx use "$BUILDER_NAME" >/dev/null
fi

mkdir -p "$BUILDX_CACHE_DIR"

if [ "$PRUNE" = true ]; then
  echo "Pruning old buildx cache (aggressive)..."
  docker buildx prune -af || true
fi

COMMON_CACHE_ARGS=(
  --cache-from "type=local,src=${BUILDX_CACHE_DIR}"
  --cache-to "type=local,dest=${BUILDX_CACHE_DIR},mode=max"
  --progress plain
)

if [ "$BUILD_DEV" = true ]; then
  echo "Building development image: ${DEV_TAG}"
  if [ "$PUSH" = true ]; then
    docker buildx build \
      "${COMMON_CACHE_ARGS[@]}" \
      --target=development \
      -t "$DEV_TAG" . --push
  else
    docker buildx build \
      "${COMMON_CACHE_ARGS[@]}" \
      --target=development \
      -t "$DEV_TAG" . --load
  fi
fi

if [ "$BUILD_PROD" = true ]; then
  echo "Building production image: ${PROD_TAG}"
  if [ "$PUSH" = true ]; then
    docker buildx build \
      "${COMMON_CACHE_ARGS[@]}" \
      --target=production \
      -t "$PROD_TAG" . --push
  else
    docker buildx build \
      "${COMMON_CACHE_ARGS[@]}" \
      --target=production \
      -t "$PROD_TAG" . --load
  fi
fi

echo "Done. Local images:"
docker images | awk 'NR==1 || /miru-dev|miru-prod/'

