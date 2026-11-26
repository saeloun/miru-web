# Salary effective-date browser evidence

[Synthetic browser capture](employee-records-scheduled-salary-2281.png) from [CI run 43781929598](https://github.com/saeloun/miru-web/actions/runs/43781929598), commit `2281b1d60383a8f569bd5d11b92874aa3b70a804`: current salary is 1,000 INR while the editable scheduled amount is 2,000 INR. The browser test also checked console errors; the full browser suite passed 440 examples.

This capture predates the “Salary settings” form-label clarification and the shared correction-resolution follow-up. It is evidence for that recorded revision, not final release or production verification. All people, contact details and salary values are synthetic test data.

The PNG is unchanged from the CI artifact: 551,922 bytes, SHA256 `82b0b676b127aa5b352ed292875de2e4160277815d8a0c8b589f2e5b89d0b2b5`.

## Salary-history review: 26 November 2026

These local Brave captures cover the administrator review introduced by #2533, including the narrow-screen layout correction committed alongside this evidence. All people, contact details and amounts are synthetic. No production salary decision or payment was made.

The browser journey checks a free-plan administrator opening the review warning, required choices preventing an incomplete submission, retaining the current INR 1,000 salary and abandoning the pending INR 2,000 raise. The saved profile returns to INR 1,000 while the original configured value remains stored. An employee sees the review warning without an administrator review link.

The mobile decision controls originally extended beyond the viewport. The new viewport assertion failed twice before the layout repair and passed afterward. The initial complete employee-record browser file passed 17 examples; the salary-review request file passed 11. The post-build targeted browser recheck passed two examples included in those 17, not additional coverage. Console-error checks passed for these journeys.

After merging current `develop`, source review also reproduced abandoned sparse salaries returning through the undated fallback, later edits recreating abandoned history, retire-only decisions escaping rollback protection, and a grouped report linking the wrong employment. The focused permanent regressions failed 10 examples/4 failures before repair and passed 10/0 afterward. The integrated selection now passes 202 examples, including the complete 18-example employee-record browser file and 12 salary-review request examples. These sets overlap. The new browser journey follows an older unresolved employment from a combined profitability row to its actual review form.

One earlier browser case raised an unexpected 401 and passed its isolated rerun; the final integrated run passes. An extra verification lane also deadlocked when request and browser suites shared the test database in parallel. Running those lanes serially passed without changing assertions. The required 30-second Vite command passes using its unchanged-input cache; frozen dependencies were refreshed after the merge. Hosted Linux CI remains required, not implied by these local results.

- [Desktop review form](review-20261126/salary-history-review-1440.png)
- [Mobile review form](review-20261126/salary-history-review-375.png)
- [Earlier clipped mobile form](review-20261126/salary-history-review-375-before.png)
- [Profile after administrator review](review-20261126/salary-history-reviewed-profile.png)
- [Employee warning](review-20261126/salary-history-employee-warning.png)
- [Older employment reached from a combined report](review-20261126/salary-history-older-employment.png)

These are synthetic local browser and request checks. Fresh pushed-head CI, the production inventory and the controlled rollout remain required under #2539.
