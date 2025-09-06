#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      // Skip apis directory itself
      if (full.includes(path.join('app', 'javascript', 'src', 'apis'))) continue;
      walk(full, files);
    } else if (/\.(t|j)sx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const root = path.join(process.cwd(), 'app', 'javascript', 'src');
const files = walk(root);

let changed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');

  // 1) Convert imports from apis/<module> → apis/api
  //    - default only: import X from "apis/foo" -> import { X } from "apis/api"
  //    - default + named: import X, { A, B } from "apis/foo" -> import { X, A, B } from "apis/api"
  //    - named only: import { X } from "apis/foo" -> import { X } from "apis/api"

  let next = src
    // default + named
    .replace(/import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+["']apis\/[A-Za-z0-9_\-\/]+["'];?/g,
      (m, def, named) => `import { ${def}, ${named.trim()} } from "apis/api";`)
    // default only
    .replace(/import\s+([A-Za-z_$][\w$]*)\s+from\s+["']apis\/[A-Za-z0-9_\-\/]+["'];?/g,
      (m, def) => `import { ${def} } from "apis/api";`)
    // named only
    .replace(/import\s*\{([^}]+)\}\s*from\s+["']apis\/[A-Za-z0-9_\-\/]+["'];?/g,
      (m, named) => `import { ${named.trim()} } from "apis/api";`);

  // 2) Fix any default imports already pointing to apis/api
  next = next
    // default + named from apis/api
    .replace(/import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+["']apis\/api["'];?/g,
      (m, def, named) => `import { ${def}, ${named.trim()} } from "apis/api";`)
    // default only from apis/api
    .replace(/import\s+([A-Za-z_$][\w$]*)\s+from\s+["']apis\/api["'];?/g,
      (m, def) => `import { ${def} } from "apis/api";`);

  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    src = next;
  }

  // 3) Merge duplicate imports from apis/api into a single line
  const lines = src.split(/\r?\n/);
  const importRegex = /^import\s*\{([^}]+)\}\s*from\s+["']apis\/api["'];?\s*$/;
  const indices = [];
  let collected = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(importRegex);
    if (m) {
      indices.push(i);
      const parts = m[1].split(',').map(s => s.trim()).filter(Boolean);
      collected.push(...parts);
    }
  }
  if (indices.length > 1) {
    // unique and sort to keep stable order
    const unique = Array.from(new Set(collected));
    const merged = `import { ${unique.join(', ')} } from "apis/api";`;
    // Replace first and remove others
    lines[indices[0]] = merged;
    for (let j = indices.length - 1; j >= 1; j--) {
      lines.splice(indices[j], 1);
    }
    fs.writeFileSync(file, lines.join('\n'));
    changed++;
  }
}

console.log(`Updated ${changed} files to import from apis/api`);
