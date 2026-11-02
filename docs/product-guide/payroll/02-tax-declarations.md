---
id: tax-declarations
title: Tax declarations
---

Open **Tax declarations** to record INR deduction/exemption claims and proof for your employer. The supported periods are FY 2025-26 / AY 2026-27 and TY 2026-27. Familiar legacy section labels identify claim categories; they do not establish current-year eligibility or limits.

Choose **Add declaration**, select the year/category, enter the claimed amount and relevant details, then **Save draft**. A draft can be an estimate without proof. Submission requires at least one document: up to five PDF, JPEG or PNG files, each 5 MiB or smaller. Use **Create correction** to change saved details or add/remove proof; saved versions and their documents remain in history. When correcting, choose whether to keep the previous documents and attach additional files if needed.

Choose **Submit for review** once your proof is ready. An owner/admin other than the claimant can download proof and approve a reviewed amount, reject the claim or request more information. Every decision requires a reason; an approval must be positive and cannot exceed the claimed amount. General manager/bookkeeper access does not allow reviewing or viewing coworkers' claims. Owners/admins can see company declarations, including drafts; other staff see only their own in the current workspace.

Only the latest submitted version can be reviewed. If a correction is requested, create and submit a new version; follow **Previous version** and **Next version** for earlier evidence and decisions. One version has at most one correction, so continue from the latest version. An existing approval remains in effect while a correction is pending; approving its replacement withdraws the earlier approval. This record does not apply a payroll tax benefit automatically.

Claimants can withdraw their own versions. Withdrawal retains the proof, amount and decision history; it does not reopen an earlier version or undo an already processed payroll. Administrators cannot withdraw coworkers' versions. Employment/workspace deletion follows Miru's existing deletion behavior and removes associated declarations and attachments.

Documents require authenticated downloads and have no public sharing links. Workflow changes and downloads enter the company audit log; claim amounts, details and review reasons are excluded from those audit payloads and filtered from request parameters. Proof/claim responses use private, no-store caching.

Approval is a manual employer review record. Miru does not yet calculate statutory eligibility, shared deduction caps, PF, salary TDS, net pay or return amounts from these declarations. No return is filed and no Form 16/130 certificate is issued by this workflow. Reimbursements continue through **Expenses**; scheduling them into payroll and preventing duplicate payroll/direct settlement is a separate planned capability.

Payroll-enabled workspaces also offer a separate [India annual tax estimate](04-india-tax-estimates.md). It compares supported salary/interest projections from manually entered eligible inputs; it does not apply these reviewed claims automatically.
