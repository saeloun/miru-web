# Salary effective-date browser evidence

[Synthetic browser capture](employee-records-scheduled-salary-2281.png) from [CI run 43781929598](https://github.com/saeloun/miru-web/actions/runs/43781929598), commit `2281b1d60383a8f569bd5d11b92874aa3b70a804`: current salary is 1,000 INR while the editable scheduled amount is 2,000 INR. The browser test also checked console errors; the full browser suite passed 440 examples.

This capture predates the “Salary settings” form-label clarification and the shared correction-resolution follow-up. It is evidence for that recorded revision, not final release or production verification. All people, contact details and salary values are synthetic test data.

The PNG is unchanged from the CI artifact: 551,922 bytes, SHA256 `82b0b676b127aa5b352ed292875de2e4160277815d8a0c8b589f2e5b89d0b2b5`.

## Salary-history review: 26 November 2026

These local Brave captures cover the administrator review introduced by #2533, including the narrow-screen layout correction committed alongside this evidence. All people, contact details and amounts are synthetic. No production salary decision or payment was made.

The browser journey checks a free-plan administrator opening the review warning, required choices preventing an incomplete submission, retaining the current INR 1,000 salary and abandoning the pending INR 2,000 raise. The saved profile returns to INR 1,000 while the original configured value remains stored. An employee sees the review warning without an administrator review link.

The mobile decision controls originally extended beyond the viewport. The new viewport assertion failed twice before the layout repair and passed afterward. The complete employee-record browser file passes 17 examples; the salary-review request file passes 11. The post-build targeted browser recheck passes two examples that are included in those 17, not additional coverage. Console-error checks pass for these journeys. The required 30-second Vite command exits successfully using the existing unchanged-input build cache.

- [Desktop review form](review-20261126/salary-history-review-1440.png)
- [Mobile review form](review-20261126/salary-history-review-375.png)
- [Earlier clipped mobile form](review-20261126/salary-history-review-375-before.png)
- [Profile after administrator review](review-20261126/salary-history-reviewed-profile.png)
- [Employee warning](review-20261126/salary-history-employee-warning.png)

These are synthetic local browser and request checks. Fresh pushed-head CI, the production inventory and the controlled rollout remain required under #2539.
