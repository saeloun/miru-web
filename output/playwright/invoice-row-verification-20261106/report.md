# Invoice row lookup verification, 2026-11-06

Candidate: `feature/sonam-release-integration-20261104`, production source unchanged from `fbc41ac62`. This repair changes only the shared browser-test helper, its regression spec, and the existing CI browser selection. Final source fingerprints are in `SHA256SUMS`.

## DEBUG REPORT

Symptom: The general native Brave run stopped at 142 examples when `find_invoice_line_item_row` raised `Cuprite::ObsoleteNode` between locating a name field and its ancestor row. A natural isolated replay passed once; this was not treated as proof of stability.

Root cause: Two individually synchronized lookups did not cover the complete logical read. With automatic element reloading disabled, the second lookup retained a detached field. An initial document-level wrapper fixed that window, but an independent review and a second forced browser probe exposed the same problem after the row returned to its caller.

Fix: `with_invoice_line_item_row` keeps lookup and the yielded operation within one document synchronization boundary. Its three callers extract the row key, assert the name, or click removal inside that boundary. Capybara's native assertion preserves matcher-miss recovery. Existing 10-second limits remain 10 seconds; there is no whole-example retry or global configuration change. The existing CI browser job now includes `spec/system/invoices`; its check name, permissions and 30-minute limit are unchanged.

Regression test: `spec/system/invoices/line_item_row_lookup_spec.rb` forces real DOM replacement after the name lookup and after the row lookup. It asserts the injection occurred and the current row retains its identity. No production seam, fake stale-node exception, or API mock is added. The deliberate cloned row is only read afterward; this does not simulate post-click side effects.

## Native evidence

All browser commands ran with native Brave/Cuprite, synthetic records, dedicated local test databases and a localhost-only network sandbox. No real provider request, email, transfer or production change was performed.

| Input and check | Observed result |
| --- | --- |
| Original helper on refreshed `origin/develop` `10e457e1`, identical one-case forced probe, 10 fresh processes | 10/10 failed with the same obsolete-node error |
| Original helper on candidate `fbc41ac62`, same probe and helper hashes, 10 fresh processes | 10/10 failed with the same obsolete-node error |
| Initial document wrapper, same one-case probe, 10 fresh processes | 10/10 passed |
| Intermediate wrapper, expanded two-case probe | 2 examples, 1 failure in the caller assertion |
| Yielding guard before native-assertion refinement, two-case probe, 10 fresh candidate processes | 20 examples across 10 runs, 0 failures |
| Final yielding guard, entire invoice directory before the native-assertion review refinement | 96 examples, 0 failures |
| Entire invoice directory after the last native-assertion edit | 96 examples, 0 failures, exit 0 |
| RuboCop for both changed Ruby files | 2 files inspected, no offenses |
| Required `RAILS_ENV=test rtk mise exec -- timeout 30 bin/vite build` | Exit 0; reused the unchanged November 4 asset build. No fresh compilation claimed |
| Workflow YAML parse, exact browser-command assertion and structural comparison | Passed; only the intended browser step changed |
| Prettier workflow check | Existing formatting warning reproduced on unchanged develop and candidate; no broad formatting rewrite applied |

Initial probe SHA-256: `d78c05a1c133179b660b3e0fc0392b313bed76a79c3b36c0e7a3b0e2de4fe782`. Original helper: `9e212a2d448ce713f742407ace81e66228ee2263413f87a9c3b8f5f53369c209`. Both were identical in the baseline and candidate red arms. Final two-case probe: `047b7465f82d022deb995fb8e5b8c28975ec6969d3bb5b6e987f02fc4661ec65`.

Value: protects=logical invoice-row reads survive DOM replacement without accepting the wrong row; fails_when=lookup or its caller retains a detached element; why_new=natural invoice tests did not force the replacement window; seam=none in production; no_claim=provider acceptance, arbitrary DOM races, or post-click recovery.

## Flake evidence and CI coverage

The forced lookup defect failed 10/10 on both develop and candidate. These are conditional forced-replacement counts, not estimates of natural failure frequency or arbitrary product-regression detection. The same one-case probe remained unchanged for the first red/green comparison; the second case then verified the adjacent caller window.

The earlier expanded CI selection passed 248 examples with the intermediate wrapper. The general browser selection subsequently reached 333 examples, 1 failure, 2 pending; its invoice failure was gone, but `spec/system/settings/automation_spec.rb:21` expected an obsolete CLI password argument. Neither run is claimed as an exact-final-source full-suite pass.

Twenty recent successful develop validation runs were inspected as metadata. The candidate has no published CI run. The existing workflow excluded general system specs and ran only responsive, expense and authentication browser paths, so those historical green checks cannot date or clear this invoice failure. The latest inspected completed validation log `41556730756` confirms `--exclude-system`. No first-bad CI revision or flake rate is invented. Routing: fix the test-helper boundary and add missing invoice CI coverage in this candidate.

## Review assessment

Two source-only Claude reviews used `claude-opus-5-5`; they are advisory and do not satisfy the release council gate. The first identified the caller window; the second found no High/Medium defects and two Low items. The native assertion suggestion was applied. The forced-probe coverage remains limited to reading; normal update/removal flows are included in the invoice-directory run.

The earlier claim that cloning copies only input attributes was rejected: the [HTML Standard's input cloning steps](https://html.spec.whatwg.org/multipage/input.html#the-input-element) propagate current value and its dirty flag. An auxiliary standalone native browser probe timed out during browser initialization, so it supplies no additional clone-value evidence.

Status: DONE_WITH_CONCERNS. The final invoice recheck passed. Publication still needs the exact-head council reviews; the broader CLI expectation, unfinished payroll acceptances and live provider/production verification remain open. No new UI screenshot is claimed for this test-only repair.


## CLAUDE CODE SAYS (review), initial source snapshot

````tool-output
# Review: invoice row lookup retry + CI expansion

**Verdict:** No P1s. One P2 and three P3s. The two-line wrapper is a sound fix for the race it targets. The P2 is that the same re-render can still hit the row *after* the helper returns.

## [P2] The returned row can still go stale in its callers

`spec/support/invoice_editor_system_helpers.rb:210-214`, with callers at `:207` and `:217-218`.

The wrapper retries only the window between the name lookup and the ancestor lookup. The caller still gets a plain node reference.

You've said `automatic_reload` stays false. In that case `Node::Base#synchronize` on the returned row will retry `Cuprite::ObsoleteNode` but never reload. A row replaced after return fails at the full 10-second timeout instead of recovering.

Two callers use the row right away:

- **`expect_invoice_line_item` (`:217-218`).** It is reached through `commit_pending_manual_line_item` right after Enter, the same post-commit re-render window as the observed failure. `expect(row).to have_field(...)` is the next query on the returned node. That assertion is also largely redundant, because the row was found by containing that field.
- **`remove_invoice_line_item` (`:207`).** It calls `.find("#deleteLineItemButton").click` on the returned node. It has the same exposure.

`update_invoice_line_item` (`:176-203`) already avoids this. It reads `data-line-item-row-key` once and re-finds by selector before each interaction.

Either fix would close the gap without loosening timing:

- Apply that key-based pattern to `remove_invoice_line_item`, and drop or fold the redundant `have_field` in `expect_invoice_line_item`.
- Or move the follow-up query inside the same `synchronize` block.

The new probe won't catch this, because it deliberately only reads the row after the lookup.

## [P3] The inner `wait: 10` no longer does anything

`spec/support/invoice_editor_system_helpers.rb:212`

Inside the outer `synchronize`, `session.synchronized` is true, so the inner `find` yields once and its `wait: 10` is ignored. The effective budget is the outer 10 seconds, which matches your summary.

A reader could take the inner value as a separate 10-second budget, or expect that tuning it changes behavior. Dropping it, or relying on the outer value alone, would make the timing source clear.

## [P3] The probe depends on React syncing the `value` attribute

`spec/system/invoices/line_item_row_lookup_spec.rb:27-30`, `:35`, `:38`

`cloneNode(true)` copies attributes but not the live `value` property. After the swap, the retry lookup `find(:fillable_field, with: "Replaced row")` and the assertion at `:38` both only match because React mirrors controlled-input values into the `value` attribute.

If the app or React ever stops syncing that attribute, the probe would fail with ElementNotFound. That would look like a regression in the helper rather than a broken probe. A one-line note in the spec, or setting `.value` on the cloned input in the script, would make the dependency explicit.

## [P3] The probe leaves React's DOM out of sync for the rest of the example

`spec/system/invoices/line_item_row_lookup_spec.rb:27-30`

After `replaceWith`, React's fiber still points at the detached row. You note the test itself makes no further mutations. But any app-driven update that touches that row before teardown could raise a DOM `NotFoundError` in the browser, such as a debounced effect, a blur/focus handler, or an autosave. Examples would be a pending focus or blur from `send_keys(:enter)`, or a delayed state update.

This only matters if spec support collects JS console errors. I can't see from the supplied material whether it does.

## Things I checked that are fine

- **Retry mechanics.** Capybara 3.40's `catch_error?` defaults to `driver.invalid_element_errors + [ElementNotFound]`, so the outer block retries ObsoleteNode and genuine not-found cases. `Capybara::Ambiguous` subclasses ElementNotFound, so it is retried and then raised, the same as the old `find`.
- **Probe guards.** The `replaced` flag stops repeated injection on retries. `expect(replaced).to be(true)` makes the probe fail loudly if the helper stops calling `find(:fillable_field, with:)` through `self`.
- **Workflow YAML.** The `>-` folded scalar joins the two lines with a single space, the indentation is consistent, and only the step name changed, not the job or check name.

## Missing context, not findings

- **Runtime.** I can't tell from the diff whether adding all of `spec/system/invoices` fits inside the unchanged 30-minute timeout. The running CI result is the only real evidence.
- **Why invoices were excluded.** I don't know the reason, for example known flakiness or slowness, or whether another job already runs these specs. If another job does, they would now run twice.
````

## CLAUDE CODE SAYS (review), yielding-guard snapshot

````tool-output
# Review: bounded invoice row-lookup helper repair

**Verdict:** I found no High or Medium defects, but there are two Low findings below, so this is not NO_FINDINGS. This is a static, advisory review only. It is not council approval and not proof of production behaviour. I haven't assumed anything about the repeated candidate probe or the full invoice browser run that are still in progress.

## Findings

**Low 1: In `expect_invoice_line_item`, a failed assertion is never retried** (`spec/support/invoice_editor_system_helpers.rb:217`)

- `expect(row).to have_field(...)` reports a mismatch by raising `RSpec::Expectations::ExpectationNotMetError`. That error inherits from `Exception`, not `StandardError`.
- Capybara's `synchronize` only catches `StandardError`, then retries if the error is `Capybara::ElementNotFound` (which includes `ExpectationNotMet`) or one of the driver's stale-element errors. An RSpec matcher miss therefore escapes on the first attempt.
- Recovery from a replaced row depends on Cuprite raising a stale-element error such as `ObsoleteNode` for the detached row. If it instead evaluates the detached node as "not visible", the matcher simply fails and nothing retries.
- Your final probe suggests Cuprite does raise the stale-element error on this path. Still, the retry currently depends on driver behaviour rather than on the helper itself.
- Suggested fix: `row.assert_selector(:field, type: "text", with: name)`. It raises `Capybara::ExpectationNotMet`, which the outer `synchronize` does retry, and it keeps the same intent.
- Side note: the row was located through the very field this assertion checks, so the assertion mainly serves to touch the node. That is fine, just worth knowing.

**Low 2: The probe only exercises the `expect` caller** (`spec/system/invoices/line_item_row_lookup_spec.rb:43`)

- Both replacement cases go through `expect_invoice_line_item`. Neither `remove_invoice_line_item` nor `update_invoice_line_item` is driven through a forced replacement.
- `remove` matters most, because its block ends with a side-effecting `click`.
- I found no concrete failure path for it with Cuprite:
  - The mouse-event check runs before the click is dispatched.
  - A retry after a successful delete would search by name, find nothing, and time out with an error. It would not delete a different row.
- So this is a coverage gap rather than a demonstrated defect.

## Checked and not flagged

- **Nested `synchronize`:** inner `find`, `[]`, `click` and matcher calls short-circuit while the session is synchronized. Removing the inner `wait:` arguments is therefore correct; they had no effect.
- **`yield` inside the `synchronize` block:** it correctly targets the helper's own block, and the block's return value comes back through. This is how `update` gets `row_key`.
- **Later accesses in `update`:** they re-find the row by key on each step, and `set` gets Capybara's element-level automatic reload.
- **Probe stubbing:**
  - The name case stubs the example's DSL `find`.
  - The row case stubs `Capybara::Node::Element#find`. The document-level `find` is not an `Element`, so it isn't intercepted.
  - Ruby's `&&` vs `?:` precedence on line 26 gives the intended condition.
  - The `replaced` flag makes any future helper rewrite fail loudly instead of passing silently.
  - Line 45 confirms there is still exactly one row.
- **Clone values:** I agree with your reading of the WHATWG cloning steps; the earlier "attributes only" claim was wrong.
- **CI workflow:** the `>-` folded scalar joins into one command, and the job's name, permissions and dependencies are unchanged.

## Not verified

- Whether the larger browser selection fits inside the 30-minute job budget. That depends on the pending invoice-directory run.
- The outcomes of the repeated candidate probe and the full invoice spec run.
- Whether the project's RuboCop config enables `Style/MultilineTernaryOperator`. Line 26 would trip it if so, though you reported RuboCop passing.
````
