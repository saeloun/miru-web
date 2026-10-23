# Employee records: synthetic browser evidence

Issue: [#2461](https://github.com/saeloun/miru-web/issues/2461).
Acceptance: [employee-records.md](../../specs/employee-records.md).

These screenshots contain generated people, bank details and documents only.
They were captured by the repository's real Brave/Cuprite system specs on
`8116e111cba056bbd2a094b01b70df739ce6f88d`, using a local test database.
They are not production screenshots or proof of bank settlement.

- [Staff, desktop](employee-records-staff.png): existing employment facts,
  editable private family/contact/bank details and a masked account number.
- [Administrator, 375px](employee-records-admin-mobile.png): recorded salary,
  retained private contract, manual payment history, saved report selections
  and the reminder preference.

The [dark mobile birthday preview](birthday-reminder-dark-mobile.png) and
[light desktop anniversary preview](anniversary-reminder-light-desktop.png)
were captured after the shared mail-footer fix. Fourteen native Brave checks
cover both reminder kinds in light/dark at 1280/375/320px and both plain-text
parts. Footer-link contrast measures 14.03:1 in dark mode and 17.85:1 in light
mode. These use unsaved synthetic mailer previews; no SMTP delivery occurred.

The eight browser examples also verify byte-identical PDF downloads, actual
CSV content, payment pagination, wrong-workspace links, target changes,
staff/client/coworker permissions and 320/375/1440px containment. No real mail
or provider request is made by those examples.

```sh
FERRUM_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' \
  rtk mise exec -- bundle exec rspec spec/system/responsive/employee_records_spec.rb
```

Deployment and CI results belong in the PR description, with their exact SHA.
Local screenshots alone do not establish production readiness. Real encryption
key recovery and durable private storage must be verified before a real-data
rollout. Report definitions are saved; historical CSV snapshots and optional
salary increment history are not retained by this feature.

## Linux PDF sample

[Synthetic invoice PDF](synthetic-invoice-linux.pdf) was generated from the
corrected invoice template and shared PDF service using the official Linux
production image (Ruby 4.0.1, Ferrum 0.17.2), limited to 512 MiB. Generation
took 7.48 seconds. All six pages were rendered with Poppler and visually checked;
all 35 ordinary-sized rows retain their complete descriptions, and the final
total is exactly INR 35,000.35. Rows taller than a printable page can still split.

The PDF is 123,690 bytes; SHA-256:
`8f774793c138a0166552b1632635193224c500b6f87307c8568bf0185638a701`.
This container rendering check is separate from the deployed HTTP download.
