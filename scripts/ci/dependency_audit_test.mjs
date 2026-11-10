import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { verifyAudit } from "./dependency_audit.mjs";

const installed = JSON.parse(
  execFileSync(
    "npm",
    ["query", '[name="minimatch"], [name="deepmerge"]', "--prefix", "docs"],
    { encoding: "utf8" }
  )
);
const advisory = {
  module_name: "deepmerge",
  severity: "low",
  cves: ["CVE-2026-93753"],
  url: "https://github.com/advisories/GHSA-gcqx-w48m-w2h4",
  findings: [{ version: "4.3.1", paths: [] }],
};
const report = () => ({
  advisories: { 1: structuredClone(advisory) },
  muted: [],
  metadata: {
    vulnerabilities: { info: 0, low: 1, moderate: 0, high: 0, critical: 0 },
  },
});

test("recognizes only exact installed remediation without hiding the advisory", () => {
  const raw = report();
  assert.equal(verifyAudit(raw, installed), 1);
  assert.equal(Object.keys(raw.advisories).length, 1);
});
test("rejects new advisories, versions, severity changes and malformed reports", () => {
  for (const change of [
    p => {
      p.advisories[1].url = "https://github.com/advisories/GHSA-new-finding";
    },
    p => {
      p.advisories[1].findings[0].version = "4.3.2";
    },
    p => {
      p.advisories[1].severity = "high";
    },
    p => {
      p.metadata.vulnerabilities.low = 0;
    },
    p => {
      p.muted = [{ id: 123 }];
    },
    p => {
      p.error = { code: "ECONNRESET" };
    },
    p => {
      delete p.advisories;
    },
  ]) {
    const raw = report();
    change(raw);
    assert.throws(() => verifyAudit(raw, installed));
  }
});
test("rejects an absent or incompletely installed dependency tree", () => {
  assert.throws(() => verifyAudit(report(), []));
  assert.throws(() =>
    verifyAudit(
      report(),
      installed.filter(p => p.name !== "deepmerge")
    )
  );
});
test("rejects extra stale versions even when absent from the lockfile report", () => {
  for (const [name, version] of [
    ["deepmerge", "4.3.0"],
    ["minimatch", "10.2.4"],
  ]) {
    assert.throws(() =>
      verifyAudit(report(), [
        ...installed,
        {
          name,
          version,
          path: "/nonexistent/stale-copy",
        },
      ])
    );
  }
});
test("accepts a complete clean report and rejects a malformed clean report", () => {
  const clean = report();
  clean.advisories = {};
  clean.metadata.vulnerabilities.low = 0;
  assert.equal(verifyAudit(clean, installed), 0);
  assert.throws(() =>
    verifyAudit(clean, [{ name: "unrelated", version: "1.0.0" }])
  );
  delete clean.metadata;
  assert.throws(() => verifyAudit(clean, installed));
});
test("rejects an altered copy even when another installed copy is patched", () => {
  const scratch = mkdtempSync(join(tmpdir(), "miru-dependency-audit-"));
  try {
    const original = installed.find(p => p.name === "deepmerge");
    cpSync(original.path, scratch, { recursive: true });
    writeFileSync(join(scratch, "dist/umd.js"), "module.exports = {};");
    assert.throws(() =>
      verifyAudit(report(), [...installed, { ...original, path: scratch }])
    );
    const clean = report();
    clean.advisories = {};
    clean.metadata.vulnerabilities.low = 0;
    assert.throws(() =>
      verifyAudit(clean, [...installed, { ...original, path: scratch }])
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("rejects altered minimatch 11 runtime files even on a clean report", () => {
  const original = installed.find(
    p => p.name === "minimatch" && p.version === "11.0.5"
  );
  assert.ok(original, "docs must install the reviewed minimatch release");
  const clean = report();
  clean.advisories = {};
  clean.metadata.vulnerabilities.low = 0;
  for (const file of [
    "package.json",
    "dist/commonjs/index.js",
    "dist/commonjs/assert-valid-pattern.js",
    "dist/commonjs/escape.js",
    "dist/commonjs/unescape.js",
    "dist/esm/index.js",
    "dist/esm/assert-valid-pattern.js",
    "dist/esm/escape.js",
    "dist/esm/unescape.js",
  ]) {
    const scratch = mkdtempSync(join(tmpdir(), "miru-minimatch-audit-"));
    try {
      cpSync(original.path, scratch, { recursive: true });
      writeFileSync(join(scratch, file), "synthetic altered runtime file");
      assert.throws(
        () =>
          verifyAudit(clean, [...installed, { ...original, path: scratch }]),
        /unverified installed file:/
      );
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
});

test("does not excuse an advisory against upstream-fixed minimatch 11", () => {
  const raw = report();
  raw.advisories[2] = {
    module_name: "minimatch",
    severity: "moderate",
    cves: ["CVE-2026-118764"],
    url: "https://github.com/advisories/GHSA-g3hv-75wg-m249",
    findings: [{ version: "11.0.5", paths: [] }],
  };
  raw.metadata.vulnerabilities.moderate = 1;
  assert.throws(
    () => verifyAudit(raw, installed),
    /unreviewed advisory version: minimatch@11\.0\.5/
  );
});
