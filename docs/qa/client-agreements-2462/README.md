# Client agreement details verification

Part of #2462: capture client legal company name, finance email, and authorized signatory name, designation and email. The existing address is the registered/billing address. Finance and signatory addresses remain independent after copying. Legal name is used in billed-to views and PDFs, falling back to the display name for existing clients.

Runtime source: `ff0f4ce5aeb8abd3e91ddc339497da5e6676d626`. Every person, company, address, email and payment value shown is a synthetic local fixture. Images are copied unchanged from real Brave captures. No production HR data, live emails, signature requests or payments were used.

| Flow | Desktop | Mobile |
| --- | --- | --- |
| Edit agreement and billing facts | [1440px editor](client-agreement-fields-1440.png) | [390px mobile side panel](client-agreement-fields-390.png) |
| Saved facts, with independently changed finance email | [Client details](client-agreement-details-1440.png) | [Client details](client-agreement-details-390.png) |
| Legal company name on an invoice | [Invoice preview](client-invoice-legal-name.png) | — |
| Finance address added to editable invoice recipients | [Send dialog](client-invoice-recipients.png) | — |
| Actual generated PDF | [Rendered page](client-legal-name-invoice.png), [PDF download](client-legal-name-invoice.pdf) | — |

The final affected run passed **363 examples, zero failures, one existing pending** in 3m37s. It includes client CRUD/policy, client-index query-count checks, invoice requests, real-template rendering, seven new Brave cases and adjacent invoice/client browser flows. The pending request example skips PDF text inspection because its response is compressed; the new real PDF was generated, extracted with Poppler and visually inspected separately. Focused privacy checks reproduced three failures before the fix, then passed 10/0. The corrected responsive cases exercise both the table editor and the separate mobile editor reached from client details.

A separate Playwright CLI pass launched the actual Brave executable against an owned test database and Rails server. Password sign-in, saving an independently changed finance address, legal invoice identity and recipient defaults were verified. No send action was taken. The browser and server were closed; the existing test cleaner removed the owned fixtures. Required Vite command and focused Ruby/JavaScript lint passed; the last Vite invocation reused an unchanged-input build.

New finance/signatory contact access is restricted to owners/admins. Client-role and bookkeeper invoice access remains available, with the new finance contact excluded from both direct fields and recipient arrays. Public invoice links expose legal identity without private finance/signatory details. Existing accepted/virtual-verified contacts and explicit recipient overrides retain their behavior.

The invoice preview capture includes an existing Pro analytics authorization toast on a free synthetic workspace. Its component, controller and policy are unchanged from the branch base. Zero captured JavaScript console-API errors in the focused browser tests does not mean zero network errors; the separate Playwright pass observed this 403. It remains a separate follow-up.

Full contract body editing, reusable templates, custom document/signer fields, review comments, approvals, immutable versions and electronic signing remain required in #2462. They are not implemented by these client data fields. Long-document editor performance is unmeasured. Existing invoices still read live client details when regenerated; future immutable agreements need their own snapshots.

Rollout adds five nullable columns without defaults, indexes or data backfill. Deploy the additive migration before the new application code. Retain populated fields on application rollback. Production deployment and live verification require their own CI/image/deploy evidence.
