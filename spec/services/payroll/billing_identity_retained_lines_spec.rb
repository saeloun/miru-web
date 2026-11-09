# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Billing identity and retained bank lines" do
  include_context "reviewed mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  def builder
    Payroll::ConsultantRevision.new(run, actor: accounts)
  end

  def revise(consultants)
    builder.create!(consultants:, cutoff: Date.current.iso8601, expected_digest: run.current_revision&.digest, idempotency_key: SecureRandom.uuid)
  end

  def approve(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
  end

  def accepted(expenses: [])
    revision = revise([{ employment_id: employment.id, expense_ids: expenses, acknowledged: true }])
    approve(revision)
    instruction = prepared_instruction(revision:)
    stub_mercury_reads
    stub_mercury_write(mercury_json(mercury_request("amount" => instruction.principal_minor / 100.0)))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
  end

  def revoke
    binding = Payroll::BillingIdentity.new(employment).binding
    Payroll::BillingIdentity.new(employment, actor: owner).review!(submission_id: binding.fetch("submission_id"),
      expected_review_id: binding.fetch("review_id"), decision: "needs_information", reason: "Synthetic identity correction",
      manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "retained-revocation")
  end

  def second_consultant
    person = create(:user, current_workspace: company)
    member = create(:employment, company:, user: person, joined_at: "2020-01-01", resigned_at: nil)
    EmployeeRecord.create!(employment: member, private_details: bank_details)
    ConsultantCompensation.create!(employment: member, created_by: owner, effective_on: "2026-11-01", monthly_fee: 40_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic second consultant")
    create(:timesheet_entry, user: person, project: work_entry.project, work_date: "2026-11-02", duration: 480)
    configure_synthetic_pto_policy(employment: member)
    record_synthetic_pto_treatment(employment: member)
    review_synthetic_billing_identity(employment: member, reviewer: owner)
    member
  end

  it "recognizes an actual later persisted line whose only source difference is capture time" do
    instruction = accepted
    bank_revision = instruction.payroll_revision
    payload = run.current_revision.payroll_payload.deep_dup
    travel 1.second
    payload.fetch("lines").sole["source_snapshot"] = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11",
      policy_versions: { pay: payload.dig("policies", "pay", "version"), attendance: payload.dig("policies", "proration", "version") }).call
    expect(payload.dig("lines", 0, "source_snapshot").except("captured_at"))
      .to eq(bank_revision.payroll_payload.dig("lines", 0, "source_snapshot").except("captured_at"))
    expect(payload.dig("lines", 0, "source_snapshot", "captured_at")).not_to eq(bank_revision.payroll_payload.dig("lines", 0, "source_snapshot", "captured_at"))
    later = workflow.revise!(actor: accounts, payload:, expected_digest: bank_revision.digest, idempotency_key: "later-capture")
    approve(later)
    revoke

    guard = Payroll::MercuryRevisionGuard.new(run)
    expect(guard.protected_line?(later.payroll_payload.fetch("lines").sole)).to be(true)
    forged = later.payroll_payload.fetch("lines").sole.deep_dup
    forged.fetch("source_snapshot")["digest"] = "a" * 64
    expect(guard.protected_line?(forged)).to be(false)
    expect(workflow.status).to eq("approved")
    expect(instruction.reload.payroll_revision_id).to eq(bank_revision.id)
  end

  it "carries an omitted accepted line unchanged while preparing another reviewed consultant" do
    instruction = accepted
    retained = run.current_revision.payroll_payload.fetch("lines").sole.deep_dup
    other = second_consultant
    revoke
    retained_summary = builder.preparation(cutoff: Date.current.iso8601).find { |row| row[:employment_id] == employment.id }
    expect(retained_summary).to include(retained: true, ready: false)

    revision = revise([{ employment_id: other.id, expense_ids: [], acknowledged: true }])
    expect(revision.payroll_payload.fetch("lines").pluck("employment_id")).to match_array([employment.id, other.id])
    expect(revision.payroll_payload.fetch("lines").find { |line| line["employment_id"] == employment.id }).to eq(retained)
    expect(revision.payroll_payload.fetch("lines").find { |line| line["employment_id"] == other.id }.dig("amounts", "net_minor")).to eq(4_000_000)
    approve(revision)
    expect(workflow.status).to eq("approved")
    expect(instruction.reload.submission_state).to eq("accepted")
    expect(instruction.entitlement_minor).to eq(6_250_000)
    expect(PayrollPaymentInstruction.count).to eq(1)
  end

  it "rejects requested financial changes instead of silently carrying the accepted line" do
    instruction = accepted
    original = run.current_revision
    claim = create(:expense, company:, user: worker, amount: 100, currency: "INR", date: "2026-11-02", status: :approved)
    [{ withholding: "1000.00" }, { other_earning: "100.00" }, { other_deduction: "10.00" },
      { confirmed_unpaid_hours: "1" }, { unpaid_reason: "Changed reason" }, { expense_ids: [claim.id] }].each do |change|
      expect { revise([{ employment_id: employment.id, expense_ids: [], acknowledged: true }.merge(change)]) }
        .to raise_error(Payroll::Workflow::Conflict)
    end
    expect(run.current_revision.id).to eq(original.id)
    expect(instruction.reload.entitlement_minor).to eq(6_250_000)
  end

  it "keeps original claim attribution and PTO recovery history when a mixed run is approved" do
    claim = create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: "2026-11-02", status: :approved)
    record_synthetic_pto_treatment(unpaid_hours: "1")
    instruction = accepted(expenses: [claim.id])
    reservation = PayrollExpenseReservation.active.find_by!(expense: claim)
    original_revision_id = reservation.payroll_revision_id
    recovery = PayrollPtoRecovery.where(payroll_run: run, employment:).order(:id)
    original_recovery = recovery.map(&:attributes)
    expect(original_recovery).not_to be_empty
    expect(original_recovery.last).to include("kind" => "reserved", "payroll_revision_id" => original_revision_id)
    other = second_consultant

    revision = revise([{ employment_id: other.id, expense_ids: [], acknowledged: true }])
    approve(revision)

    expect(reservation.reload.payroll_revision_id).to eq(original_revision_id)
    expect(recovery.reload.map(&:attributes)).to eq(original_recovery)
    expect(instruction.reload.payroll_revision_id).to eq(original_revision_id)
    expect(workflow.status).to eq("approved")
  end

  it "accepts only a current valid billing binding as a metadata change to a retained line" do
    accepted
    revoke
    identity = Payroll::BillingIdentity.new(employment, actor: owner)
    summary = identity.summary
    identity.review!(submission_id: summary.dig(:current_submission, :id), expected_review_id: summary.dig(:current_review, :id),
      decision: "approved", reason: "Synthetic correction reviewed", manual_tax_reviewed: true, missing_pan_acknowledged: false,
      idempotency_key: "retained-new-approval")
    candidate = run.current_revision.payroll_payload.fetch("lines").sole.deep_dup
    candidate.fetch("preparation")["billing_identity"] = identity.binding
    guard = Payroll::MercuryRevisionGuard.new(run)
    expect(guard.protected_line?(candidate)).to be(true)
    candidate.fetch("preparation").fetch("billing_identity")["review_id"] = "9223372036854775807"
    expect(guard.protected_line?(candidate)).to be(false)
  end
end
