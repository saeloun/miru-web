# Employee profile verification images

Captured from the local app using real Brave against source commit `a3dc41351a9efe7dd516c20003d3df7822263f40`, after integrating public develop `7b36f8d04c58d877ecf935590081d33ea178536f`.

Every person, company, address, bank value and payment value shown is a generated test fixture. These images contain no production HR data. They are copied unchanged from the browser captures.

| Flow | Desktop | Mobile |
| --- | --- | --- |
| Employee records, native payroll disabled and joining date unknown | [Full page](records-desktop.png) | [Full page](records-mobile.png) |
| Edit an existing saved report | [Editor](report-editor-desktop.png) | [Editor](report-editor-mobile.png) |
| Report save/cancel and saved definition actions | [Actions](report-actions-desktop.png) | [Actions](report-actions-mobile.png), [saved report](report-saved-mobile.png) |
| Automatically assigned staff ID | [Employment details](automatic-id-desktop.png) | — |
| Duplicate ID rejected with draft retained | [Validation](duplicate-id-desktop.png) | [Validation](duplicate-id-mobile.png) |
| Valid correction after rejection | [Saved correction](corrected-id-desktop.png) | [Saved correction](corrected-id-mobile.png) |
| Authentication regression | — | [Second-factor challenge](second-factor-mobile.png), [loaded dashboard](authenticated-mobile.png) |
| Historical employment errors shown generally, with Employee ID unmarked | [General error](employment-history-error-desktop.png) | [General error](employment-history-error-mobile.png) |

The focused report captures use 1440×1000 and 375×1000 viewports. Full-page record captures begin at scroll position zero. The associated checks also exercise permissions, document/CSV responses, persistence and concurrent database writes; screenshots alone do not establish those properties.

Local integrated verification passed 204 profile/lifecycle, 129 authentication and 117 payroll-guard examples, plus 14 distinct browser cases. An additional focused browser capture passed after the functional checks. Vite build, focused lint and fresh-database migration/index assertions passed. Production rollout, company-specific ID backfill and live verification are separate release steps.

The two historical-employment error captures were taken in Brave against runtime source `0e3db3ac1af894195dfc4e285a1feca00d33b07e`. They show a server rejection preserving the draft without marking Employee ID invalid. That follow-up passed 23 focused backend/migration examples and three Brave cases (desktop/mobile errors and retry, plus the upgraded PgHero page), with zero captured console errors; required Vite build and focused lint passed. The earlier 14 captures retain their original source attribution above. These counts overlap earlier checks and are not a new full-suite total.

## Release checklist

Before running the employee ID index migration, run this read-only preflight across all employment history, including discarded rows. It reports only affected company IDs and duplicate-group counts. Resolve any returned groups explicitly before retrying; never silently delete or renumber records.

```sql
SELECT company_id, COUNT(*) AS duplicate_groups
FROM (
  SELECT company_id, employee_id
  FROM employments
  WHERE employee_id IS NOT NULL AND btrim(employee_id) <> ''
  GROUP BY company_id, employee_id
  HAVING COUNT(*) > 1
) AS duplicates
GROUP BY company_id
ORDER BY company_id;
```

The migration repeats this exact case-sensitive, nonblank, all-history duplicate check. A retry rebuilds its invalid concurrent index; an already-valid correct index retains its protection.
