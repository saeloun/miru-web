# Browser CI recovery

The original `b35b465b1` CI browser job ran **362 examples with three failures**; the earlier local 199-example scope did not cover that entire command. The Rails/security follow-up `680727ffc` subsequently passed remote security audit, Reek, image build and CodeQL. CodeQL's ten fixture alerts are explicitly fixed; its fourteen remaining open alert IDs match `develop` and are not zero-alert certification.

This follow-up changes three specs and the browser job's failure artifacts. Application source, dependency versions and frontend assets remain unchanged from `680727ffc`.

- Interview notes: a controlled real PATCH demonstrated that `have_no_field` with its default enabled-only matching succeeded while the editor was merely disabled and the database save was still pending. The test now waits for the existing save confirmation and removal of the field regardless of disabled state, then retains the database, meeting-preservation and revocation assertions.
- Decision review: initial screening completion moves the review control by 1,145 pixels. The test now uses the same two enabled-state loading barriers already used by the file's other journey before clicking. No decision/privacy assertions changed.
- Invoice search: the isolated original case and whole file already passed locally, so no production UI defect is claimed. The test now proves all five initial rows loaded, sets and checks the actual input, and waits for exactly one filtered row. All excluded-invoice and matching-count assertions remain.
- Browser failure screenshots were not uploaded by the old job: the downloaded `test-results` artifact contained only backend XML/runtime files. The browser job now uploads its own PNGs on failure using the existing pinned artifact action. No logs, environment values or production data were added to this artifact.

Focused Brave checks pass **nine hiring examples** and **sixteen invoice examples**. Controlled diagnostics demonstrate the pending-save and layout conditions; the original isolated examples also passed, so no spontaneous local RED reproduction is claimed. Rubocop and workflow YAML parsing pass. No sleeps, increased timeouts, disabled checks or removed assertions were added.

The exact complete CI browser command is running locally at this checkpoint:

```sh
bundle exec rspec spec/system/responsive spec/system/expenses/crud_spec.rb \
  spec/system/auth/two_factor_spec.rb spec/system/invoices \
  spec/system/time_tracking/add_entry_spec.rb
```

Its terminal result belongs in the PR's current evidence; a running process is not a pass. Log: `/tmp/miru-2493-full-ci-browser-20261108.log`. Focused logs: `/tmp/miru-hiring-ci-recovery-green-20261108.log` and `/tmp/miru-invoice-search-file-green-20261108-abdd.log`. The changed files are bound by [the source manifest](browser-ci-source-SHA256SUMS-20261108.txt).

Fresh native engineering/design/devex review metadata is recorded separately for the final commit. CodeRabbit's success status actually means **review skipped: 631 files exceed its 150-file limit**; neither its status nor its truncated comment supplies review approval. No reply or dismissal was posted. The original committed review reports remain historical checkpoints.

Production origin, configuration parity, provider accounts/transfers, monitoring, backup recovery and compliance remain unverified. No production action was taken.
