# Invoice PDF summary and ledger rounding — 6 November 2026

## DEBUG REPORT

- **Symptom:** A real one-minute fee at ₹60.30/hour records ₹1.01. After a ₹0.50 payment, the ledger correctly owes ₹0.51, but the PDF printed ₹1.00 subtotal/total.
- **Root cause:** The PDF used a separate three-decimal SQL aggregate followed by currency formatting; invoice accounting uses a Float sum rounded once to two decimals. These paths differ at half-cent boundaries.
- **Fix:** Extract the existing invoice subtotal expression into `Invoice.line_item_subtotal`. Both original model paths and the PDF now call it. The PDF's original Total reuses the formatted recorded `invoice.amount`. Remove the obsolete PDF calculation methods and two private-method tests; strengthen the existing rendered-locals check instead.
- **Evidence:** Final focused selection: **122 examples, 0 failures**. Four changed Ruby files pass RuboCop. Real PDF passes `qpdf --check`, is a one-page A4 document, reports no JavaScript, and was visually inspected.
- **Regression tests:** Actual controller/template/Brave PDF request with real synthetic bank-transfer settlement; invoice/payment attributes and sole payment remain unchanged after generation. An empty-invoice service example reloads the association before deleting lines and verifies zero subtotal/total.
- **Related:** Previous `invoice-pdf-balance-verification-20261106/report.md`; Sonam #2458's full consultant-invoice workflow remains unfinished.
- **Status:** **DONE_WITH_CONCERNS** for summary reconciliation. Individual line rounding, stale historical records, current-head council/CI and deployment remain open.

## Proof and scope

The preliminary isolated reproduction and the permanent request regression both fail against parent `e430ef014`: recorded ₹1.01/₹0.50/₹0.51 conflicts with the printed ₹1.00 subtotal/total. The permanent example asserts the known recorded amounts before the request and the parsed PDF summary afterward, then compares all invoice/payment attributes and payment count. This proves rendering does not reprice or resettle the invoice.

The model rule is preserved verbatim in substance: sum `(quantity.to_f / 60) * rate.to_f`, then `.round(2)`. Loaded records are mapped to quantity/rate pairs; the persisted path keeps its existing pluck order and empty-line guard. No global rounding mode, tax calculation, approval, callback, payment or database schema policy changes.

An intermediate subtotal reconstruction from gross plus discount minus tax was rejected: after all lines are removed, retained tax/discount fields can produce a negative subtotal. The strengthened empty-invoice example demonstrated the problem; the final shared-rule implementation passes. Its initial stale-association setup error was corrected before treating the permanent fractional-charge failure as root-cause proof.

### Remaining visible limitation

**The fractional example's individual line still displays ₹1.00, while the aggregate subtotal/total displays the recorded ₹1.01.** Line values retain existing currency formatting. This change does not allocate fractional cents between lines or introduce a new line-rounding policy. Do not call all line arithmetic reconciled, or this financial feature production-ready, on this evidence.

For stale historical invoices, recomputed subtotal/tax/discount may disagree with the recorded Total. Rendering the recorded amount preserves the ledger; it does not repair or validate those historical records. No cross-currency or statutory tax completeness is proved.

## Checks and artifacts

- Focused selection: invoice PDF requests/service, invoice and line-item models, invoice PDF generation/email; **122/0**. Log: `/tmp/miru-invoice-ledger-final-focused-20261106.log`.
- Full non-system backend: **5,706 examples, 0 failures, 59 pending**, 5m10s, after the final application/spec edits. Command: `bundle exec rspec --exclude-pattern 'spec/system/**/*' --fail-fast`. Log: `/tmp/miru-backend-ledger-pdf-final-20261106.log`. The synthetic database was isolated, outbound network denied except localhost, and no temporary reproduction/mutation helper loaded.
- Reproduction logs: `/tmp/miru-half-cent-repro-red-20261106.log`, `/tmp/miru-half-cent-permanent-red-20261106.log`; rejected intermediate empty-invoice probe: `/tmp/miru-invoice-empty-subtotal-red-20261106.log`.
- The two removed tests called private calculation methods directly. Exact rendered totals are now checked in the existing locals example and the real PDF regression.
- Synthetic final PDF: `tmp/invoice-download-fractional.pdf`; inspected image: `/tmp/miru-invoice-ledger-fractional-20261106.png`. These are local artifacts, not uploaded screenshots or customer documents. The renderer path was verified to select the configured Brave binary.
- No JavaScript/TypeScript changed. No frontend build, authenticated application E2E, real email, provider transfer or production deployment was performed for this unit.

## Source consultation

Local Qwen completed a bounded advisory response, but made unsupported claims about private methods providing audit history; no generated patch was used. Codex implemented and tested the change. Fresh tools-disabled Claude analysis found no blocking defect and confirmed that the original arithmetic, zero-line guard and callbacks are preserved. Its two low findings are explicitly retained above: stale historical amount mismatch and per-line rounding. The existing `InvoiceLineItem` destroy callback was inspected and the empty-invoice test executed; a fresh caller search found no other production references to the removed private PDF methods. Email/download/reminder paths share this service.

The existing freeze boundary belonged to another task and was preserved. Functional edits are limited to `Invoice`, its PDF service, and two existing specs. This report is the fifth changed file. No migration, secret access, public code push, merge, GitHub review reply or financial action occurred.

## CLAUDE CODE SAYS (consult)

Model: claude-opus-5-5; session `4d1542dd-c9c6-4fa4-a21b-97f831d8c18c`.

```tool-output
**Verdict: no blocking defects found in the supplied diff.** Neither the existing rounding rule nor the approval/callback handling is changed.

**Rule preservation (verified by reading the diff)**
- `Invoice.line_item_subtotal` (`app/models/invoice.rb:130-132`) uses the same Float `(q/60)*r` sum and `.round(2)` as before.
- Both callers (`invoice.rb:325`, `invoice.rb:334`) keep their argument order. The zero-line guard at `:332` is untouched. An empty `values` still returns `0`, as before.
- `calculate_amounts`, `skip_line_item_total_sync`, `totals_recalculation_needed?`, `sync_invoice_tax_amounts` and `total_attributes_for` are unchanged.
- The PDF service only plucks and formats. It does not call `sync_invoice_tax_amounts` or anything else that writes.

**Findings**

1. **Low** (`app/services/pdf_generation/invoice_service.rb:25,35`): Sub total is recomputed from line items, but Total is the persisted `invoice.amount`.
   - For legacy or stale rows where `amount` no longer matches the lines, the printed Sub total − Discount + Tax will not add up to the printed Total.
   - The old code was internally consistent but disagreed with `amount_due`. The new code matches the ledger.
   - This is an acceptable trade-off, but it is a real visible behavior change for stale invoices.

2. **Low / scope** (`app/services/pdf_generation/invoice_service.rb:41-43`): The stated scope limit is visible in the regression case.
   - The single line row is formatted by `InvoiceLineItemPresenter` at currency precision. It may print ₹1.00 (1.005 half-even) under a Sub total of ₹1.01.
   - The new request spec does not assert the line-row value, so this mismatch is neither pinned nor guarded.

3. **Info** (`spec/services/pdf_generation/invoice_service_spec.rb:235-244`): The expected `total: "$0.00"` depends on a line-item destroy callback syncing `invoice.amount` to zero through the zero-line guard. That callback is not in the supplied source.
   - Under the old code, Total would have printed $50.00 (0 + 100 − 50).
   - The new $0.00 matches the existing zero-line ledger rule. It is a behavior change, but a correct one.

4. **Info**: I cannot confirm from this material that nothing else calls the removed private `calculate_subtotal` or `calculate_total` (for example a subclass), or that the controller reloads the invoice from its scoped query. Both are stated, not shown.

**Scope limits (precise)**
- No fractional-cent allocation between lines.
- Sub total is a live recomputation; Total, Paid and Due come from persisted columns.
- No tax, foreign-currency or snapshot semantics are introduced.
- Multi-tax rows still come from persisted `invoice_taxes.amount`.

No tests were run here, and this review is not council approval.
```

## Final source fingerprints

```text
73ae4885e12c1f2648e0b9174e81387755f907073a5ff5670487983c95e2a08c  app/models/invoice.rb
f6d836f8197d77eacc1dbc7c9d2cd16048648b71dcb7becf259b2c051c1dbf0c  app/services/pdf_generation/invoice_service.rb
4b80619d648ca6312b15449acb125f988b13c2ae44c29cac065c66f231644ba4  spec/requests/api/v1/invoices/pdf_download_spec.rb
1a25a47bb330b515213268c09aac50f08ce06d7ef92b119dd567d19e14d84361  spec/services/pdf_generation/invoice_service_spec.rb
```
