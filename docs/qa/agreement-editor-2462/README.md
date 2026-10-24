# Agreement authoring evidence — implementation in progress

Part of #2462; not a complete agreement/signing workflow. Current code provides encrypted structured masters and independent drafts, owner/admin-scoped authoring APIs, typed fields, bounded DOCX preview import, party lookup, optimistic conflict rejection, metadata-only edit/download audits and private DRAFT PDF export. The rich-text/field UI, autosave/recovery, reviews/approvals and signing are not delivered by this checkpoint.

## Verification

Focused service/model/request command: `RAILS_ENV=test DATABASE_URL=<isolated local test DB> BROWSER_PATH=<installed Brave executable> rtk mise exec -- bundle exec rspec spec/services/agreements spec/models/agreement_template_spec.rb spec/models/agreement_spec.rb spec/requests/api/v1/agreement_templates_spec.rb spec/requests/api/v1/agreements_spec.rb` — **103 examples, zero failures**. The preceding API checkpoint also passed 12 existing policy/client regression examples. Expected invalid-page400, malformed-root400 and CSRF422 negative cases emit framework error logs; these are not production incidents. Thirteen changed Ruby files passed lint. Required Vite build passed during fresh-worktree setup; no app JS change exists yet.

Initial missing-domain run42/42 failed, then domain58/0 including existing regression cases. Missing-API/filter run20/19 failed. Follow-up tests exposed and fixed missing body-only edit audits, missing company-address crashes, missing consultant-address prefills and fractional heading levels. Discarded membership expectations use the real Devise401 behavior with JSON Accept; metadata-only audit expectations include update timestamps. The real PDF request restores Ferrum's constructor because the suite otherwise substitutes a global fake PDF browser.

Actual short/long PDFs were generated with the same validated renderer and Rails template used by the download endpoint. Poppler reported **2 and25 A4 pages**, tagged PDFs, no PDF JavaScript. Text extraction verified DRAFT, first/last clauses, filled field values, escaped punctuation and Devanagari. The short first page and long first/last pages were rendered and visually inspected: long legal names wrap, tables fit and Devanagari glyphs render. All content is explicitly synthetic; no production contract, mail, signing or payment was used.

## Export measurements

Local arm64 macOS, Ruby4.0.9 and headless Brave155; sequential service calls, fresh browser per export, system cache/network conditions not controlled. Timing includes document validation, HTML rendering, browser startup and PDF generation. These are local single-run measurements, not latency guarantees or cold-machine/load benchmarks.

| Document | Declared/placed fields | JSON bytes | PDF bytes | Export seconds |
| --- | --- | --- | --- | --- |
| 2-page short | 60 / 4 | 3,897 | 46,139 | 0.755 |
| 25-page first long export | 60 / 60 | 49,861 | 149,401 | 0.680 |
| 25-page repeat long export | 60 / 60 | 49,861 | 149,401 | 0.663 |

Editor readiness, typing, field manipulation, autosave, mobile and concurrent-browser behavior remain unmeasured. Full suite/CI, independent review and production deployment remain pending for the final feature.

## DOCX import evidence

The two synthetic DOCX fixtures in `spec/fixtures/agreements` were generated independently with docx9.14.0 in a temporary tool directory, without adding an application dependency. They exercise Word default styles, split-run placeholders, headings, nested lists with explicit starts, tables and page breaks. Their imported Miru PDFs contain exactly 2 and25 A4 pages; extracted text includes all60 long-document fields, the final clause and Devanagari. Imported long pages1 and25 were visually inspected for wrapping, field formatting and overflow.

| Imported document | DOCX bytes | Placed fields | Import seconds | PDF bytes | Export seconds |
| --- | --- | --- | --- | --- | --- |
| Short | 10,424 | 4 | 0.0037 | 50,178 | 0.5900 |
| Long | 11,076 | 60 | 0.0311 | 161,328 | 0.5487 |

Same local environment and single-run limits as above. Import accepts up to5MiB compressed,200 entries,2MiB per expanded part and10MiB total expanded XML. Unsupported tracked changes, dynamic fields, links, images, embedded objects and substantive headers/footers/notes fail visibly; import never overwrites a saved master. Fonts, colors, spacing, page sizes and table widths normalize to Miru with a preview warning. Original Word/LibreOffice rendering was not available, so this is no lossless layout or round-trip claim. Linux/container font behavior remains a release check. Archive queries select only metadata columns, without loading encrypted bodies or field values.

## Artifacts

- [Short draft PDF](agreement-short.pdf)
- [25-page draft PDF](agreement-long.pdf)
- [Short first page](short-page1.png)
- [Long first page](long-page1.png)
- [Long last page](long-page25.png)
- [Imported short draft PDF](agreement-import-short.pdf)
- [Imported 25-page draft PDF](agreement-import-long.pdf)
- [Imported long first page](import-long-page1.png)
- [Imported long last page](import-long-page25.png)

This feature uses additive tables with restricted references. Application rollback must preserve populated tables and encryption keys. Draft content remains editable and has no approval/signature authority; immutable sent/signed versions are a later required unit. Do not close #2462 from this checkpoint.
