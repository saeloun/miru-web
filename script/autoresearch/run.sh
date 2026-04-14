#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

lane="${1:-}"

if [[ -z "$lane" ]]; then
  echo "usage: script/autoresearch/run.sh <docs_consistency|frontend_build|auth_pages_request_spec|browser_root_smoke>" >&2
  exit 1
fi

mkdir -p docs/experiments tmp/autoresearch
timestamp="$(date +"%Y-%m-%dT%H-%M-%S")"
log_file="docs/experiments/${timestamp}-${lane}.md"
tmp_file="tmp/autoresearch/${timestamp}-${lane}.txt"
status="PASS"

run_docs_consistency() {
  local required=(
    "AGENTS.md"
    "docs/ai/testing.md"
    "docs/ai/production.md"
    "docs/ai/workflow.md"
    "docs/ai/autoresearch-plan.md"
  )
  local missing=()
  local file

  for file in "${required[@]}"; do
    if [[ ! -f "$file" ]]; then
      missing+=("$file")
    fi
  done

  {
    echo "Required files"
    printf '%s\n' "${required[@]}"
    echo
    echo "Load on demand references"
    rg -n "docs/ai/testing.md|docs/ai/production.md|docs/ai/workflow.md" AGENTS.md
  } >"$tmp_file"

  if (( ${#missing[@]} > 0 )); then
    {
      echo
      echo "Missing files"
      printf '%s\n' "${missing[@]}"
    } >>"$tmp_file"
    status="FAIL"
  fi
}

run_frontend_build() {
  if ! mise exec -- timeout 30 bin/vite build >"$tmp_file" 2>&1; then
    status="FAIL"
  fi
}

run_auth_pages_request_spec() {
  if ! rtk proxy mise exec -- timeout 60 bundle exec rspec spec/requests/localization/auth_pages_spec.rb >"$tmp_file" 2>&1; then
    status="FAIL"
  fi
}

run_browser_root_smoke() {
  local artifact_base="output/playwright/${timestamp}-${lane}"
  mkdir -p output/playwright

  if ! ROOT_SMOKE_URL="http://127.0.0.1:3000/" \
    ROOT_SMOKE_SCREENSHOT="${artifact_base}.png" \
    ROOT_SMOKE_JSON="${artifact_base}.json" \
    rtk proxy mise exec -- node <<'NODE' >"$tmp_file" 2>&1
const fs = require("node:fs");

(async () => {
  const { chromium } = await import("playwright");
  const targetUrl = process.env.ROOT_SMOKE_URL;
  const screenshotPath = process.env.ROOT_SMOKE_SCREENSHOT;
  const jsonPath = process.env.ROOT_SMOKE_JSON;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => {
    pageErrors.push(String(error));
  });

  const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const title = await page.title();
  const url = page.url();
  const bodyText = await page.locator("body").innerText();
  const summary = {
    requestedUrl: targetUrl,
    finalUrl: url,
    status: response ? response.status() : null,
    title,
    bodyPreview: bodyText.slice(0, 400),
    consoleErrors,
    pageErrors,
    screenshotPath
  };

  await page.screenshot({ path: screenshotPath, fullPage: true });
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  await browser.close();

  const bodyHasException = /Exception caught|Routing Error|ActionController::RoutingError/i.test(bodyText);
  const failed =
    !summary.status ||
    summary.status >= 400 ||
    !title ||
    bodyHasException ||
    consoleErrors.length > 0 ||
    pageErrors.length > 0;

  console.log(JSON.stringify(summary, null, 2));

  if (failed) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
NODE
  then
    status="FAIL"
  fi
}

case "$lane" in
  docs_consistency)
    run_docs_consistency
    ;;
  frontend_build)
    run_frontend_build
    ;;
  auth_pages_request_spec)
    run_auth_pages_request_spec
    ;;
  browser_root_smoke)
    run_browser_root_smoke
    ;;
  *)
    echo "unknown lane: $lane" >&2
    exit 1
    ;;
esac

{
  echo "# Autoresearch Experiment"
  echo
  echo "- Timestamp: $timestamp"
  echo "- Lane: $lane"
  echo "- Status: $status"
  echo
  echo "## Output"
  echo
  echo '```text'
  cat "$tmp_file"
  echo '```'
} >"$log_file"

echo "$log_file"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
