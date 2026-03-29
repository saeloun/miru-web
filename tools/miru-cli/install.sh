#!/usr/bin/env bash
set -euo pipefail

if ! command -v mise >/dev/null 2>&1; then
  echo "mise is required to install Miru CLI." >&2
  exit 1
fi

GOBIN_DIR="${HOME}/.local/bin"
mkdir -p "${GOBIN_DIR}"

mise exec go@1.24.1 -- env GOBIN="${GOBIN_DIR}" go install github.com/saeloun/miru-web/tools/miru-cli/cmd/miru@main

cat <<EOF
Miru CLI installed to ${GOBIN_DIR}/miru

Make sure ${GOBIN_DIR} is on your PATH, then run:
  miru help
EOF
