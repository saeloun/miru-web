# Agreement authoring evidence — implementation in progress

Part of #2462; not a complete agreement/signing workflow. This local branch provides encrypted structured masters and independent drafts, owner/admin-scoped authoring, full body/table/field editing, identity and payment field presets, bounded DOCX preview import, party lookup, autosave, conflict recovery, metadata-only edit/download audits and private DRAFT PDFs. Mobile fields open in a focused dialog. Reviews/approvals, sent locks, signing and immutable completed artifacts remain separate work. No deployment is claimed here.

## Verification

CI follow-up: nine Reek warnings in the new validator/importer were resolved by separating node children, package checks, numbering, runs, placeholders and table cells into focused methods. No rule was disabled. The combined local suite passes **155 examples, zero failures** again; the final parser/validator check passes **57 examples, zero failures**, and the full CI Reek command and focused RuboCop pass. A temporary extraction error was caught by the focused tests and corrected before commit. DOCX limits, rejections and formatting contracts remain covered.

The security audit also required updating the existing docs `serialize-javascript` pin to **7.1.3** and mobile CLI `undici` pin to **6.29.1**, with narrowly regenerated lockfiles. See the [serialization advisory](https://github.com/advisories/GHSA-m5mm-p8h7-m29v), [EventSource advisory](https://github.com/nodejs/undici/security/advisories/GHSA-4qv8-2p9j-2685) and [content-encoding advisory](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c). Root/docs audits pass with no known vulnerabilities; mobile exits successfully with one previously ignored advisory still reported. No ignore was added. Frozen installs, the docs production build, mobile TypeScript check and mobile web export pass. The docs build retains existing unresolved Markdown-link warnings. Native iOS/Android builds were not run. Remote CI and CodeRabbit still need to pass on the final revision.

The current combined agreement service/model/request, middleware and browser command passes **155 examples, zero failures**. The field validation, mobile controls, lookup/create recovery and PDF failure/retry regressions described below are included. The required Vite build and focused Ruby/JS lint pass. The earlier API-only checkpoint command was `RAILS_ENV=test DATABASE_URL=<isolated local test DB> BROWSER_PATH=<installed Brave executable> rtk mise exec -- bundle exec rspec spec/services/agreements spec/models/agreement_template_spec.rb spec/models/agreement_spec.rb spec/requests/api/v1/agreement_templates_spec.rb spec/requests/api/v1/agreements_spec.rb` — **103 examples, zero failures**. That checkpoint also passed 12 existing policy/client regression examples. Expected invalid-page400, malformed-root400 and CSRF422 negative cases emit framework error logs; these are not production incidents.

Initial missing-domain run42/42 failed, then domain58/0 including existing regression cases. Missing-API/filter run20/19 failed. Follow-up tests exposed and fixed missing body-only edit audits, missing company-address crashes, missing consultant-address prefills and fractional heading levels. Discarded membership expectations use the real Devise401 behavior with JSON Accept; metadata-only audit expectations include update timestamps. The real PDF request restores Ferrum's constructor because the suite otherwise substitutes a global fake PDF browser.

Actual short/long PDFs were generated with the same validated renderer and Rails template used by the download endpoint. Poppler reported **2 and25 A4 pages**, tagged PDFs, no PDF JavaScript. Text extraction verified DRAFT, first/last clauses, filled field values, escaped punctuation and Devanagari. The short first page and long first/last pages were rendered and visually inspected: long legal names wrap, tables fit and Devanagari glyphs render. All content is explicitly synthetic; no production contract, mail, signing or payment was used.

## Export measurements

Local arm64 macOS, Ruby4.0.9 and headless Brave155; sequential service calls, fresh browser per export, system cache/network conditions not controlled. Timing includes document validation, HTML rendering, browser startup and PDF generation. These are local single-run measurements, not latency guarantees or cold-machine/load benchmarks.

| Document | Declared/placed fields | JSON bytes | PDF bytes | Export seconds |
| --- | --- | --- | --- | --- |
| 2-page short | 60 / 4 | 3,897 | 46,139 | 0.755 |
| 25-page first long export | 60 / 60 | 49,861 | 149,401 | 0.680 |
| 25-page repeat long export | 60 / 60 | 49,861 | 149,401 | 0.663 |

Those API-only measurements did not cover editor behavior. Later browser evidence follows; full CI, independent review and deployment remain pending.

## Editor verification

Final implementation completion passed **145 examples, zero failures**. The fresh independent branch review then found one important import defect: a tracked row deletion could hide inside ignored table properties and return as live text. Revision markers now reject at the shared XML boundary before any property subtree is skipped. Deleted/inserted rows and ignored properties in both supported Word namespaces failed3 cases before the fix and passed afterward; the final fix run passed **148 examples, zero failures**, with focused Ruby lint clean. [Microsoft's row-deletion reference](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.deleted?view=openxml-3.0.1) documents that representation. Accept or reject tracked changes in Word before import.

The recoverable field-configuration review minor is now fixed. Changing a populated draft field's type, or removing its selected dropdown option, stays in the field dialog with a clear instruction to explicitly clear the current value first. The saved value and field definition remain intact; compatible dropdown edits and master editing remain available. A real Brave regression failed before the guard and passes afterward, including explicit clear/change/save and master isolation. The combined suite now passes **149 examples, zero failures**. Independent review does not replace the remaining Council, CI, CodeRabbit or release checks.

The later combined agreement service/model/request, middleware and browser run passed **144 examples, zero failures**, including8 agreement browser scenarios and14 existing navigation/login/client browser cases. They cover rich clauses, tables and page breaks; field types/roles/required/read-only configuration and removal/undo; independent client/consultant drafts; identity prefills; signature placeholders that cannot manufacture signatures; Word preview/cancel/replacement and rejected uploads; real PDF download; concurrent browser sessions; failed/in-flight autosaves; recovery/reload; mobile field controls and widths320/375/1440; denied staff access; workspace switching blocked before session mutation and allowed after leaving. Console errors are asserted empty. The exact required Vite build and focused Ruby/JS lint passed. Repository-wide TypeScript checking is not green; the compatible ESNext/skipLibCheck run reported no errors in the changed modules.

Browser Unicode save/reopen exposed an existing request middleware defect: ASCII-8BIT-labelled UTF-8 was stripped, and the old UTF-16 test only checked encoding validity. Content-based RED/GREEN regressions now preserve Unicode through whole-body and line readers and URLs, correctly transcode known UTF-16 strings, and retain raw byte-limited reads so callers can assemble split characters. Browser round trips preserve Devanagari; middleware regression values also include accented text.

Headed Brave on local arm64 macOS/Ruby4.0.9, one Falcon worker, isolated synthetic database, `RAILS_ENV=test`, optimized test assets. Cold means cleared browser cache, not a cold machine; warm repeats a full route navigation. These are single local observations, not production/load guarantees. The independent DOCX fixtures provide2-/25-page inputs with4/60 placed fields.

| Input | Width | Cold readiness ms | Warm readiness ms |
| --- | --- | --- | --- |
| Short | 1440 | 934 | 832 |
| Short | 375 | 927 | 832 |
| Long | 1440 | 925 | 836 |
| Long | 375 | 921 | 830 |

| Long input typing | Input events | Next-frame p50 ms | p95 ms | Max ms | After typing to saved ms |
| --- | --- | --- | --- | --- | --- |
| 1440px | 62 | 4.2 | 7.8 | 8.5 | 1292 |
| 375px | 61 | 3.8 | 8.1 | 9.2 | 1293 |

Typing measures beforeinput-to-next-animation-frame, not full paint latency; save includes the800ms debounce. All60 fields survive each long-document load; neither viewport has horizontal overflow. The four initial master screenshots were captured through Playwright and visually inspected. The later mobile draft screenshot shows the corrected full-width title and separate action row. Actual device software-keyboard behavior, Linux fonts, full CI and deployment still require verification. [Raw measurements](editor-performance.json) retain the unrounded values. The initial preview servers stopped after a few minutes; failed connection/expired-session attempts were excluded, and the reported measurements completed against the single-worker server after normal UI sign-in.

A further real headless-Brave/Cuprite workflow edits a field in the60-field contract at375px, generates a client draft, saves `आनंद & Núñez Private Limited` and downloads the actual PDF. Field-dialog opening took190ms, field-settings opening203ms and PDF download608ms, including browser-driver interaction. The PDF has25 tagged A4 pages, no PDF JavaScript, and all first/last clauses and unresolved-field labels; its first/last pages were rendered and visually inspected. Values wrap without overflow. [Raw dialog/download timings](editor-long-ui-performance.json) describe that separate environment. This case also exposed a mobile title squeezed by action buttons: its width assertion failed before the layout fix and passes afterward. A test viewport reset during sign-in was corrected by resizing and asserting375px after authentication.

## Design review fixes

The design review found three concrete defects, now fixed: undersized mobile controls, a missing counterparty-search Retry action, and toolbar semantics that did not match ordinary Tab navigation. Scoped agreement styles give controls and clickable checkbox/radio labels a 44px minimum; portal dialogs include the close affordance and reserve header space. Shared app primitives remain untouched. Formatting controls are a labeled group with ordinary Tab navigation.

Real Brave checks failed for 36px toolbar buttons and the missing Retry search button, then passed after the fixes. The dialog geometry check waits for its opening animation to settle rather than weakening the size requirement. A first network failure now recovers through Retry search with the query unchanged, and produces the selected consultant's independent draft. The final standard combined suite passes **150 examples, zero failures in78.51s**; required Vite build, focused ESLint/Prettier and Ruby lint pass.

The latest mobile draft screenshot was captured with Playwright attached to the owned synthetic Brave test browser. The field-settings screenshot and raw dialog/download measurements were refreshed by the final standard system run. Current local observations are186ms field-dialog opening,195ms field settings and692ms actual PDF download. Earlier timings above remain historical observations; none is a production/load guarantee. The current downloaded PDF's extracted text matches the previously rendered artifact, with25 A4 pages, DRAFT, the wrapped Unicode value, final clause and field, and no PDF JavaScript.

The separate screenshot-capture harness timed out waiting for its completion marker after taking the Playwright image; its150/1 result is not used as a passing suite. The clean150/0 result is the normal command without that ignored QA hook. A standalone preview also stopped and is not claimed healthy. No generated mockup or human design approval is claimed; actual implemented-UI evidence is linked below.

## Developer experience and PDF failure recovery

The final combined agreement/middleware/browser command passes **155 examples, zero failures in 82.89s**. Separately, the shared PDF/invoice/bulk-download/analytics regression run reports 98 examples with zero failures and one compression-specific pending assertion; the documented two-file API example command passes 32 examples with zero failures. Required Vite build, focused JavaScript formatting/lint and seven-file Ruby lint pass. Full CI and release checks are still separate.

Invalid typed values now explain the expected format without echoing rejected values. Value checks consume only validated field definitions, so an invalid duplicate definition cannot reach a type-specific validator. PDF navigation errors remove document data URLs and chained causes at the shared service boundary. Agreement renderer failures return a private 503 problem response with a bounded retry instruction and request reference, plus a sanitized error report. The PDF client decodes bounded JSON error blobs, displays the reference and clears the alert after a successful retry/download.

Create failures with no confirmed outcome now direct users to Templates/Drafts before retrying. A real-browser test creates the record, substitutes a failed response, then finds that same saved draft through the archive without automatic duplication. This is reconciliation guidance, not an idempotency guarantee. [Contributor API reference](../../agreements.md) records the current contracts and failure/release boundaries.

The [PDF recovery screenshot](editor-pdf-recovery.png) and [create recovery screenshot](editor-create-recovery.png) were captured in actual Brave workflows, copied byte-identically and viewed. Fixtures and displayed identities are synthetic. No real document, mail, signing request or payment was used.

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
- [Short desktop editor](editor-short-1440.png)
- [Short mobile editor](editor-short-375.png)
- [Long desktop editor](editor-long-1440.png)
- [Long mobile editor](editor-long-375.png)
- [Latest mobile field settings](editor-mobile-field-settings.png)
- [Latest mobile draft and readable title](editor-mobile-draft.png)
- [PDF downloaded through the UI](agreement-long-ui-draft.pdf)
- [Downloaded PDF first page](ui-pdf-first.png)
- [Downloaded PDF last page](ui-pdf-last.png)

This feature uses additive tables with restricted references. Application rollback must preserve populated tables and encryption keys. Draft content remains editable and has no approval/signature authority; immutable sent/signed versions are a later required unit. Do not close #2462 from this checkpoint.
