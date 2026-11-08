# TypeScript module and Vite build-cache verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** Typechecking rejected existing lazy imports and `import.meta`. Editing only the root compiler config also left ViteRuby's ordinary build cache valid.
- **Root cause:** `module: "es6"` cannot describe the app's existing module syntax, and ViteRuby 3.11.1's default watched paths omit root `tsconfig.json`.
- **Fix:** Set only the TypeScript module option to `ESNext`; add `tsconfig.json` to the existing Vite `all.watchAdditionalPaths` list.
- **Evidence:** 79 diagnostics removed (78 TS1323 and one TS1343), zero new diagnostics, every unrelated normalized diagnostic retained. Actual forced and subsequent noncached test builds retain all 239 JS/CSS/JSON artifact hashes. Production asset build passes.
- **Regression test:** `spec/scripts/vite_executable_spec.rb`, “rebuilds after TypeScript configuration changes but reuses unchanged assets”. Real ViteRuby builders invoke a fake executable once, reuse unchanged output, then invoke it again after editing only `tsconfig.json`. Red before the watch-list addition; final seven-example file passes.
- **Related:** Hiring public entrypoints, lazy routes and document-review loading. The compiler/build change does not alter application business logic.
- **Status:** DONE_WITH_CONCERNS. This repair is locally verified; full typechecking and release remain incomplete.

## Why this configuration

TypeScript documents `esnext` or `preserve` for bundled code, and explains that dynamic imports and `import.meta` require newer module semantics than ES6. [TypeScript module reference](https://www.typescriptlang.org/tsconfig/module.html).

Vite performs transpilation separately from typechecking; a passing bundle is not a passing static check. The version-matched Vite 6.4.5 documentation also lists compiler options that affect the build. [Vite 6.4.5 TypeScript documentation](https://github.com/vitejs/vite/blob/v6.4.5/docs/guide/features.md#typescript).

A JSON comparison against parent `acce268f9` confirms that no other TypeScript option changes: `noEmit`, resolution, target, libraries, includes/excludes and checking settings are preserved. A separate comparison confirms Vite's only config change is the additional watched file. No dependency update or diagnostic suppression was introduced.

## Verification after final edits

| Check | Result |
| --- | --- |
| Full typecheck | **329 diagnostics**, down from 408; still exits 2 |
| Clean develop with `--module ESNext` | **329 diagnostics**, also exits 2 |
| Diagnostic-set assertion | Only TS1323/TS1343 removed; unrelated diagnostics unchanged |
| Cache regression before watch addition | **1 example, 1 expected failure**: one executable invocation instead of two |
| Final Vite executable/config spec file | **7 examples, 0 failures**, after adding the package-manager trap to PATH |
| Changed-file RuboCop | 1 file, no offenses |
| Required ordinary test build after config change | Actual build, exit 0, **9,806 modules** |
| Explicit `bin/vite build --force`, test mode | Actual build, exit 0, **9,806 modules** |
| Explicit forced production asset build | Exit 0, **9,803 modules**, built to local `public/vite` |
| Final test JS/CSS/JSON artifact comparison | **239 before and after; zero added, removed or changed** |
| Whitespace | `git diff --check` passes |

The baseline is the clean `origin/develop` worktree at `10e457e1d0cd2ac782be9d1edbcbd5a1a573486a`, using the same installed dependency tree and the same module option. Its remaining diagnostic count matches the candidate. Normalized messages have one candidate-only and one baseline-only entry: the same invoice prop mismatch prints different expanded object shapes. This comparison does not waive that error or certify the remaining 329 diagnostics.

## Cache and artifact proof

The initial ordinary build was a cache hit. It was identified and excluded from fresh-build proof. The supported force mechanism was verified using the installed CLI help and builder source: the `--force` argument bypasses caching. An environment variable previously supplied did not force that build.

Artifact comparison was rerun after the actual forced build and after the final ordinary build that ran with the watched-path change. It covers JavaScript, CSS and JSON artifacts, including manifests; sourcemaps and other asset formats are outside that comparison. Canonical snapshot SHA-256:

```text
868c70eb5bf6e7621ec858906dc0580201497a7430a01990695fd6f8b9b6692c
```

The cache test uses a fake successful Vite executable and manifest but the real ViteRuby builder/cache. It explicitly requires the second unchanged call to skip before editing TypeScript config, then checks the third call ran. Fresh builders model independent CLI invocations without the per-instance one-second digest memo. Child PATH includes the existing package-manager trap to prevent unintended real package-manager dispatch.

Script specs ran with outbound networking restricted to localhost. No new browser suite was run for this configuration-only unit; test runtime artifacts are byte-identical to those used in the preceding Hiring browser verification. The production build is local compilation, not deployment or authenticated production verification. The existing freeze boundary was preserved; this investigation acquired no owner token.

Local logs and snapshots:
- `/tmp/miru-module-cache-red-20261106.log`
- `/tmp/miru-module-cache-final-20261106.log`
- `/tmp/miru-module-typecheck-after-20261106.log`
- `/tmp/miru-module-typecheck-develop-20261106.log`
- `/tmp/miru-module-vite-forced-20261106.log`
- `/tmp/miru-module-vite-final-20261106.log`
- `/tmp/miru-module-vite-production-20261106.log`
- `/tmp/miru-module-assets-before-20261106.json`

## Independent assistance

Local Qwen supported the module-option change. Its suggestion that an older TypeScript implementation caused TS1323 was not used: the actual cause is the incompatible configured module option. Runtime equivalence was tested against actual Vite output rather than inferred from `noEmit`.

### CLAUDE CODE SAYS (consult)

Fresh tools-disabled consultation on the supplied three-file patch and installed builder/config source. Runner model: claude-opus-5-5. It did not execute checks and predates the final test PATH protection.

```tool-output
# NO_FINDINGS

I found no real defects in the patch as supplied. This is a source-only reading: I executed nothing, and the counts, hashes and pass results are the host's claims, not mine.

## Why each part holds

**`module: "ESNext"` with `noEmit`**
- With `noEmit: true`, `module` only changes what the checker accepts and how it validates module syntax. Nothing is emitted.
- `moduleResolution` is set explicitly, so the default-resolution side effect of `module` does not apply.
- `ESNext` with `moduleResolution: "node"` is a valid combination in TS 5.9. The `bundler` resolution mode is the one that requires es2015+, and it isn't used here.
- `esModuleInterop` and `moduleDetection` defaults only change under node16, nodenext or preserve, not under esnext.
- Vite's esbuild transform reads only a whitelist of tsconfig fields (jsx*, experimentalDecorators, useDefineForClassFields, verbatimModuleSyntax and similar). `module` isn't on that list, so unchanged build output is expected. That matches the 239 identical artifact hashes.

**`watchAdditionalPaths: ["tsconfig.json"]`**
- `watched_paths` only drops entries that start with `~/` or the source code dir. `tsconfig.json` passes that filter.
- The glob runs inside `within_root`, so the path resolves relative to the project root, which is correct.
- The digest is content-based (SHA of the file id), not mtime-based. A content edit marks the build stale, and a touch without a content change doesn't.

**Production inheritance**
- The `all` setting flows into production, which is the intended behavior.
- If `tsconfig.json` is missing in some build context, `Dir[]` returns nothing and nothing errors.
- The only cost is one extra small file hashed per digest.
- In production the watch only matters if `tmp/cache/vite` survives between deploys. If it does, a tsconfig-only change now correctly forces a rebuild.

**Regression spec: discriminating, not a false positive**
- The only watched input changed between build 2 and build 3 is `tsconfig.json`.
  - `public/vite-test`, `build-calls` and `tmp/cache/vite` are not watched.
  - `config/vite.json` is rewritten only before the first build.
- `stale?` can't be satisfied by the failed-build retry path, because every build succeeds.
- The manifest exists before builds 2 and 3, so the `manifest_paths.empty?` shortcut can't force a run.
- The in-script `abort` after build 2 proves the skip path is real. The final `eq(%w[build build])` proves build 3 ran.
- Fresh `Builder` instances get an empty `@file_digests` and no `@last_digest_at`. That sidesteps both the 1-second memo and the `recently_modified?` path, which matches separate CLI invocations.
- The reported pre-change failure ("only one invocation") is exactly the signal this design should produce.

## Optional hardening (not bugs)

1. **Spec coupled to `publicOutputDir`.** The fake executable hard-codes `public/vite-test/.vite/manifest.json`. If the test `publicOutputDir` changes, the spec fails loudly with "Unchanged assets rebuilt" rather than passing falsely. Writing to the path from `ViteRuby.config.build_output_dir` would remove the coupling.
2. **No fake package-manager guard.** Unlike the sibling specs, this one doesn't put `#{@project}/commands` on `PATH`. A future regression that ignores `viteBinPath` could reach a real `pnpm` instead of the trap stub. Adding the same `PATH` entry would close that gap.
3. **Environment leakage.** The spec inherits `RAILS_ENV` and any `VITE_RUBY_*` variables, the same as the existing specs. For example, a stray `VITE_RUBY_PUBLIC_OUTPUT_DIR` or `VITE_RUBY_MODE` in a developer shell could make it fail. That would be a spurious failure, not a false pass.
4. **`ESNext` is a moving target.** On TS upgrades the checker may accept newer module syntax (such as `import defer` in 5.9) before esbuild supports it. Pinning `ES2022` or `ES2020` would be tighter. `ESNext` remains the documented recommendation for bundled code, so this is a judgment call.
5. **Extended tsconfig files.** If a tsconfig `extends` chain or extra `tsconfig.*.json` files are ever added, they would also need to be in `watchAdditionalPaths`. That's not applicable today, since there is no `extends` in the supplied source.

## Unverifiable from the supplied material

- Whether any Vite plugin (for example vite-tsconfig-paths or vite-plugin-checker) reads `tsconfig.json`. If one does, watching the file is correctness rather than hardening. The patch is right either way.
- The production build result, which the host says is being checked separately.
```

### Host assessment

Accepted the package-manager PATH protection and reran all seven script specs and lint. The test manifest path intentionally follows the current test output directory; a later directory change would fail the spec rather than pass falsely. Existing environment conventions were retained. There is no extended tsconfig chain to watch today.

No code push, council approval, merge or deployment is claimed. The existing review-scope answer remains pending. Live payment-provider acceptance and production/migration/monitoring checks remain outside this evidence.

## Source fingerprints

```text
1d6972f92bf1c1eeae9197f123b2e4b9539d641d958f638c4b1b0742a1fcc975  tsconfig.json
956cfe2dcef546d0bd5b93cc720e8a7e0849c6c39e2fe2eb97b222e0c0f75c9d  config/vite.json
6fa5683b6b0d822c929bbe53d49f2464b6536e3bef716d02cf8169e55f5f1fb6  spec/scripts/vite_executable_spec.rb
```

