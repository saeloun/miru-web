# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PTO recovery replacement and owner review" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:opening_hours) { "0" }
  let(:funding) { "mercury_us" }
  let(:payment) { Payroll::MercuryPayment.new(run) }
  let(:reconciliation) { Payroll::MercuryReconciliation.new(run) }
  let(:india) { Payroll::IndiaHandoff.new(run) }

  before do
    if funding == "india"
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period, monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: funding, legal_entity_name: legal_name, change_reason: "Synthetic India funding")
    end
    Payroll::PtoLedger.new(employment, actor: owner).configure!(effective_on: "2026-11-01", opening_on: "2026-11-01",
      opening_hours:, monthly_accrual_hours: "0", accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review",
      rate_basis: "origin_period_fee", advance_limit_hours: "200", exception_threshold_hours: "8", negative_threshold_hours: "8",
      reason: "Synthetic explicit recovery policy", evidence: "Synthetic reconciled opening", idempotency_key: "policy")
    record_synthetic_pto_treatment(unpaid_hours: "1")
    ActionMailer::Base.deliveries.clear
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
  end

  def approve_revision_record(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    revision
  end

  def fresh_revision
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: run.current_revision&.digest, idempotency_key: SecureRandom.uuid)
    approve_revision_record(revision)
  end

  def carry_revision
    approve_revision_record(workflow.revise!(actor: accounts, payload: run.current_revision.payroll_payload.deep_dup,
      expected_digest: run.current_revision.digest, idempotency_key: SecureRandom.uuid))
  end

  def submit(leg)
    stub_mercury_write(mercury_json(mercury_request("requestId" => SecureRandom.uuid, "amount" => leg.principal_minor / 100.0)))
    payment.submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
  end

  def refresh(leg, status: "approved", transactions: nil)
    leg.reload
    request = mercury_request("requestId" => leg.provider_request_id, "amount" => leg.principal_minor / 100.0,
      "status" => status, "createdAt" => leg.provider_request_created_at.iso8601)
    stub_request(:get, "#{mercury_base}/request-send-money/#{leg.provider_request_id}").to_return(mercury_json(request))
    transactions ||= [mercury_transaction("requestId" => leg.provider_request_id, "amount" => -leg.principal_minor / 100.0, "status" => "sent")]
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => transactions.size, "transactions" => transactions }))
    reconciliation.refresh!(actor: owner, instruction_id: leg.id)
  end

  def credit(leg, reference: "SYNTHETIC-CREDIT")
    reconciliation.record_credit!(actor: accounts, instruction_id: leg.id, amount: (leg.entitlement_minor.to_d / 100).to_s("F"),
      credited_on: Date.current.iso8601, reference:)
  end

  def handoff(revision)
    india.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
  end

  def credit_handoff(report)
    india.record_credit!(actor: accounts, handoff_id: report.id, amount: (report.entitlement_minor.to_d / 100).to_s("F"),
      credited_on: Date.current.iso8601, reference: "SYNTHETIC-INDIA-CREDIT")
  end

  it "requires a fresh reservation before replacing a cancelled original Mercury leg" do
    first = fresh_revision
    leg = prepared_instruction(revision: first)
    submit(leg)
    original = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    second = carry_revision
    expect(original.reload.payroll_revision_id).to eq(first.id)
    refresh(leg, status: "cancelled", transactions: [])
    expect(leg.reload.released_at).to be_present

    expect do
      payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: second.digest, quote:)
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("pto_reservation_revision_changed") }
    expect(PayrollPaymentInstruction.count).to eq(1)

    third = fresh_revision
    current = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(current).to have_attributes(kind: "reserved", payroll_revision_id: third.id)
    expect(current.previous_recovery).to have_attributes(kind: "released", previous_recovery_id: original.id)
    replacement = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: third.digest, quote:).sole
    expect(replacement.entitlement_minor).to eq(leg.entitlement_minor)
    submit(replacement)
    refresh(replacement)
    credit(replacement)
    expect(replacement.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run)).to have_attributes(kind: "settled", payroll_revision_id: third.id)
    expect { credit(replacement) }.not_to change(PayrollPtoRecovery, :count)
  end

  context "with India funding" do
    let(:funding) { "india" }

    it "requires a fresh reservation after voiding the original queued handoff" do
      first = fresh_revision
      original_report = handoff(first)
      original = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
      second = carry_revision
      expect(original.reload.payroll_revision_id).to eq(first.id)
      india.void!(actor: owner, handoff_id: original_report.id)

      expect { handoff(second) }.to raise_error(Payroll::MercuryPayment::Blocked) do |error|
        expect(error.codes).to include("pto_reservation_revision_changed")
      end
      expect(PayrollIndiaHandoff.count).to eq(1)

      third = fresh_revision
      replacement = handoff(third)
      expect(replacement.entitlement_minor).to eq(original_report.entitlement_minor)
      Payroll::IndiaDelivery.new(replacement.payroll_india_deliveries.sole).deliver
      credit_handoff(replacement)
      expect(replacement.reload).not_to be_settlement_blocked
      expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run)).to have_attributes(kind: "settled", payroll_revision_id: third.id)
      expect { credit_handoff(replacement) }.not_to change(PayrollPtoRecovery, :count)
    end

    it "lets the still-active original queued report fulfil its original reservation after a carried revision" do
      first = fresh_revision
      report = handoff(first)
      carry_revision
      expect(india.dispatch_blocker(report)).to be_nil

      Payroll::IndiaDelivery.new(report.payroll_india_deliveries.sole).deliver
      credit_handoff(report)

      expect(report.reload).not_to be_settlement_blocked
      expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run)).to have_attributes(kind: "settled", payroll_revision_id: first.id)
      expect(ActionMailer::Base.deliveries.size).to eq(1)
    end
  end

  context "with both current and historical recovery" do
    let(:opening_hours) { "-8" }

    it "keeps completion withheld until both returned recovery heads are reviewed" do
      origin = PayrollPtoEntry.find_by!(employment:, kind: "opening")
      Payroll::PtoLedger.new(employment, actor: owner).review_obligation!(origin_entry_id: origin.id, origin_component: "opening",
        period: run.period, kind: "unpaid", reason: "Synthetic historical cash recovery", rate_amount: "62500", rate_hours: "168",
        rate_reference: "Synthetic reviewed original fee", expected_digest: Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest"),
        idempotency_key: "historical-cash")
      leg = prepared_instruction(revision: fresh_revision)
      expect(PayrollPtoRecovery.heads.where(payroll_run: run, kind: "reserved").count).to eq(2)
      submit(leg)
      refresh(leg)
      credit(leg)
      expect(PayrollPtoRecovery.heads.where(payroll_run: run, kind: "settled").count).to eq(2)
      original = mercury_transaction("requestId" => leg.reload.provider_request_id, "amount" => -leg.principal_minor / 100.0, "status" => "sent")
      refresh(leg, transactions: [original, original.merge("id" => "unrelated-adverse", "status" => "reversed")])
      reviews = PayrollPtoRecovery.heads.where(payroll_run: run, kind: "returned_review").order(:id).to_a
      expect(reviews.size).to eq(2)
      expect { refresh(leg, transactions: [original]) }.to raise_error(Payroll::Workflow::Conflict, /review/)

      reviews.each_with_index do |review, index|
        Payroll::PtoRecovery.resolve_review!(review, actor: owner, reason: "Synthetic confirmed original credit #{index}", expected_recovery_id: review.id)
        expect(leg.payroll_payment_group.reload.fully_credited_at.present?).to eq(index == 1)
      end
      expect(PayrollPtoRecovery.heads.where(payroll_run: run, kind: "returned_review")).to be_empty
      expect(leg.payroll_payment_events.where(kind: "pto_credit_review_approved").count).to eq(1)
    end
  end
end
