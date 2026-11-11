# Consultant settlement invoice QA

Unaltered screenshots from an isolated synthetic test database, normal Brave with
its native sandbox enabled, and the real local Rails/React app at 1440/375px.
Names, addresses, email addresses, tax identifiers and payment facts are fictional
fixtures; the workspace label is also a test fixture. No production/account data,
external SMTP or bank traffic was used. PNGs contain no text/EXIF metadata.

The responsive/security suite passed 7 examples with zero console.error/uncaught
exceptions: explicit generation and destination confirmation, full-credit wait,
linked originals and separate statement dates, private history/downloads, an
unassigned admin's discoverable draft-only entry, per-attempt email evidence and
workspace-switch isolation. The second uncertain card is a read-only DTO fixture,
not evidence of another issued invoice or payment.

Two further linked-document cases passed at 1440/375px with four native download
hash checks. Original: 35,393 bytes/SHA256
`8524bacc4b7ed2d47f97ec3155a0958aca11f872ad4b538e411ccedd8c929f21`;
paid UI fixture: 35,431 bytes/SHA256
`09678a20be007072a5cda6e63b0b552a07915c047a343da5d76ca410d1f123a9`.
These intentionally different valid PDF fixtures prove document selection and
exact stored-byte downloads. Actual invoice rendering, parsing, metadata/title
and visual checks were verified separately; these images do not prove long
Unicode/multipage layout, real delivery or production activation.

The checkpoint removal of an unread optional prop and its caller value does not change
behavior. Browser results are carried from the captured source; the required Vite
build and scoped lint were re-executed after that cleanup, without claiming a new
browser run. That checkpoint build manifest was copied to a retained snapshot with
SHA256 `880e815f39b26b7213cc8e0f71e6fcda07ed578efe45f44afb9dbed812c21312`.
The earlier browser manifest's bytes were not retained before the build overwrote
the volatile output; its recorded hash remains historical evidence only. API/core verification passed 52 examples; delivery/setter verification
is a separate suite. The whole-repository TypeScript check remains failing outside
the new invoice modules; no full typecheck success is claimed.

## Images

| File | SHA256 |
| --- | --- |
| [Generated paid,1440](generated-paid-1440.png) | `cb0d4213163360d780d9b25bce0cc09aa5529359ee84ff53899126c1af6f757a` |
| [Generated paid,375](generated-paid-375.png) | `b9b534027a08b558a6d8f530f8e511dce604777c35e6c26c8555b11b2733c01b` |
| [Unconfirmed generation,1440](generation-unconfirmed-1440.png) | `e88aa1a4c7cf7fa36ece0b908e242ef6f316ec5055238622e0aa3996986a4504` |
| [Unconfirmed generation,375](generation-unconfirmed-375.png) | `e8d9b2f2e774bfa8d3e6bec23d1f6efe5ef83101303a25ceb5644b74ef86b06b` |
| [Linked statement,1440](linked-paid-statement-1440.png) | `4cc57295ed0d0455f002f0d601b5d711f0f0d357ecf38b23f795f7c6642c61a2` |
| [Current linked statement,1440](linked-paid-statement-1440-current.png) | `2120e77e3d95b46e5be469addb2e1395aeea8319a408adc6536975afe62e6d09` |
| [Linked statement,375](linked-paid-statement-375.png) | `df63fab03447e68c9bae9f00618ab22d2a6d0d8be6d45fa418cfa79d13045cd8` |
| [Admin draft,1440](admin-unreviewed-1440.png) | `7a0fc37602af2004f20c28ef160095dbef94e0e2644f32b03bfddc30a3cd5239` |
| [Isolated email evidence,1440](uncertain-evidence-isolated-1440.png) | `9830ea04af3277c34c15a95045d82ed066306cec9215c293190d592ac8b11a78` |

The current 375px linked screenshot is byte-identical to the prior capture, so it
is stored once. All older captures remain unaltered.

## Checkpoint source inputs

| Source | SHA256 |
| --- | --- |
| Payroll/Invoices.tsx | `959c9eb453a9a2b41c16447a4096fd179412c8b57e618c95a794fc178f0fef19` |
| Payroll/InvoicePage.tsx | `20933dcc7afd84ac0c25c62566236ad2fed494a4a20afdb9c6603d7bbfb27e57` |
| Profile/ConsultantInvoices/index.tsx | `8d6f9786f920ba0edff5e0ad064b952e9898b52201101c158f6cf7cced47f81e` |
| Profile/ConsultantInvoices/api.ts | `f364384940dd0a3c7567afb4531bac894cf93446ff8154413e483925d728d23a` |
| Own API controller | `d63a566fc79085906ead87a583d23b9a748469310dc658179a165c6335dde69b` |
| Manager API controller | `bddb862db88d830ffda84c3fb69bac6e2b0f8e96df684c345b76566938d04fec` |

## Document support boundary follow-up

A separate regression reproduced unsupported generation for all three reviewed
registered GST schemes. Preparation review and issuance now refuse registered,
needs-review or unknown status; the exact original-linking flow is preserved.
The API marks generation unsupported and the chooser explains the manual
existing-original path. This is an interim document-support boundary, not tax
exemption determination or full India GST/export automation.

The focused server/request batch passed 66 examples. A fresh normal-Brave case at 375px
passed with zero console/uncaught errors, a disabled generation choice and
both native original/paid-statement download hashes matched. The required build
and scoped lint passed. Current retained build manifest SHA256:
`6d291ef8296ed974fa539de6a360c62e155349875bea5ae411e6a3320409e210`.
The earlier screenshots and 7+2 cases remain historical checkpoint evidence; they
were not relabelled as newly executed for this follow-up.

[Registered generation unavailable,375px](registered-generation-unavailable-375.png)
is the unaltered follow-up capture, SHA256
`d081747f38d6813ade001334f303c1fbeb1325ea09d8df97f08714d57148333a`.
The follow-up's [linked statement,375px](linked-paid-statement-375.png) was also
captured after linking the registered consultant's original. It is byte-identical
to the existing image with SHA256
`df63fab03447e68c9bae9f00618ab22d2a6d0d8be6d45fa418cfa79d13045cd8`,
so that file is reused rather than duplicated.
