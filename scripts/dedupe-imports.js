#!/usr/bin/env node
/*
  Merge duplicate import statements from the same module within a file.
  - Skips `import type ...` and side-effect-only `import "mod";` lines
  - Does not attempt to merge namespace imports (e.g., `import * as ns from 'mod'`)
  - Only merges value imports with default and/or named specifiers
*/
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(t|j)sx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function dedupe(content) {
  const lines = content.split(/\r?\n/);
  const importRx = /^\s*import\s+(?!type\b)(.+?)\s+from\s+['"]([^'"]+)['"];?\s*$/;
  const sideEffectRx = /^\s*import\s+['"][^'"]+['"];?\s*$/;

  // Collect imports per source
  const perSource = new Map();
  const indicesPerSource = new Map();

  lines.forEach((line, idx) => {
    if (sideEffectRx.test(line)) return; // skip side-effect imports
    const m = line.match(importRx);
    if (!m) return;
    const spec = m[1].trim();
    const src = m[2];
    const entry = { idx, raw: line, spec };
    if (!perSource.has(src)) {
      perSource.set(src, []);
      indicesPerSource.set(src, []);
    }
    perSource.get(src).push(entry);
    indicesPerSource.get(src).push(idx);
  });

  let changed = false;

  for (const [src, entries] of perSource.entries()) {
    if (entries.length < 2) continue; // nothing to dedupe

    let hasNamespace = false;
    let defaultImport = null;
    const named = [];

    for (const e of entries) {
      // namespace import?
      if (/^\*\s+as\s+/.test(e.spec)) { hasNamespace = true; break; }
      // default + named
      const defNamed = e.spec.match(/^([A-Za-z_$][\w$]*)\s*,\s*\{([^}]*)\}$/);
      if (defNamed) {
        if (!defaultImport) defaultImport = defNamed[1].trim();
        const parts = defNamed[2].split(',').map(s => s.trim()).filter(Boolean);
        named.push(...parts);
        continue;
      }
      // default only
      const defOnly = e.spec.match(/^([A-Za-z_$][\w$]*)$/);
      if (defOnly) {
        if (!defaultImport) defaultImport = defOnly[1].trim();
        continue;
      }
      // named only
      const namedOnly = e.spec.match(/^\{([^}]*)\}$/);
      if (namedOnly) {
        const parts = namedOnly[1].split(',').map(s => s.trim()).filter(Boolean);
        named.push(...parts);
        continue;
      }
      // anything else: treat as unsupported
      hasNamespace = true;
      break;
    }

    if (hasNamespace) continue; // skip complex cases

    // Build merged import
    const uniqNamed = Array.from(new Set(named));
    let merged;
    if (defaultImport && uniqNamed.length) {
      merged = `import ${defaultImport}, { ${uniqNamed.join(', ')} } from "${src}";`;
    } else if (defaultImport) {
      merged = `import ${defaultImport} from "${src}";`;
    } else if (uniqNamed.length) {
      merged = `import { ${uniqNamed.join(', ')} } from "${src}";`;
    } else {
      continue; // nothing meaningful
    }

    // Replace first, remove rest
    const idxs = indicesPerSource.get(src);
    lines[idxs[0]] = merged;
    for (let i = idxs.length - 1; i >= 1; i--) lines.splice(idxs[i], 1);
    changed = true;
  }

  return { changed, output: lines.join('\n') };
}

const root = path.join(process.cwd(), 'app', 'javascript');
const files = walk(root);
let total = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const { changed, output } = dedupe(src);
  if (changed) {
    fs.writeFileSync(f, output);
    total++;
  }
}
console.log(`Deduped imports in ${total} files`);

