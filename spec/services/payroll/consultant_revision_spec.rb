# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::ConsultantRevision do
  include_context "approved mercury consultant payroll"

  let(:cutoff) { Date.current.iso8601 }
  let(:builder) { described_class.new(run, actor: accounts) }
  let!(:claim) do
    create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved, approved_at: 1.minute.ago)
  end

  before do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    company.update!(timezone: "Asia/Kolkata") if company.timezone.blank?
  end

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  def build(unpaid: nil, reason: nil, expenses: [], **extra)
    builder.create!(
      consultants: [{ employment_id: employment.id, confirmed_unpaid_hours: unpaid, unpaid_reason: reason, expense_ids: expenses, acknowledged: true }.merge(extra)],
      cutoff:, expected_digest: run.current_revision&.digest, idempotency_key: SecureRandom.uuid
    )
  end

  def approve(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
  end

  def line(revision)
    revision.payroll_payload["lines"].first
  end

  def expected_full_month_hours
    (Date.new(2026, 11, 1)..Date.new(2026, 11, 30)).count { |date| (1..5).cover?(date.cwday) } * 8
  end

  it "builds a revision the existing snapshot validation approves" do
    revision = build
    expect(revision.approval_issues).to eq([])
    approve(revision)
    expect(workflow.status).to eq("approved")
    expect(line(revision)["pay_type"]).to eq("consultant")
    expect(line(revision).dig("amounts", "net_minor")).to eq(6_250_000)
  end

  it "prorates the fee for confirmed unpaid hours but never the reimbursement" do
    unpaid = (expected_full_month_hours * 0.375).to_s
    revision = build(unpaid:, reason: "Approved unpaid leave", expenses: [claim.id])
    amounts = line(revision)["amounts"]
    expect(amounts["base_minor"]).to eq(3_906_250)
    expect(amounts["reimbursements_minor"]).to eq(500_000)
    expect(amounts["net_minor"]).to eq(4_406_250)
    expect(line(revision)["reimbursements"].first["source_reference"]).to eq(Payroll::ClaimReference.for(claim))
  end

  it "records withholding and deductions separately from fee" do
    revision = build(withholding: "1000.00", other_deduction: "500.00", other_earning: "250.00")
    amounts = line(revision)["amounts"]
    expect(amounts.values_at("base_minor", "extras_minor", "deductions_minor", "net_minor")).to eq([6_250_000, 25_000, 150_000, 6_125_000])
    expect(line(revision)["deductions"].pluck("code")).to contain_exactly("withholding", "other_deduction")
    expect(revision.approval_issues).to eq([])
  end

  it "requires an explicit acknowledgement of warnings and exceptions" do
    expect do
      builder.create!(consultants: [{ employment_id: employment.id, expense_ids: [], acknowledged: false }], cutoff:, expected_digest: nil, idempotency_key: "x")
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to eq(["acknowledgement_required"]) }
  end

  it "records the acknowledging actor against each resolved warning" do
    resolutions = line(build)["source_resolutions"]
    expect(resolutions.pluck("actor_id").uniq).to eq([accounts.id])
    expect(resolutions.pluck("code")).to include("no_timeoff_entries", "unexplained_hours")
  end

  it "never deducts for missing time without an explicit decision" do
    expect(line(build).dig("amounts", "net_minor")).to eq(6_250_000)
  end

  it "rejects claims that are pending, rejected, paid, foreign or another person's" do
    other = create(:employment, company:, resigned_at: nil)
    candidates = [
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :submitted),
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :rejected),
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :paid, paid_at: Time.current),
      create(:expense, company:, user: worker, amount: 10, currency: "USD", date: Date.new(2026, 11, 2), status: :approved),
      create(:expense, company:, user: other.user, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :approved)
    ]
    candidates.each do |expense|
      expect { build(expenses: [expense.id]) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
  end

  it "keeps a not-ready consultant from blocking another" do
    missing = create(:employment, company:, user: create(:user), resigned_at: nil, joined_at: Date.new(2020, 1, 1))
    ConsultantCompensation.create!(employment: missing, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 1000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic")
    summary = builder.preparation(cutoff:)
    not_ready = summary.find { |row| row[:employment_id] == missing.id }
    ready = summary.find { |row| row[:employment_id] == employment.id }
    expect(not_ready[:ready]).to be(false)
    expect(not_ready[:not_ready_reasons]).to include("no_work_entries")
    expect(ready[:ready]).to be(true)
    expect { build }.not_to raise_error
  end

  it "only lets the assigned accounts reviewer prepare" do
    other = described_class.new(run, actor: owner)
    expect do
      other.create!(consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff:, expected_digest: nil, idempotency_key: "y")
    end.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "retains the unpaid reason and cutoff in the approved line" do
    revision = build(unpaid: "8", reason: "Approved unpaid leave")
    expect(line(revision)["preparation"]).to eq("cutoff" => cutoff, "confirmed_unpaid_hours" => "8.0", "unpaid_reason" => "Approved unpaid leave")
    expect(revision.approval_issues).to eq([])
  end

  it "still rejects malformed payloads with validation errors when no bank activity exists" do
    expect do
      workflow.revise!(actor: accounts, payload: nil, idempotency_key: "bad", expected_digest: nil)
    end.to raise_error(ActiveRecord::RecordInvalid)
  end

  describe "reservation" do
    it "reserves selected claims only at final approval" do
      revision = build(expenses: [claim.id])
      expect(claim.reload.payroll_reserved?).to be(false)
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      expect(claim.reload.payroll_reserved?).to be(false)
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      expect(claim.reload.payroll_reserved?).to be(true)
      expect(claim.status).to eq("approved")
      expect(workflow.status).to eq("approved")
    end

    it "blocks direct settlement, review changes, edits and deletion of a reserved claim" do
      approve(build(expenses: [claim.id]))
      expect { claim.reload.mark_paid! }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      expect { claim.reload.update!(amount: 1) }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      expect { claim.reload.reject! }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      policy = ExpensePolicy.new(owner, claim.reload)
      expect([policy.mark_paid?, policy.update?, policy.destroy?, policy.approve?]).to all(be(false))
    end

    it "keeps a reserved claim out of another run" do
      approve(build(expenses: [claim.id]))
      later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      review = Payroll::ConsultantReview.new(employment:, month: later.period, cutoff: Date.current, inputs: { own_run_id: later.id }).process
      expect(review[:eligible_expenses]).to be_empty
      expect(review[:excluded_expenses]["reserved_by_payroll"]).to eq(1)
    end

    it "does not reserve the same claim from two runs" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      PayrollExpenseReservation.create!(company_id: company.id, expense: claim, payroll_run: later, payroll_revision: revision, employment:, amount_minor: 500_000)
      expect do
        workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      end.to raise_error(ActiveRecord::RecordInvalid, /unresolved review issues/)
      expect(revision.payroll_approvals.where(stage: "final")).to be_empty
      expect(PayrollExpenseReservation.where(expense: claim, payroll_run: run)).to be_empty
    end

    it "turns a lost reservation race into a conflict and keeps no approval" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      allow(PayrollExpenseReservation).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique)
      expect do
        workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      end.to raise_error(Payroll::Workflow::Conflict)
      expect(revision.payroll_approvals.where(stage: "final")).to be_empty
    end

    it "invalidates approval when the claim changes before reservation" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      claim.reload.update!(amount: 4_000)
      expect(revision.approval_issues).to include("claim_changed:#{claim.id}")
      expect(workflow.status).to eq("draft")
    end

    it "releases a reservation when a new revision replaces a consultant with nothing in flight" do
      revision = build(expenses: [claim.id])
      approve(revision)
      build
      expect(claim.reload.payroll_reserved?).to be(false)
      expect(PayrollExpenseReservation.where(expense: claim).pick(:released_at)).to be_present
    end

    it "settles through the expense on full credit and only once" do
      revision = build(expenses: [claim.id])
      approve(revision)
      verified_connection
      linked_recipient
      leg = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => (leg.principal_minor / 100.0))))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      PayrollPaymentInstruction.find(leg.id).update!(request_status: "approved", transaction_status: "sent", transaction_link_state: "linked")
      service = Payroll::MercuryReconciliation.new(run)
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "1000.00", credited_on: Date.current.iso8601, reference: "UTR1")
      expect(claim.reload).not_to be_paid
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "66500.00", credited_on: Date.current.iso8601, reference: "UTR2")
      expect(claim.reload).to be_paid
      expect(PayrollExpenseReservation.find_by!(expense: claim).settled_at).to be_present
      expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    end

    it "lets a later revision keep a claim this run already settled" do
      revision = build(expenses: [claim.id])
      approve(revision)
      verified_connection
      linked_recipient
      leg = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => (leg.principal_minor / 100.0))))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      PayrollPaymentInstruction.find(leg.id).update!(request_status: "approved", transaction_status: "sent", transaction_link_state: "linked")
      Payroll::MercuryReconciliation.new(run).record_credit!(actor: accounts, instruction_id: leg.id, amount: "67500.00", credited_on: Date.current.iso8601, reference: "UTR1")
      expect(claim.reload).to be_paid
      newer = build(expenses: [claim.id])
      expect(newer.approval_issues).to eq([])
      approve(newer)
      expect(workflow.status).to eq("approved")
    end

    it "does not settle the claim from approval or a sent wire" do
      revision = build(expenses: [claim.id])
      approve(revision)
      expect(claim.reload).not_to be_paid
      expect(revision.reload.approval_issues).to eq([])
    end
  end
end
