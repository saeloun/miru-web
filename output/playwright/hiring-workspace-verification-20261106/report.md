# Hiring workspace identity verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** Hiring displayed “The hiring workspace changed” when the authenticated workspace ID was a numeric string. Three component type errors described the same mismatch. Assignment history also used a string method outside the configured compiler library.
- **Root cause:** UserContext allows `Company.id` as number or string, while Hiring's strict response identity guard expects a number. The routing roots passed the unnormalized context value.
- **Fix:** Normalize the ID in Hiring and AssignmentReviews routing, retaining company/role guards and strict response identity validation. Replace history's literal-underscore `replaceAll` call with equivalent `replace(/_/g, " ")`; keep compiler settings unchanged.
- **Evidence:** The original browser regression failed on parent application source `319ddb19a`, showing the expected workspace-change alert instead of the Assignments section. It passes with the fix. Four compiler diagnostics disappear, with zero new ones.
- **Regression test:** `spec/system/responsive/hiring_assessment_review_spec.rb`, “keeps admin intake and designated reviews scoped with string workspace IDs”. It loads the real admin application, reviewer list/detail and persists a review with a string ID in the authentication bootstrap. A deliberately mismatched review response is then rejected and private submitted work disappears. The test records that the wrapped show response was actually altered.
- **Related:** Sonam #2463. The existing responsive browser CI selection includes this file via `spec/system/responsive`.
- **Status:** DONE_WITH_CONCERNS. Locally verified; the project typecheck and release remain unfinished.

## Safety and scope

The application changes span three Hiring components. One existing browser spec is extended. Backend controllers, scopes, permissions and the shared strict `verifyWorkspace` check are unchanged.

The browser fixture changes only the real `/users/_me` response's `company.id` representation. Actual sessions, memberships, database IDs and Hiring responses remain real numeric IDs. The review is checked in PostgreSQL after submission. The subsequent response mismatch proves the UI still rejects a different workspace and hides the private contribution text it had previously displayed.

Invalid IDs still encounter the existing backend workspace check; there is no fallback to another workspace. The pre-existing freeze boundary belongs to another task, was preserved, and was not released.

## Verification

| Check | Result |
| --- | --- |
| Regression on original application source | **1 example, 1 expected failure**, workspace-change screen |
| Focused regression after fix | **1 example, 0 failures** |
| All nine Hiring browser spec files | **47 examples, 0 failures**, final application source before the last test-strength assertion |
| Final assessment-review/library selection plus observer probe | **13 examples, 0 failures**, after the final test edit; 12 existing-file examples plus one temporary observer probe |
| Required forced Vite build | Exit 0, **9,806 modules** |
| Changed-file ESLint | Exit 0 |
| Changed Ruby spec RuboCop | 1 file, no offenses |
| `git diff --check` | Pass |

The final observer probe deliberately emits a synthetic console error and confirms receipt through the same event API used by the spec:

```text
Observed Runtime.consoleAPICalled(error) using Capybara::Cuprite::Driver / Capybara::Cuprite::Browser
```

The probe verifies observer wiring, not the absence of errors by itself. The actual regression separately requires its console/exception collection to be empty. Tests used Brave, a running local Rails app and synthetic PostgreSQL data, with outbound traffic restricted to localhost. No production, external email or live payment-provider writes occurred.

Local logs:
- `/tmp/miru-hiring-workspace-red-20261106.log`
- `/tmp/miru-hiring-workspace-green-20261106.log`
- `/tmp/miru-hiring-workspace-full-browser-20261106.log`
- `/tmp/miru-hiring-workspace-final-focused-20261106.log`
- `/tmp/miru-hiring-workspace-vite-20261106.log`
- `/tmp/miru-hiring-workspace-typecheck-20261106.log`

Temporary observer probe: `/tmp/miru-hiring-console-observer-probe-20261106.rb`.

## Screenshots

Four screenshots were captured at `/tmp/miru-hiring-workspace-shots-20261106/`. The successful string-ID review and rejected-workspace screen were opened and visually inspected. They contain synthetic data. These are local artifacts; they have not been uploaded to GitHub or published with this branch.

- `string-workspace-review.png`: persisted reviewer feedback and submitted work visible to the designated reviewer.
- `workspace-mismatch.png`: workspace-change alert with private work hidden.
- `admin-download.png` and `reviewer-download.png`: existing private-download flows from the final focused run.

## Remaining work

Full typechecking still exits 2: **408 diagnostics**, down from 412 on this unit's parent and 432 before the preceding shared-client repair. There are no remaining diagnostics under `components/Hiring`; Hiring entrypoint and route dynamic-import configuration errors remain, alongside the baseline errors. The earlier clean develop comparison reports 404 under the same package/lock/compiler settings and installed dependencies. This is not a clean project typecheck.

No exact-head council review, code push, merge or deployment is claimed. The review-scope selector remains unanswered. Live Razorpay/Mercury acceptance, production migration, monitoring and compliance are outside this verification.

## Independent assistance

Local Qwen supported normalization at the routing boundary and the literal-underscore replacement. The host retained existing guards rather than adding an alternative identity fallback, and used the real-server regression to prove that string context IDs and numeric backend identities interoperate.

### CLAUDE CODE SAYS (consult)

Fresh tools-disabled consultation on the supplied four-file patch and context. Runner model: claude-opus-5-5. This predates the final test-strength assertion and observer probe below.

```tool-output
# Review: string workspace ID normalization in Hiring routing

**Verdict: NO_FINDINGS.** I found no real defects. The items below are low-severity test-strength gaps or optional cleanup. This is a source-only consultation: I ran no tests, and it is not release approval.

## Workspace isolation: holds

- **Server checks are unchanged.** `require_workspace!` compares `identity.to_s` with `current_company.id.to_s` on every GET/HEAD and on every mutation through `mutation_attributes`. Client-side coercion can only cause rejections; it cannot give access to another workspace.
- **Response check is unchanged.** `verifyWorkspace` still uses strict `!==` against a value that is now a number. Backend `company_id` is an integer, so the correct workspace passes and a different one throws.
- **Remount keys are unaffected.** `key={company.id}` keeps the raw value. React turns keys into strings, so `"5"` and `5` give the same key.

## Invalid-ID behavior: fails closed

- **Undefined or non-numeric `company.id`** becomes `NaN`:
  - GET params serialize as `"NaN"`, so the server returns 409.
  - POST bodies serialize `NaN` as `null`, which is neither a String nor an Integer, so the server returns 409.
  - `verifyWorkspace` would reject anyway, because `NaN !== n` is always true.
  - The user sees the workspace-changed alert. This matches the old behavior for `undefined`.
- **Optional cleanup:** `Number()` also accepts `""` (becomes `0`), `"0x0C"`, `"1e1"` and surrounding whitespace. IDs above 2^53 lose precision. None of this is reachable from a backend-controlled `/users/_me` response, and the server check covers it anyway. A strict parse (`/^[1-9]\d*$/` and otherwise an explicit fail) would make the intent clearer, but it is not required.

## `replaceAll` → `replace(/_/g, " ")`: equivalent

For a literal one-character pattern, both calls produce the same string. The `?.` and `|| "Method not set"` fallback chain is preserved.

## Test review

1. **Low, test strength: the mismatch assertion can't tell client rejection from server rejection.** `failureMessage` shows the same "workspace changed" text for a server 409 and for a client-side `verifyWorkspace` throw. If the second request sent a bad `company_id`, the server would reject it before `show` runs, and the test would still pass. The earlier successful load in the same session makes this unlikely.
   - Fix: set a flag inside the wrapped `show` (for example `show_called = true`) and assert it after the alert. That proves the client-side response check is what hid the work.

2. **Low, verification gap: the console/exception capture may never fire.** The `Runtime.consoleAPICalled` and `Runtime.exceptionThrown` listeners copy the existing spec's pattern. With capybara-playwright-driver, I can't confirm from the source that `page.driver.browser.on(...)` receives CDP `Runtime.*` events. If it doesn't, `expect(errors).to be_empty` passes without checking anything.
   - This applies to the existing tests too, not just this one.
   - Worth one canary check: run `execute_script("console.error('x')")` and confirm `errors` is non-empty.
   - These listeners also don't capture failed network resources. That's acceptable here because the alert assertions cover the network path.

3. **Mock scope is good.**
   - Only the `me` payload's `company.id` is converted to a string. Sessions, roles, the DB and Hiring requests stay real.
   - The `show` override is installed only after the real review persists, and that persistence is asserted (`record.reload.reviews.sole.outcome`).
   - `any_instance` stubs are class-level, so they reach the Capybara server thread, and rspec-mocks resets them at the end of the example.
   - The report that the original source failed under this test confirms the `me` mock actually takes effect.

4. **Optional cleanup:**
   - The admin half only proves the workspace loads; it doesn't exercise an admin mutation. Reviewer submission does cover a normalized-ID POST.
   - `directory` is nil-safe at the final screenshot, because Ruby hoists locals assigned inside an `if`.
   - `allow_any_instance_of` is usually flagged by `RSpec/AnyInstance`. Changed-file lint passed, so that cop is presumably disabled here.

## Context I couldn't check

- **Other entry points:** I can't confirm these are the only two places where `useUserContext().company.id` reaches Hiring `read`/`verifyWorkspace` callers. For example, a child component might read the context directly instead of using the `companyId` prop.
- **Test plumbing:** I didn't verify that `ReviewDetail` loads through `AssignmentReviewsController#show` via `read`, or that `original.receiver` is the controller instance under `and_wrap_original`. The passing focused run suggests both are true.

The broader Hiring browser run and the remaining 408 typecheck diagnostics are outside this review.
```

### Host assessment

Accepted the recommendation to record that the response wrapper ran. The final regression asserts that flag, the error alert and removal of previously visible private work. Independently confirmed the actual Cuprite driver and console observer with an emitted error event. The final 13-example run passes after this test strengthening.

The three company-ID props were inspected at their two routing roots; child calls receive those numeric props. No global company type, backend authorization or compiler configuration was broadened. The source consultation is not a combined-branch council review or release approval.

## Final source fingerprints

```text
7e90e0379341ef7a9fa03476744cc8aa68518e3135f332e2cf67b448aba062dc  app/javascript/src/components/Hiring/index.tsx
04cb018de1c53f09ebde027e3445b24690da571bcbd630a5bf996b239be70009  app/javascript/src/components/Hiring/AssignmentReviews.tsx
62a9612f551fe12ca0c73d677d71e38fc4b9777ca24f5cf2158f78d212d7943e  app/javascript/src/components/Hiring/AssignmentTemplateEditor.tsx
b2025aeefc2a879778bbd51cf991dc111900bab7192aeb901c18c2127ebca0e1  spec/system/responsive/hiring_assessment_review_spec.rb
```

Local screenshot fingerprints, not tracked or uploaded:

```text
77f32d88d7d5f367d1f2c0c65245297e9edd00a35d87ae6a12036c2aa15c5521  /tmp/miru-hiring-workspace-shots-20261106/reviewer-download.png
bd2898255e7ceb3a3bad2541b6d74ec7e07bbeff36883fa3577cfa30581ac52d  /tmp/miru-hiring-workspace-shots-20261106/admin-download.png
424274b4fd0fe868a43d5a505c6639e02009898c9d8f0d38764bcc1144879051  /tmp/miru-hiring-workspace-shots-20261106/string-workspace-review.png
d7d5a633ad33e0d473e8236bfd0a24e9ca98a01686a21dabc06add6acfce17ba  /tmp/miru-hiring-workspace-shots-20261106/workspace-mismatch.png
```

