# Consultant invoice authorization

Sonam #2458 requires consultant permission to generate invoices on their behalf, including withdrawal. Current employee records have no consent history; generic company/client invoices are a different workflow. The user delegated implementation decisions and requested continued delivery. This implements the permission dependency, not automatic invoice issuance or statutory validity.

## Contract

- A configured consultant grants or withdraws their own permission in **Employee records**. An admin cannot grant for another person. Existing active workspace/member and payroll entitlement rules apply; use the company timezone for current membership.
- Owners/admins and accounts explicitly assigned to a payroll run may read the consultant's status/history. Other staff cannot. Reading does not grant permission. Profile capability flags decide whether the panel is shown; no expected403 fetch on every unrelated employee profile.
- Display this exact versioned statement before an unchecked confirmation: “I authorize Miru to generate invoices on my behalf for my consultancy services recorded in this workspace. I can withdraw this authorization for future invoices.” Save only after explicit confirmation. Withdrawal does not require a new affirmation and never rewrites an existing invoice or payment.
- Store an append-only tenant/employment chain with action, server statement/version/digest, actor, timestamp, original command digest/key and predecessor. Never infer consent from a role, old agreement, bank details or an administrator's action. One root, one successor and unique employment/command key; SQL rejects cross-tenant/actor substitution, stale predecessor and UPDATE/DELETE. Adopted history prevents destructive rollback.
- Serialize on employment. Require the displayed predecessor and statement digest for a new grant; withdrawal targets the displayed grant and remains available without accepting changed wording. Exact retries return their original receipt plus the latest status; a stale replay cannot reinstate withdrawn permission. A newer policy statement requires explicit reauthorization.
- The authoritative service exposes current status, statement, current receipt and paginated immutable history. Later invoice generation must recheck current authorization under the same employment lock before issuance and retain the receipt ID. No bank/payment initiation is changed by this delivery.

## Verification

Prove explicit self grant→withdraw→regrant, proxy/tenant/inactive denial, current wording/predecessor conflicts, exact and conflicting retries, SQL history/actor constraints and independent-connection serialization. Verify private/no-store/CSRF request behavior, all history pages, real desktop/mobile form and readonly admin status, zero console errors, required Vite builds and synthetic screenshots. Preserve current tested PR2499 and all release candidates.
