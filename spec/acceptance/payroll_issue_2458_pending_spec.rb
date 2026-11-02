# frozen_string_literal: true

require "spec_helper"

# These end-to-end contracts are deliberately pending until their product workflows exist.
# Implemented preview/calculation/revision coverage is mapped in the issue acceptance ledger.
RSpec.describe "Issue #2458 remaining payroll acceptance", issue: 2458 do
  context "1. Consultant identity and beneficiaries" do
    it "requires consultant legal name, billing address and applicable tax details before payment readiness"
    it "records versioned authorization to invoice for the consultant and honors withdrawal"
    it "requires matching account-number confirmation and country-specific currency, IFSC, SWIFT and provider fields"
    it "encrypts bank and tax identifiers and exposes only masked values outside authorized payment preparation"
    it "notifies a consultant about missing details while allowing other complete consultants to progress"
    it "notifies accounts after a bank change and requires fresh beneficiary verification"
    it "invalidates unsubmitted approvals after bank changes without changing an in-flight destination"
  end

  context "2. Company configuration and assigned permissions" do
    it "binds each funding choice to an actual company-owned account independently of the contracting legal entity"
    it "configures effective PTO entitlement, accrual, leave year and significant-exception thresholds"
    it "allows assigned accounts staff to prepare without granting payment initiation or blanket coworker pay access"
    it "requires a distinct authorized payroll approver and an explicitly authorized payment initiator"
  end

  context "3. Monthly payment report" do
    it "opens an exact-version review report from Make Payment before any provider request or accounts email"
    it "shows paid and unpaid leave, opening and closing PTO, adjustments, withholding, entitlement and verified bank readiness"
    it "shows the sourced reference rate, buffered rate, each USD principal, provider fees and combined company debit"
  end

  context "4. All five 160-hour examples and service policies" do
    it "pays the full monthly fee for 150 worked plus 10 approved paid PTO and changes opening 40 to closing 30 PTO hours"
    it "persists approval of 60 unpaid hours against 160 expected hours and pays exactly 62.5 percent once"
    it "pays the full monthly fee for 100 worked plus 60 approved advance-PTO hours and records the resulting negative balance"
    it "requests correction of the unexplained 60 hours after 100 worked without making an unpaid deduction"
    it "pays a fully worked current month with historical PTO minus 40 and opens a separate historical-balance review"
    it "applies an explicitly approved joining, exit or midmonth-fee policy without guessing a proration basis"
    it "resolves overlapping work and leave in the service timezone without double-crediting paid time"
  end

  context "5. PTO exceptions, accrual and recovery" do
    it "notifies the assigned admin when the configured overdraw threshold is reached"
    it "deducts only an explicitly approved current-month unpaid amount and records its recovery reference"
    it "recovers approved advance PTO through future accrual without an automatic cash deduction"
    it "defers an exception while paying normally and retains it for leave-year-end review"
    it "waives an exception only with an authorized actor and retained reason"
    it "returns timesheet or leave facts for correction without silently approving them"
    it "reports outstanding and deferred balances at leave-year end and consultant exit"
    it "prevents recovery of hours already deducted even after repeated decisions or a later run"
  end

  context "6. Reimbursement settlement" do
    it "atomically reserves a claim for one run when two payroll approvals select it concurrently"
    it "prevents direct expense settlement from paying a claim reserved by an approved payroll run"
    it "freezes approved claim amounts and requires reapproval or an adjustment after material claim changes"
    it "carries a claim approved after cutoff into the next run or an explicitly separate payment"
    it "releases a reservation only after cancellation or failure proves no outstanding payment and retains it for uncertain outcomes"
    it "settles an approved reimbursement once and retains its receipt, original currency, approved amount and payment allocation"
  end

  context "7. Mercury USD wires and bank credit" do
    it "requires provider-onboarded Indian international-wire beneficiaries with verified SWIFT and routing data"
    it "requires enabled funding-account capability and payment scopes independently of a read-only balance connection"
    it "records source and observation time for INR-per-USD R and calculates principal P divided by R minus 1.50"
    it "rejects zero or negative buffered rates and rounds each principal to USD cents"
    it "records configurable company-paid OUR fees, initially 15 USD where applicable, outside consultant income"
    it "requires approval of principal plus fees and renews approval when a stale quote changes"
    it "persists an idempotency identity before submitting an international-wire approval request"
    it "polls Mercury approval separately from transaction processing and retains correlated provider references"
    it "keeps provider sent status distinct from actual receiving-bank INR credit"
    it "records actual INR credit and requires accounts resolution of any entitlement shortfall"
  end

  context "8. India accounts handoff" do
    it "emails only the approved report to the configured accounts recipient with consultant, month, hours, days, paid leave, fee, adjustments, claim items, total and required bank fields"
    it "marks a successful handoff Sent to Accounts Awaiting Payment and never credited merely because mail was sent"
    it "records transfer date, transaction reference and credit confirmation from authorized accounts staff"
    it "retries failed mail without duplicating transfers or delivering a superseded approved report"
  end

  context "9. Consultant and spouse allocations" do
    it "requires full spouse beneficiary details, accounts verification and admin approval for setup and changes"
    it "validates fixed-INR and percentage allocations with an explicit remainder and an exact entitlement sum"
    it "splits after fee and PTO adjustments and keeps reimbursements with the consultant unless reallocation is explicitly approved"
    it "allocates withholding once and reconciles INR rounding without a zero or negative USD transfer leg"
    it "uses the same approved buffered rate for both principals and charges OUR separately for each transfer"
    it "retains independent provider identities and statuses for both beneficiaries"
    it "retries only a confirmed failed leg when the other leg succeeded and reconciles uncertain outcomes first"
    it "requires all necessary credits and shortfall resolutions before marking the overall settlement fully credited"
    it "retains consultant service-provider identity and tax ownership when a spouse receives an allocation"
  end

  context "10. Consultant invoices" do
    it "generates a uniquely numbered paid consultant invoice and PDF only after full confirmed credit for either funding source"
    it "includes service period, legal parties, tax facts, separate fee and reimbursement lines, adjustments, withholding, net, dates, currencies and payment references"
    it "retains INR entitlement and USD settlement details while excluding company-paid OUR from consultant income"
    it "links both spouse transfers to one consultant invoice"
    it "links and reconciles an existing or legally required earlier invoice instead of generating a duplicate"
    it "does not issue a paid invoice for submitted, processing, sent or partially credited transfers"
    it "exposes the PDF to the consultant and emails accounts through retry-safe delivery"
    it "deduplicates invoice creation and delivery across concurrent settlement jobs and repeated bank events"
    it "blocks invoice generation without current invoice authorization or required tax and legal facts"
  end

  context "11. Remittance documentation" do
    it "lets the consultant or authorized accounts attach private bank-issued FIRC, FIRA or inward-remittance advice to a payment and invoice"
    it "tracks credited payment and received remittance documents independently"
    it "flags missing remittance documents without treating a Mercury receipt as a bank-issued FIRC"
    it "denies cross-company and unrelated-user remittance downloads and excludes document contents from logs"
  end

  context "12. Full payment lifecycle and audit" do
    it "invalidates payment approval after fee, attendance, leave, claim, beneficiary, split, quote or provider-fee changes"
    it "tracks each applicable not-ready, awaiting-approval, ready, accounts-handoff, Mercury-approval, processing, sent, partial-credit, credited, failed, cancelled and returned state"
    it "prevents duplicate run, reservation, transfer, invoice and email creation across repeated clicks and interrupted processing"
    it "reconciles an uncertain provider submission before authorizing a replacement transfer"
    it "deduplicates repeated bank events and rejects stale out-of-order transitions"
    it "reopens reconciliation for a late return while preserving the original payment, invoice and returned-amount history"
    it "retains actors and immutable source, PTO-decision, bank, approval, fee, claim, reference and invoice versions without confidential payloads"
    it "keeps statutory treatment and tax identity independent of the selected funding bank"
  end
end
