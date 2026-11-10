# Personal profile save and insurance export coverage

This PR adds tests for existing behavior. It does not change application code or complete every requirement in issue2461.

## What was verified

At 1440px and 375px, the new browser examples use the date picker and normal fields to change DOB, personal email, phone, current address and LinkedIn/GitHub. They use Update/Save and the actual current-password confirmation dialog, reload the personal profile and EmployeeRecords, and check persisted User/Address values. Initial login uses the existing authenticated API-login helper; this is not a typed-login test. The profile spec is included explicitly in the browser CI command without overlapping another selected directory.

The existing insurance/salary request example now includes a populated employee with spouse and child. It checks every insurance column and parses exact four-field family JSON: name, DOB, gender and relationship. Both original incomplete-profile rows remain, with an explicit count of two before the blank-date checks. EmployeeRecord Save coverage is not duplicated.

## Recorded local result

The final run of both affected files passed **33 examples, 0 failures in 25.86s**: 17 profile system examples and 16 request examples. These are not 33 new tests; two browser examples were added and an existing request example was extended. Strict console/uncaught-exception collection was empty. RuboCop checked both files without offenses; YAML parsed and the profile CI target appeared exactly once with no overlapping selected directory. Hosted CI remains a separate gate.

The run used a fresh synthetic database, ActiveJob TestAdapter/no worker, a loopback-only Ruby OS sandbox and a fresh normal-security Brave profile with nonlocal requests blocked before navigation. The database, browser and profile were cleaned up. Existing qualified test assets were reused with matching locks/source inputs; this follow-up did not rebuild or install dependencies.

```sh
RAILS_ENV=test bundle exec rspec spec/system/profile/settings_spec.rb \
  spec/requests/api/v1/employee_reports_spec.rb
```

Local verification additionally used the external guarded Brave helper, CI=true, an explicit isolated DATABASE_URL, DISABLE_BOOTSNAP=1, SKIP_VITE_TEST_BUILD=1 and VITE_RUBY_AUTO_BUILD=false. Final log SHA256: `f5c1cd03f1e24670e87a4208aa6fd8ae62ce31090fb2447ed3a4a7b0fe410e92`.

## Original successful-run screenshots

These unedited screenshots were copied byte-for-byte from the final successful local 33/0 run, after the actual Save/reload workflow. All displayed names, contact/address and employment values are fictional fixtures; bank information is unpopulated. They contain no credentials, personal browser data or real bank data. They are synthetic local evidence, not production or owner acceptance screenshots.

| Screenshot | Pixels | SHA256 |
| --- | --- | --- |
| [Desktop saved records](profile-records-1440px.png) |1440x4824 |`22e2b010fb51e6c6b477fec614f3203c7deb4dec78ae7cb436cda0db2cd42963` |
| [Mobile saved records](profile-records-375px.png) |375x7736 |`319d8ffd271dc257c28adb864fbb643c60462b0dd7fc694c9f59a1ffebd59751` |

## Limits and retained failures

Initial setup attempts failed before the flow: Rails' non-CI driver registration overwrote the strict driver, and launching Brave inside the Ruby OS sandbox yielded a dead browser. The passing run used the existing CI driver alias and a separately launched owned Brave with the same security and egress guards. Early new-test expectation/fixture errors were corrected; no application defect was established.

An exact-India pointer click at the bottom of the mobile viewport sometimes selected IO. A geometry/screenshot observer changed timing and passed; an application cause is unproven. The final test uses supported normal scrolling to center the country control before opening its menu, keeps the immediate selected-IN assertion, and retains every Save/readback assertion. This is not an application fix for viewport-edge clicking.

No live email, provider, payment or production action was performed. PTO semantics and automatic employee-ID behavior are not established by this unit. Prior failed controls remain in the local evidence report; the final scoped 33/0 is not a whole-feature QA or deployment verdict.
