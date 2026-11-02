import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// These attest only the reviewed backports, not a clean upstream audit. See patches/README.md.
const proofs = {
  "minimatch@3.1.5": {
    "package.json":
      "eefa1c89527d52bbb2e8b053fe8ecf3e3ced399bdba82cf27e0e92edfd833938",
    "minimatch.js":
      "746849f267c4868a53729225bd85c7dccd387712136fb305fcc0a3eadd4a3d9d",
  },
  "minimatch@10.2.6": {
    "package.json":
      "bb847ba240909c9a36d4eaeb4e0efdc3e31182aeef208c1611259a48f282ea75",
    "dist/commonjs/index.js":
      "f2855a5541ee9e0f2558e9743824735ab757fefc0033dc268051628e4075fa01",
    "dist/esm/index.js":
      "3d607f6d6354ac3bbb9a8e0f6242be93537fd36617371270190aa0b531569534",
  },
  "minimatch@11.0.3": {
    "package.json":
      "ef4a771ea995978f41d37b063f9f8c061101ac89d0c53647cf4087df970e7ba5",
    "dist/commonjs/index.js":
      "235c5458355f1449cc100f1cea1a43d45f788a4feb524a83497aa146bea88f32",
    "dist/esm/index.js":
      "b238ca70371b1f192817ae9516afaacb566d1df2a7a85e47c6c24f41f1707864",
  },
  "deepmerge@2.2.1": {
    "package.json":
      "db1a2767e638e6461dd154da0aa04ea47c66305c597da4a11a46975bdc889cc5",
    "dist/cjs.js":
      "64c0872ac5c682f9e789026026128c0bf611bb66dbb45c1cfd36bde6a39f306e",
    "dist/es.js":
      "26f39d74daec089bcb7e7ddd947c55307d87e0a9415046275dead3099605f527",
    "dist/umd.js":
      "2f403d46484553737d75e5538d3b29e9d149c77306eafac13881be74629a28d8",
  },
  "deepmerge@4.3.1": {
    "package.json":
      "f56978e7a6da1a3c6edee41abb54f98584a2fa2680458c48db820ae772fef0c9",
    "dist/cjs.js":
      "f30c7f31ea7f1f2d13662769030826bf3bffc9116c403ee5ef3d2f9226b37bc2",
    "dist/umd.js":
      "de176ab8fdc9931ae78bd47f68879f975cefd35716991aa73a4b0f63c5782c32",
  },
};
const known = {
  "https://github.com/advisories/GHSA-g3hv-75wg-m249": [
    "minimatch",
    "moderate",
    "CVE-2026-118764",
  ],
  "https://github.com/advisories/GHSA-gcqx-w48m-w2h4": [
    "deepmerge",
    "low",
    "CVE-2026-93753",
  ],
};

export function verifyAudit(report, installed) {
  assert.ok(
    report &&
      !report.error &&
      report.advisories &&
      !Array.isArray(report.advisories),
    "invalid audit report"
  );
  assert.deepEqual(report.muted, [], "muted advisories are forbidden");
  assert.ok(
    Array.isArray(installed) && installed.length > 0,
    "missing installed dependencies"
  );
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  const verified = new Set();
  for (const pkg of installed) {
    if (!["minimatch", "deepmerge"].includes(pkg.name)) continue;
    const id = `${pkg.name}@${pkg.version}`;
    assert.ok(proofs[id], `unreviewed installed version: ${id}`);
    for (const [file, expected] of Object.entries(proofs[id])) {
      const hash = createHash("sha256")
        .update(readFileSync(resolve(pkg.path, file)))
        .digest("hex");
      assert.equal(
        hash,
        expected,
        `unverified installed file: ${pkg.path}/${file}`
      );
    }
    verified.add(id);
  }
  assert.ok(verified.size > 0, "no protected dependency was verified");
  const checked = new Set();
  for (const advisory of Object.values(report.advisories)) {
    assert.deepEqual(
      [advisory.module_name, advisory.severity, ...advisory.cves],
      known[advisory.url],
      `unreviewed advisory: ${advisory.url}`
    );
    assert.ok(
      Array.isArray(advisory.findings) && advisory.findings.length > 0,
      "missing findings"
    );
    for (const finding of advisory.findings) {
      const id = `${advisory.module_name}@${finding.version}`;
      assert.ok(
        proofs[id] && id !== "minimatch@11.0.3",
        `unreviewed advisory version: ${id}`
      );
      assert.ok(verified.has(id), `no installed copy for ${id}`);
      counts[advisory.severity]++;
      checked.add(id);
    }
  }
  assert.deepEqual(
    report.metadata?.vulnerabilities,
    counts,
    "inconsistent vulnerability totals"
  );
  return checked.size;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  mkdirSync("tmp/security-audit", { recursive: true });
  let failed = false;
  for (const [name, dir] of [
    ["web", "."],
    ["docs", "docs"],
    ["mobile", "apps/mobile"],
  ]) {
    try {
      const result = spawnSync("pnpm", ["--dir", dir, "audit", "--json"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
      writeFileSync(`tmp/security-audit/${name}.json`, result.stdout || "");
      assert.ok(
        [0, 1].includes(result.status) && !result.error,
        `audit command failed: ${result.stderr}`
      );
      const packages = spawnSync(
        "npm",
        ["query", '[name="minimatch"], [name="deepmerge"]', "--prefix", dir],
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
      );
      assert.equal(
        packages.status,
        0,
        `installed dependency query failed: ${packages.stderr}`
      );
      const report = JSON.parse(result.stdout);
      const count = verifyAudit(report, JSON.parse(packages.stdout));
      assert.equal(
        result.status,
        Object.keys(report.advisories).length ? 1 : 0,
        "unexpected audit exit status"
      );
      console.log(
        `${name}: ${count} upstream findings verified against reviewed installed code; raw report retained`
      );
    } catch (error) {
      failed = true;
      console.error(`${name}: ${error.message}`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}
