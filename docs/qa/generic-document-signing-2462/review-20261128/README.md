# Retained signing baseline evidence

[Functional run 46081027299](https://github.com/saeloun/miru-web/actions/runs/46081027299) passed on QA fixture `18f4d9c52d4034ed1aaa2ccab1eafeea2f79da8c`. Client and consultant each completed version 4 with two documents, ten fields and two signers. The consultant signer entered fields and completed signing at 375 px. All 16 native PDF downloads across 1440 and 375 px passed byte/hash checks; signed documents also passed independent PDF seal/body checks, and certificates/audit logs passed identity binding. All four actor-denial cases passed for every file in both packets without serving PDF bytes. Both Share PNGs rendered; browser console errors were zero. Cleanup completed with no errors or rejected evidence.

These are synthetic isolated-loopback results, not production delivery, legal certificate approval or final release approval. The immutable inputs are recorded in [binding.json](binding.json): Miru `4aa6ff5744267b1942bbf614fac322c8c1184bf7`, upstream Documenso `8707e33c124e4b1a68dde92d5e05178c9aabd0be`, image config `6b1d4c45a24da11e2f1c66da8eb486832660e4565334689c91ef9353fe158f49` and 23 verified rootfs layers. The matching source archive is 58,498,058 bytes with SHA256 `5b94ae4dc456b853964100cebc1263819bac762b7c9205cc8a8675f8ae916ee2`, available in the [retained source release](https://github.com/saeloun/miru-web/releases/tag/documenso-source-4aa6ff574). The live PR base tip `64f4b206ec62f01872244c4d4649d638b3118be5` is distinct from the fixed runtime input.

All 38 PNGs were individually inspected before publication and copied without pixel changes; [SHA256SUMS](SHA256SUMS) binds their bytes. The 28 baseline images below belong to the passed run. Eight earlier images are retained separately as failed-checkpoint evidence, and two navigation probes are explicitly synthetic scaffolds. Addresses/names are QA literals; the provider signup page contains its built-in public marketing sample. No browser profile, invitation token, provider key or customer data is published.

Known limits remain visible: both Share images incorrectly say “Document Sent!” after completion, tracked in [#2538](https://github.com/saeloun/miru-web/issues/2538). Signing/embed source captures show PDF loading spinners; they establish source-link visibility and focus only, not fully rendered PDF or full visual correctness. The QA embed is a separate scaffold; Miru's actual delivery is email-based. Source retrieval passed against the local QA proxy, not the production `/source` endpoint. A fresh vulnerability-database scan of this exact image, final Miru release interoperability, anonymous production source publication/binding and final release gates remain separate. Documentation audits 2/2 remain spent/stale; this evidence publication is not a new audit or waiver.

## Passed baseline: completed pages and private archives

| Scene | Desktop1440 | Mobile375 |
| --- | --- | --- |
| Client completed | ![Client Document Signed](baseline-46081027299/screenshots/signed-client-1440.png) | ![Client Document Signed at375](baseline-46081027299/screenshots/signed-client-375.png) |
| Consultant completed | ![Consultant Document Signed](baseline-46081027299/screenshots/signed-consultant-1440.png) | ![Consultant Document Signed at375](baseline-46081027299/screenshots/signed-consultant-375.png) |
| Client archive | ![Client four-file archive](baseline-46081027299/screenshots/archive-client-1440.png) | ![Client four-file archive at375](baseline-46081027299/screenshots/archive-client-375.png) |
| Consultant archive | ![Consultant and retained client archives](baseline-46081027299/screenshots/archive-consultant-1440.png) | ![Consultant and retained client archives at375](baseline-46081027299/screenshots/archive-consultant-375.png) |

## Passed baseline: placement

These show synthetic field placement before signing, with settled viewport geometry. They are not signed PDFs.

| Packet | Desktop1440 | Mobile375 |
| --- | --- | --- |
| Client | ![Client field placement](baseline-46081027299/screenshots/placement-client-1440.png) | ![Client field placement at375](baseline-46081027299/screenshots/placement-client-375.png) |
| Consultant | ![Consultant field placement](baseline-46081027299/screenshots/placement-consultant-1440.png) | ![Consultant field placement at375](baseline-46081027299/screenshots/placement-consultant-375.png) |

## Passed baseline: source notice

Signing/embed rows capture loading states and only support the source-notice checks. Embedded pages belong to the QA scaffold, not Miru email delivery.

| Surface | Desktop1440 | Mobile375 |
| --- | --- | --- |
| Public signup | ![Public source notice](baseline-46081027299/screenshots/source-public-1440.png) | ![Public source notice at375](baseline-46081027299/screenshots/source-public-375.png) |
| Authenticated | ![Authenticated source notice](baseline-46081027299/screenshots/source-auth-1440.png) | ![Authenticated source notice at375](baseline-46081027299/screenshots/source-auth-375.png) |
|404 | ![404 source notice](baseline-46081027299/screenshots/source-error-1440.png) | ![404 source notice at375](baseline-46081027299/screenshots/source-error-375.png) |
| Client signing, loading | ![Client signing source notice, PDF loading](baseline-46081027299/screenshots/source-signing-client-1440.png) | ![Client signing source notice at375, PDF loading](baseline-46081027299/screenshots/source-signing-client-375.png) |
| Consultant signing, loading | ![Consultant signing source notice, PDF loading](baseline-46081027299/screenshots/source-signing-consultant-1440.png) | ![Consultant signing source notice at375, PDF loading](baseline-46081027299/screenshots/source-signing-consultant-375.png) |
| Client QA embed, loading | ![Client QA embed source notice, PDF loading](baseline-46081027299/screenshots/source-embed-client-1440.png) | ![Client QA embed source notice at375, PDF loading](baseline-46081027299/screenshots/source-embed-client-375.png) |
| Consultant QA embed, loading | ![Consultant QA embed source notice, PDF loading](baseline-46081027299/screenshots/source-embed-consultant-1440.png) | ![Consultant QA embed source notice at375, PDF loading](baseline-46081027299/screenshots/source-embed-consultant-375.png) |

## Share PNGs: known incorrect caption

Both images have SHA256 `0ccb1f4d89b1251f05e5d8adf73826f73858f975c92193462a975734519b3a49`. Rendering passed; the caption remains incorrect and requires a provider patch plus new immutable qualification.

![Client Share PNG, incorrect Document Sent caption](baseline-46081027299/share-client.png)

![Consultant Share PNG, incorrect Document Sent caption](baseline-46081027299/share-consultant.png)

## Earlier failed checkpoint

[Run 46056368112](https://github.com/saeloun/miru-web/actions/runs/46056368112) used QA fixture `868d5114b8141ab4bd55c4952cd97e9c5dc7219f` against the same retained 4aa/provider inputs. It failed at old-link review denial text; it did not qualify complete signing. Its 375 px placement screenshot is a premature transition capture, not proof of a permanently squeezed product layout. The QA capture/interaction repairs and later passed run are separate evidence.

| Scene | Desktop1440 | Mobile375 |
| --- | --- | --- |
| Placement, mobile transient | ![Earlier client placement](checkpoint-46056368112/screenshots/placement-client-1440.png) | ![Earlier premature mobile placement capture](checkpoint-46056368112/screenshots/placement-client-375.png) |
| Public source notice | ![Earlier public source notice](checkpoint-46056368112/screenshots/source-public-1440.png) | ![Earlier public source notice at375](checkpoint-46056368112/screenshots/source-public-375.png) |
| Authenticated source notice | ![Earlier authenticated source notice](checkpoint-46056368112/screenshots/source-auth-1440.png) | ![Earlier authenticated source notice at375](checkpoint-46056368112/screenshots/source-auth-375.png) |
|404 source notice | ![Earlier404 source notice](checkpoint-46056368112/screenshots/source-error-1440.png) | ![Earlier404 source notice at375](checkpoint-46056368112/screenshots/source-error-375.png) |

## Synthetic navigation differential

The following two images are labelled loopback scaffolds using the actual Miru token/history statements. They demonstrate one bootstrap for same-document fragment navigation versus two with a fresh document. They are not product UI screenshots or signing acceptance. The actual stale-token request test separately retained HTTP 410/current-version authorization. No renewed server access or cross-user disclosure is claimed.

![Synthetic same-document fragment bootstrap, one run](navigation/same-tab-fragment-bootstrap.png)

![Synthetic fresh-document bootstrap, two runs](navigation/fresh-document-bootstrap.png)
