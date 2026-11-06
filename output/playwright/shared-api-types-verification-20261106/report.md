# Shared API typing verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** Hiring's generic API calls produced 20 TS2347 errors.
- **Root cause:** `ApiHandler.axios` was declared `any`, erasing Axios's generic request/response signatures.
- **Fix:** Type the existing instance as `AxiosInstance` and declare its existing toast/revalidation request flags in `AxiosRequestConfig`. No request, response, header, retry, authentication or dependency behavior changes.
- **Evidence:** Full-project diagnostics drop from 432 to 412, exactly 20 removed and zero new after normalizing source positions. ESLint passes. Fresh required Vite build exits 0 (9,806 modules). The emitted API JavaScript is byte-identical before/after.
- **Regression test:** An isolated compiler probe imports the real client, checks generic response field types and boolean request flags, and requires invalid assignments/unknown fields to fail. Against parent `f5866e77d`: TS2347 plus unused expected-error directives. Against the changed client: zero probe diagnostics. This filters probe diagnostics only; it is not a passing project typecheck.
- **Related:** Sonam #2463. Four other Hiring component diagnostics, dynamic-import configuration and baseline compiler errors remain.
- **Status:** DONE_WITH_CONCERNS. This repair is verified locally; the overall release is not ready.

## Scope and safety

Only `app/javascript/src/apis/api.ts` changes application source. The runtime-safety assertion compares TypeScript-emitted JavaScript from the actual before/after file, byte for byte:

```text
PASS: shared API emitted JavaScript byte-identical
SHA256 4636c6be26c19243ba55ccc252e44775fea0c189efbc3ec99bf533e7edba30f0
```

The response interceptor still returns the full response. CSRF, locale headers, error handling, session checking and the optional runtime `success` field are unchanged. Existing call sites retain response `data`; generic callers now receive their declared payload type. No new normalized diagnostics appeared anywhere in the project.

Axios 1.20.0 is installed and recorded in the lockfile; its declaration is `AxiosRequestConfig<D = any, P = any>`. The augmentation matches that declaration and applies program-wide. Other Axios instances would accept these flags too; declaring them does not install this client's interceptors on another instance. No AxiosResponse or payload-shape assertion was added.

The pre-existing freeze belongs to another task and was preserved. This investigation acquired no owner token and did not release or alter that boundary.

## Native checks after the final source edit

| Check | Result |
| --- | --- |
| Hiring browser selection, all nine responsive Hiring spec files | **46 examples, 0 failures** |
| Cookie-backed session browser spec | **1 example, 0 failures** |
| Required forced test build: `rtk mise exec -- timeout 30 bin/vite build` | Exit 0, 9,806 modules transformed |
| Changed-file ESLint | Exit 0 |
| API emitted-JavaScript equality assertion | Pass |
| Real-client compiler probe | Red before; zero probe errors after |
| `git diff --check` | Pass |

Browser checks used Brave against the running local Rails app with synthetic PostgreSQL data and outbound traffic restricted to localhost. Existing Hiring examples check console errors and authorization/workspace workflows. No new visual behavior was introduced or screenshot captured in this unit.

Local logs:
- `/tmp/miru-api-types-hiring-browser-20261106.log`
- `/tmp/miru-api-types-session-browser-20261106.log`
- `/tmp/miru-api-types-vite-20261106.log`
- `/tmp/miru-api-type-contract-20261106.log`
- `/tmp/miru-hiring-types-before-20261106.log`
- `/tmp/miru-hiring-types-api-final-20261106.log`

Probe source: `/tmp/miru-api-type-contract-20261106.cjs`; it compared HEAD at `f5866e77d` with the working file before commit. Its printed result was:

```json
{"before_probe_errors":[2347,2578,2578,2347,2578],"after_probe_errors":0}
```

## Remaining static and release work

The project typecheck still exits 2 with **412 diagnostics**. The earlier clean develop comparison at `10e457e1d0cd2ac782be9d1edbcbd5a1a573486a` reports 404 using identical package/lock/compiler configuration and the same installed dependencies. Current normalized comparison: nine candidate-only diagnostics and one baseline-only diagnostic. The latter is the same invoice mismatch with a different expanded object shape. This repair does not claim the remaining diagnostics are acceptable or waive them.

No exact-head council review, push, merge or deployment is established. The existing review-scope selector remains unanswered. No Mercury/Razorpay onboarding or transfer was attempted. No production, migration, monitoring, backup or compliance claim is made.

## Independent assistance

Local Qwen suggested typing the existing instance and declaring toast flags. The host rejected its claim that augmentation is local to one module and its optional response-data change. The retry flag also had to be declared, as demonstrated by the initial typed-client compiler run.

### CLAUDE CODE SAYS (consult)

Fresh tools-disabled consultation on the supplied API class and patch only. Model reported by the runner: claude-opus-5-5. It did not review the combined branch or execute tests.

```tool-output
# Verdict: NO_FINDINGS

The patch is a sound compile-time repair. Below are only optional cleanups and residual risks, none of which is a defect. I did not run any tests. This assessment relies on your reported host evidence (432 → 412 diagnostics, byte-identical emitted JavaScript, ESLint clean).

## Checks against your criteria

**Runtime and dependencies: no change.**
- `type AxiosInstance` is a type-only import and is erased at compile time.
- `declare module "axios" { interface ... }` emits nothing.
- The file has top-level imports, so this is a real module augmentation, not an ambient redeclaration that would shadow axios.
- No new package is added.
- All of this matches the byte-identical emit you observed.

**Response typing: sound and conservative.**
- The response interceptor returns the full `response`, not `response.data`. So `AxiosInstance`'s `Promise<AxiosResponse<T>>` matches what callers actually receive.
- The rejected Qwen suggestion to change the response-data shape would have been wrong.
- The runtime-only `success` field is not declared. Typing is therefore narrower than runtime, which is the safe direction. Any caller that reads `.success` will now get a compile error rather than a silent wrong type. You report no such callers.

**Interceptor signatures: compatible.**
- `(response: any) => any`, `(config: any) => Promise<any>` and `(error: any) => ...` are all assignable to the typed `use(...)` overloads.

**Retry call: now type-correct.**
- `this.axios({ ...requestConfig, __sessionValidated: true })` needs the augmentation. Without it, the explicit `__sessionValidated` literal property would be an excess-property error against `AxiosRequestConfig`.

**Security: no weakening.**
- All three flags are now part of the public config type. However, a caller setting `__sessionValidated: true` only skips the transient-401 revalidation. The request then goes straight to `handleUnauthorizedSession`, which clears credentials and redirects. That is stricter, not looser.
- `skipErrorToast` and `skipSuccessToast` affect UX only.
- CSRF and locale header injection are untouched.

**Caller compatibility.**
- Callers move from `any` to `AxiosResponse<any>`, so `.data` stays `any`.
- The 20 removed TS2347 errors are the expected result: generic calls like `http.get<T>()` on an `any`-typed value are now legal.
- The real risk is callers that assign the result to an incompatible annotated type, or read undeclared response fields. You report zero new diagnostics, so none exist today.

## Low-severity residual risks (not defects)

1. **The type-parameter list must exactly match the installed axios declaration.**
   - TypeScript requires identical type parameters across merged interface declarations; otherwise it reports TS2428.
   - I cannot verify from the supplied material that your installed axios declares `AxiosRequestConfig<D = any, P = any>`. Your zero-new-diagnostics result implies it does.
   - An axios upgrade that changes this arity would break compilation here. It would fail loudly, not silently.

2. **The augmentation applies program-wide.**
   - Any other `axios.create()` instance, or direct `axios.get(...)` usage elsewhere, will also accept these three flags.
   - Those instances lack this interceptor, so the flags would be silently ignored there.
   - Another augmentation that declares the same properties with different types would conflict.
   - This is acceptable as long as `api.ts` stays the single HTTP entry point. If more instances are added, consider moving the augmentation to a dedicated `axios.d.ts`.

## Optional cleanup (separate from this repair)

- In the 401 handler, the local cast `as { __sessionValidated?: boolean; url?: string }` could become `AxiosRequestConfig` (or `InternalAxiosRequestConfig`) now that the augmentation exists.
- Some interceptor parameters typed `any` could be narrowed in the same way.

Neither change is needed for correctness. Both would widen the diff beyond the stated scope.

**Not covered by this review:** whether the remaining tsc diagnostics that existed before this patch or are specific to this branch are acceptable. Typechecking is still failing overall, so this is not release approval.
```

### Host assessment

No defect was identified. Verified the installed Axios declaration directly and independently executed the type comparison, negative/positive contract probe, runtime byte equality, lint, build and browser checks. Optional cleanup of interceptor annotations and the local retry cast was left out of this typing repair. This consultation is not council or production approval.

## Source fingerprint

```text
0f5091ec1a573501f093ed156c13aaa3a2f81e952866dd6d44504141b394b127  app/javascript/src/apis/api.ts
```

