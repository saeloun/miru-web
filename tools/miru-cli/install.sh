#!/usr/bin/env bash
set -euo pipefail

if ! command -v mise >/dev/null 2>&1; then
  echo "mise is required to install Miru CLI." >&2
  exit 1
fi

GOBIN_DIR="${HOME}/.local/bin"
mkdir -p "${GOBIN_DIR}"

# ponytail: pin until release automation publishes immutable, reviewed CLI tags.
MIRU_CLI_REVISION="b45dee47c3aa58d6312dabfad3b40012b04071fd"
mise exec go@1.25.12 -- env GOBIN="${GOBIN_DIR}" \
  go install "github.com/saeloun/miru-web/tools/miru-cli/cmd/miru@${MIRU_CLI_REVISION}"

cat <<EOF
Miru CLI installed to ${GOBIN_DIR}/miru

Make sure ${GOBIN_DIR} is on your PATH, then run:
  miru help
EOF
