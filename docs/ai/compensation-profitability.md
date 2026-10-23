# Compensation Burn and Profitability

Open **Reports → Compensation Burn and Profitability** at `/reports/compensation-profitability`.
The same endpoint accepts `.json`; the CSV download uses the generated encrypted snapshot.
Active organization owners and admins with Pro report access can generate, configure and download it.
Platform Super Admin status grants no access by itself. Bookkeepers and other organization roles cannot
access employee compensation. Legacy `/admin/compensation-profitability` URLs enforce the same policy.

## Source data and setup

- Employee salaries come from encrypted employee records and immutable encrypted compensation versions.
  Salary edits retain dated history; the reporting configuration can record older known salary terms.
- Consultant fees and schedules use the existing dated consultant compensation records, denominated in INR.
  When a person changes engagement type, the latest applicable effective date determines the compensation source.
- Configure the workspace's actual payroll proration policy: calendar days or scheduled working days per month.
  Neither is assumed by default. Holidays and paid leave do not reduce compensation under these policies.
  Other payroll policies require a matching calculation before their results can be finalized here.
- Configure each employee's weekdays, daily hours, department and optional primary project.
  Consultant schedules already come from their effective terms. Employee schedules are a reporting configuration,
  not a replacement for a historical shift or schedule system.
- Record known dated billing terms before generating historical reports. Current project-member rate edits
  and client-currency edits capture new reporting terms from their recording date; they never backdate rates.
  An unconfigured default zero rate is not treated as an intentional free billing agreement.
  Edits from known paid rates to zero are captured; explicit dated zero rates can also be recorded in the report configuration.
- Currency conversion uses stored direct rates on or before each calculation date, or their inverse.
  The screen and CSV include the rates, dates and sources used. No network FX lookup is performed during generation.

## Interpretation and safeguards

Only `approved` timesheets contribute hours and revenue. `not_required`, pending and rejected entries are excluded and flagged.
Revenue includes every applicable project; client and primary-project filters select people, keeping their whole-person costs and revenue.
People with compensation and no hours remain visible. Fixed-fee revenue is unavailable until an allocation method exists.
Missing inputs produce flags and N/A for dependent metrics; incomplete individual values also make aggregate totals unavailable.
Repeated employment records are flagged for reconciliation and are never added together as separate people.

National and selected holidays reduce available hours. Miru's timeoff records do not contain approval status;
recorded leave therefore flags `leave_approval_unavailable` and withholds finalized availability/utilization.
This report does not introduce a leave-approval workflow, payroll settlement, statutory calculations or operating-expense burn.

Generation and download events are audited without salary amounts or report payloads. Report payloads and salary histories
use the existing Active Record encryption keys. Export links additionally require authentication, current organization report access,
the generating user and workspace, and an unexpired signature. `COMPENSATION_REPORT_EXPORT_TTL` controls link lifetime
in seconds (default 900, minimum 60, maximum 86400). Snapshots remain encrypted in the database after link expiry.
