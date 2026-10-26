# Profitability Planning

Open **Reports → Compensation Burn and Profitability → Plan and adjust profitability scenarios**.
The worksheet lives at `/reports/profitability-planning`. Active Pro organization owners/admins share saved plans within their current workspace. Other roles cannot list, preview, save or export them.

Create an INR or USD plan. Available current-month report inputs seed the rows; missing values remain blank.
Monthly compensation uses annual compensation divided by twelve, converted using stored FX as of creation.
Target utilization starts at a visibly documented 80% planning assumption. Review all copied values, especially current-month capacity for a partial employment month. No spreadsheet or payroll data is imported automatically.

Edit monthly capacity, utilization, billing rates and compensation; add/remove planned hires and overhead rows.
One server calculator powers automatic previews, validation, saved results and CSV. Invalid or failed previews
withhold stale results while preserving edits. Save to keep a scenario; the first saved assumptions remain its
baseline. Updates use optimistic locking and reject stale workspace submissions. Source report dates, FX and
original person warnings remain immutable and visible separately from planning-input flags.

Revenue = monthly capacity × utilization / 100 × hourly rate. Costs = monthly compensation + entered overhead.
Margins and overall utilization use aggregate values. Inputs are in one fixed scenario currency; create a new
plan for another currency. Missing required numbers withhold dependent totals; zero must be explicit.

The forecast repeats constant monthly assumptions for 1–24 months. It does not apply future payroll changes,
joining/exit events, holidays, project allocation, invoice collection delays or automatic statistical prediction.
These changes must be represented in the entered monthly assumptions; no actual records are modified.

Cash projections require explicit opening available cash and expected monthly cash collections. They assume
all modeled costs are paid monthly. Net cash burn = costs minus collections, independently of billings.
Runway = opening cash / positive monthly net cash burn. Nonpositive burn has no finite depletion runway.
Reserve target = monthly costs × selected reserve months; reserve timing uses the remaining target divided by
positive monthly cash surplus. An already-funded target takes zero months; an unfunded target without cash
surplus is N/A. Only entered costs and collections are modeled, not a reconciled company cash ledger.

Names and worksheet contents are encrypted. Request parameters are filtered; audit events retain metadata
without compensation values. CSV exports contain the saved plan, its baseline and source warnings, with
formula-injection protection. Links require current workspace authorization, expire using the compensation
export TTL (default 15 minutes) and become invalid after any saved edit. Unsaved previews are not exported.
