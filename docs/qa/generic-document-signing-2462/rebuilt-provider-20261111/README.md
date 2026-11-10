# Rebuilt-provider synthetic QA evidence

These original, unedited screenshots come from an isolated synthetic QA run on 11 November 2026 local time (10 November, 21:23–21:47 UTC). They contain fictional identities and documents, without credentials or recipient bearer URLs. They are not production screenshots.

**Whole-run verdict: FAIL / BLOCKED.** The built Share image repeatedly returned HTTP 500, and the resource watcher retained only one sample, leaving continuous reserve monitoring unproven. These images do not verify any later fix, newly rebuilt image or retest.

The consumed provider was built from [public source 9ccf49eda1feaa1827f1158481057024e4aebb94](https://github.com/saeloun/miru-web/commit/9ccf49eda1feaa1827f1158481057024e4aebb94), tested merge `e9bfb701e8d3f248ae29f909b897bee2ffbc5255`. Image archive SHA256: `37af708404fa91db8320348b268430d19d10101c017009125d6cb3a99c3cbd01`; export config: `8e7a5bfcdcb98ef3c8718952708872c08bb322e3afca887ed942af68a6ccbfea`. Miru ran clean private-QA source `d5ad9670e55a0576c2e088c6a1e769d6f89fac3b`, tree `fce2f4ccecc7798a144bbc13d767ee9d4a21028d`. The run report SHA256 is `01c3d88e501b40a4f888484b8c845033f827397ebb03fe6460e7cd79ff06b051`; private raw captures are not published here.

The actual normal-user flow saved and reloaded all nine field types across two PDFs, plus a second required signature, then completed long approval, real queue/send, recipient email-code signing and manual status reconciliation. Four resulting artifacts passed actual authenticated HTTP byte/header checks; 24 access denials and native/independent signature verification also passed. Those observations are separate from what a screenshot alone proves. No webhook, production SMTP, legal identity or production acceptance is claimed.

| Original image | What is visible | Dimensions | SHA256 |
|---|---|---|---|
|[Desktop editor](nine-fields-1440.png)|Saved version 3, nine native field types plus addendum signature, two-document selector and one email-code signer|1440×3604|`270bf5b7c17f8c2f511aa40cfa504f3e80a00bc371bc70750cc268c152d89f6f`|
|[Settled mobile editor](nine-fields-375-settled.png)|Ready PDF and stacked editing controls at a 375px viewport; a separate initial loading capture is not used here|375×4660|`6cbbe537980a7cdd2794a82635e9cecc17951f6b0d2218c11534d3f7df9d3c01`|
|[Private archive panel](private-archive-1440.png)|Signed version 3 with two signed PDFs, certificate and audit-log download controls|1440×1000|`891d8a319e018317024b118c046ed3d798095069fd1e2c5eaae14bf390a77dcd`|

The newly created key was revoked normally. The isolated project, generated secrets and local fixtures/processes were removed, and the historical QA application was restored using its unchanged container ID with HTTP 200. No production deployment occurred. The incomplete mobile archive/header transition and unperformed native download clicks are not presented as passing visual coverage.
