# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::PtoLedger do
  include_context "approved mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  let(:run) do
    PayrollRun.create!(company:, period: Date.new(2026, 9, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
  end

  before do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    # September 2026 has exactly twenty weekdays after these two holidays.
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period,
      monthly_fee: 100_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us",
      legal_entity_name: legal_name, change_reason: "Synthetic terms")
    work_entry.update!(work_date: Date.new(2026, 9, 2), duration: 9_000, review_status: "approved")
    holiday = create(:holiday, company:, year: 2026)
    [Date.new(2026, 9, 3), Date.new(2026, 9, 4)].each do |date|
      create(:holiday_info, holiday:, date:, category: :national)
    end
  end

  let(:ledger) { described_class.new(employment, actor: owner) }

  def policy(opening: "40", accrual: "0", accrual_day: "1", effective_on: "2026-09-01")
    ledger.configure!(effective_on:, opening_hours: opening, opening_on: "2026-09-01",
      monthly_accrual_hours: accrual, accrual_day:, leave_year_month: "4", leave_year_day: "1",
      carry_rule: "review", advance_limit_hours: "100", exception_threshold_hours: "8", negative_threshold_hours: "8",
      rate_basis: "origin_period_fee", reason: "Synthetic reconciled opening and approved engagement policy",
      evidence: "synthetic-opening-2026", idempotency_key: SecureRandom.uuid)
  end

  def facts
    Payroll::PtoFacts.new(employment, month: run.period).call
  end

  def decide(kind, **options)
    ledger.decide!(period: run.period, kind:, reason: "Synthetic explicit #{kind}",
      expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid, **options)
  end

  def review
    Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current).process
  end

  it "pays 150 work plus 10 approved paid hours and consumes opening forty only once" do
    policy
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period,
      monthly_fee: 100_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india",
      legal_entity_name: legal_name, change_reason: "Synthetic India funding")
    decide("paid")
    expect(review).to include(recorded_hours: "150.0", working_days: "18.75", expected_hours: "160.0",
      approved_paid_hours: "10.0", opening_pto_hours: "40.0", closing_pto_hours: "30.0", fee_estimate: "100000.0")
    expect { 2.times { review } }.not_to change(PayrollPtoEntry, :count)
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    handoff = Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "synthetic-accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    expect(handoff.report.fetch("pto")).to include("opening_hours" => "40.0", "paid_hours" => "10.0", "closing_hours" => "30.0")
    email = PayrollIndiaMailer.report(handoff.payroll_india_deliveries.sole.id).message
    [email.text_part.body.decoded, email.html_part.body.decoded].each do |body|
      expect(body).to include("Approved paid leave", "Opening PTO hours", "Closing PTO hours", "10.0", "40.0", "30.0", "INR 100,000.00")
      expect(body).not_to include("Not classified in source records")
    end
  end

  it "pays only 62.5 percent for 100 work and sixty explicitly unpaid hours, without debiting PTO" do
    policy
    work_entry.update!(duration: 6_000)
    decide("unpaid")
    expect(review).to include(confirmed_unpaid_hours: "60.0", fee_estimate: "62500.0", closing_pto_hours: "40.0")
  end

  it "keeps a 599-minute decision fresh and approvable without reconstructing rounded display hours" do
    policy
    work_entry.update!(duration: 9_001)
    expect(facts).to include("gap_minutes" => "599.0", "unresolved_minutes" => "599.0", "closing_minutes" => "2400.0")
    expect(facts.fetch("gap_hours").to_d).to eq(599.to_d / 60)
    decision = decide("unpaid")
    expect(decision.reload.minutes).to eq(599)
    expect(facts).to include("decision_id" => decision.id, "decision" => "unpaid", "blockers" => [])
    expect(review).to include(approved_work_hours: "150.0167", fee_estimate: "93760.42", closing_pto_hours: "40.0")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(workflow.status).to eq("approved")
    line = revision.payroll_payload.fetch("lines").sole
    expect(line.dig("source_snapshot", "pto", "allocations")).to eq([{ "kind" => "unpaid", "minutes" => "599.0" }])
    expect(line.fetch("amounts")).to include("base_minor" => 9_376_042, "net_minor" => 9_376_042)
    calculation = line.fetch("calculation_snapshot")
    expect(calculation.fetch("input")).to include("paid_quantity" => "9001.0", "basis_quantity" => "9600.0")
    expect(calculation.dig("input", "quantity_source")).to eq(line.dig("source_snapshot", "digest"))
    expect(PayrollCalculation::Calculator.verify_snapshot?(calculation)).to be(true)
  end

  it "rounds the exact 580-minute unpaid proration half up in the estimate and approved calculation" do
    policy
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period,
      monthly_fee: "96002.40", hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us",
      legal_entity_name: legal_name, change_reason: "Synthetic exact half-paisa fee")
    work_entry.update!(duration: 9_020)
    expect(decide("unpaid").reload.minutes).to eq(580)
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    line = revision.payroll_payload.fetch("lines").sole
    aggregate_failures do
      expect(review.fetch(:fee_estimate)).to eq("90202.26")
      expect(line.fetch("amounts")).to include("base_minor" => 9_020_226, "net_minor" => 9_020_226)
      expect(line.dig("calculation_snapshot", "net")).to eq("90202.26")
      expect(line.dig("calculation_snapshot", "input")).to include("paid_quantity" => "9020.0", "basis_quantity" => "9600.0")
      expect(line.dig("calculation_snapshot", "policy")).to include(
        "paid_quantity_name" => "scheduled minutes less confirmed unpaid minutes", "basis_quantity_name" => "scheduled minutes")
      expect(PayrollCalculation::Calculator.verify_snapshot?(line.fetch("calculation_snapshot"))).to be(true)
      expect(workflow.status).to eq("approved")
    end
  end

  it "allows sixty advance hours and recovers through configured future accrual exactly once" do
    policy(opening: "0", accrual: "16")
    work_entry.update!(duration: 6_000)
    decide("advance")
    expect(review).to include(approved_paid_hours: "60.0", closing_pto_hours: "-60.0", fee_estimate: "100000.0")
    2.times { ledger.accrue!(through: Date.new(2026, 10, 1)) }
    next_month = Payroll::PtoFacts.new(employment, month: Date.new(2026, 10, 1)).call
    expect(next_month.fetch("closing_hours")).to eq("-44.0")
    expect(PayrollPtoEntry.where(kind: "accrual").count).to eq(1)
  end

  it "never makes unexplained sixty hours unpaid or finalizable through acknowledgment" do
    policy(opening: "0")
    work_entry.update!(duration: 6_000)
    expect(review).to include(confirmed_unpaid_hours: "0.0", fee_estimate: "100000.0", unresolved_pto_hours: "60.0")
    expect do
      Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
        expected_digest: nil, idempotency_key: SecureRandom.uuid)
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("pto_decision_required") }
  end

  it "pays all current work despite a historical negative forty-hour opening" do
    policy(opening: "-40")
    work_entry.update!(duration: 9_600)
    expect(review).to include(confirmed_unpaid_hours: "0.0", fee_estimate: "100000.0", closing_pto_hours: "-40.0")
    expect(Payroll::PtoReport.new(company, as_of: run.period.end_of_month).call.fetch(:cases))
      .to include(a_hash_including(employment_id: employment.id, historical_negative_hours: "40.0"))
  end

  it "retains defer, reasoned waiver, and correction history without inventing deductions" do
    policy(opening: "0")
    work_entry.update!(duration: 6_000)
    deferred = decide("defer")
    expect(review).to include(deferred_pto_hours: "60.0", fee_estimate: "100000.0")
    correction = decide("correction")
    expect(correction.previous_entry_id).to eq(deferred.id)
    expect(review.fetch(:warnings)).to include("pto_decision_required")
    waived = decide("waive")
    expect(waived.previous_entry_id).to eq(correction.id)
    expect(review).to include(confirmed_unpaid_hours: "0.0", closing_pto_hours: "0.0", fee_estimate: "100000.0")
    expect { waived.update!(reason: "replace history") }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end

  it "rejects stale decisions and requires explicit owner configuration" do
    expect(facts.fetch("blockers")).to include("pto_policy_required")
    policy
    old = facts.fetch("digest")
    work_entry.update!(duration: 6_000)
    expect do
      ledger.decide!(period: run.period, kind: "unpaid", reason: "Synthetic",
        expected_digest: old, idempotency_key: SecureRandom.uuid)
    end.to raise_error(Payroll::Workflow::Conflict)
    accounts_ledger = described_class.new(employment, actor: accounts)
    expect do
      accounts_ledger.decide!(period: run.period, kind: "unpaid", reason: "Synthetic",
        expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid)
    end.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "freezes approved PTO facts and reserves and settles one unpaid recovery without self-invalidating approval" do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period,
      monthly_fee: 100_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india",
      legal_entity_name: legal_name, change_reason: "Synthetic India funding")
    policy
    work_entry.update!(duration: 6_000)
    decision = decide("unpaid")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(revision.payroll_payload.dig("lines", 0, "source_snapshot", "pto", "unpaid_hours")).to eq("60.0")
    reservation = PayrollPtoRecovery.heads.find_by!(payroll_pto_entry: decision)
    expect(reservation).to have_attributes(kind: "reserved", amount_minor: 3_750_000)
    expect(workflow.status).to eq("approved")
    expect { Payroll::PtoRecovery.settle!(run, employment.id) }.to raise_error(Payroll::Workflow::Conflict, /confirmed/)
    india = Payroll::IndiaHandoff.new(run)
    handoff = india.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "synthetic-accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    handoff.payroll_india_deliveries.last.update!(state: "sent", sent_at: Time.current)
    india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "1000.00", reference: "Synthetic partial", credited_on: Date.current.iso8601)
    expect(PayrollPtoRecovery.where(kind: "settled")).to be_empty
    2.times do
      india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "61500.00", reference: "Synthetic balance", credited_on: Date.current.iso8601)
    end
    expect(PayrollPtoRecovery.where(kind: "settled").count).to eq(1)
    expect(workflow.status).to eq("approved")
    expect { decide("waive") }.to raise_error(Payroll::Workflow::Conflict)
    expect { policy }.to raise_error(Payroll::Workflow::Conflict, /Bank activity/)
    work_entry.update!(duration: 9_600)
    expect { decide("correction") }.to raise_error(Payroll::Workflow::Conflict, /Bank activity/)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([decision.attributes.except("id").merge("previous_entry_id" => decision.id,
          "kind" => "correction", "minutes" => 0, "allocations" => [], "idempotency_key" => "raw-clear-paid-history")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /recovery/)
  end

  it "invalidates approval after a same-period decision correction and retains frozen historical facts" do
    policy
    decide("paid")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    zero_recording = revision.payroll_payload.fetch("lines").first.fetch("source_resolutions").find { |entry| entry["code"] == "no_timeoff_entries" }
    expect(zero_recording.fetch("decision")).to eq("reviewed_pto_ledger")
    before = revision.payroll_payload.deep_dup
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    decide("defer")
    expect(workflow.status).to eq("draft")
    expect(revision.reload.payroll_payload).to eq(before)
    expect(revision.approval_issues).to include("invalid_snapshot")
  end

  it "recovers only the forty-four hours not already repaid by accrual, with an explicit historical rate" do
    policy(opening: "0", accrual: "16")
    work_entry.update!(duration: 6_000)
    advance = decide("advance")
    ledger.accrue!(through: Date.new(2026, 10, 1))
    target = Date.new(2026, 10, 1)
    create(:timesheet_entry, user: worker, project: work_entry.project, work_date: target + 1, duration: 10_560, review_status: "approved")
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: target,
      monthly_fee: 100_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india",
      legal_entity_name: legal_name, change_reason: "Synthetic later-period India funding")
    digest = Payroll::PtoFacts.new(employment, month: target).call.fetch("digest")
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        ledger.review_obligation!(origin_entry_id: advance.id, period: target, kind: "unpaid", reason: "Synthetic wrong historical basis",
          rate_amount: "100000", rate_hours: "100", rate_reference: "Synthetic mismatched basis", expected_digest: digest, idempotency_key: SecureRandom.uuid)
        raise ActiveRecord::Rollback
      end
    end.to raise_error(Payroll::ConsultantReview::InvalidInput, /origin/)
    command = { origin_entry_id: advance.id, period: target, kind: "unpaid",
      reason: "Synthetic year-end explicit recovery", rate_amount: "100000", rate_hours: "160",
      rate_reference: "Synthetic September approved fee basis", expected_digest: digest, idempotency_key: SecureRandom.uuid }
    recovered = ledger.review_obligation!(**command)
    expect(recovered.minutes / 60).to eq(44)
    expect(recovered.cash_amount_minor).to eq(2_750_000)
    expect(Payroll::PtoFacts.new(employment, month: target).call).to include("closing_hours" => "0.0", "historical_deduction_minor" => 2_750_000)
    expect(facts).to include("closing_hours" => "-60.0")
    expect { expect(ledger.review_obligation!(**command).id).to eq(recovered.id) }.not_to change(PayrollPtoEntry, :count)
    expect do
      expect { ledger.review_obligation!(**command.merge(unknown_option: "not-permitted")) }.to raise_error(ArgumentError, /Unknown key/)
      expect { ledger.review_obligation!(**command.except(:expected_digest)) }.to raise_error(ArgumentError, /expected_digest/)
    end.not_to change(PayrollPtoEntry, :count)
    pending = Payroll::PtoReport.new(company, as_of: Date.new(2026, 11, 30)).call.fetch(:cases).find { |row| row[:employment_id] == employment.id }
    expect(pending.fetch(:cash_cases)).to include(a_hash_including(entry_id: recovered.id, amount_minor: "2750000", state: "unreserved"))
    expect { ledger.accrue!(through: Date.new(2026, 10, 1)) }.not_to change(PayrollPtoAllocation, :count)
    later_run = PayrollRun.create!(company:, period: target, currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    later_workflow = Payroll::Workflow.new(later_run)
    prepare = lambda do |key|
      Payroll::ConsultantRevision.new(later_run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
        expected_digest: later_run.current_revision&.digest, idempotency_key: key)
    end
    approve = lambda do |revision|
      later_workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      later_workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    end
    first_revision = prepare.call("synthetic-cash-first")
    approve.call(first_revision)
    expect(PayrollPtoRecovery.heads.find_by!(payroll_pto_entry: recovered).kind).to eq("reserved")
    next_revision = prepare.call("synthetic-cash-replacement")
    expect(Payroll::PtoReport.new(company, as_of: Date.new(2026, 11, 30)).cash_cases(employment))
      .to include(a_hash_including(entry_id: recovered.id, state: "released", amount_minor: "2750000"))
    approve.call(next_revision)
    india = Payroll::IndiaHandoff.new(later_run)
    handoff = india.create!(actor: owner, employment_id: employment.id, expected_digest: next_revision.digest,
      accounts_email: "synthetic-accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    handoff.payroll_india_deliveries.last.update!(state: "sent", sent_at: Time.current)
    india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "1000.00", reference: "Synthetic historical partial", credited_on: Date.current.iso8601)
    expect(Payroll::PtoReport.new(company, as_of: Date.new(2026, 11, 30)).cash_cases(employment))
      .to include(a_hash_including(entry_id: recovered.id, state: "reserved", amount_minor: "2750000"))
    2.times do
      india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "71500.00", reference: "Synthetic historical balance", credited_on: Date.current.iso8601)
    end
    expect(PayrollPtoRecovery.where(payroll_pto_entry: recovered, kind: "settled").count).to eq(1)
    expect(Payroll::PtoReport.new(company, as_of: Date.new(2026, 11, 30)).cash_cases(employment)).to be_empty
  end

  it "allows explicit waiver of the reconciled historical negative opening without deducting current pay" do
    policy(opening: "-40")
    work_entry.update!(duration: 9_600)
    origin = PayrollPtoEntry.find_by!(employment:, kind: "opening")
    ledger.review_obligation!(origin_entry_id: origin.id, period: run.period, kind: "waive",
      reason: "Synthetic owner waiver", expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid)
    expect(review).to include(closing_pto_hours: "0.0", fee_estimate: "100000.0", confirmed_unpaid_hours: "0.0")
  end

  it "reports only newly borrowed hours as advance when forty paid hours cover part of a sixty-hour gap" do
    policy
    work_entry.update!(duration: 6_000)
    decide("advance")
    expect(review).to include(approved_paid_hours: "60.0", advance_pto_hours: "20.0", closing_pto_hours: "-20.0", fee_estimate: "100000.0")
  end

  it "freezes a partial unpaid allocation and full-pay remainder without accepting a preparation override" do
    policy
    work_entry.update!(duration: 6_000)
    command = { period: run.period, allocations: [{ kind: "unpaid", hours: "23" }, { kind: "defer", hours: "37" }],
      reason: "Synthetic separately confirmed unpaid and explicit full-pay deferral", expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid }
    entry = ledger.allocate!(**command)
    expect(ledger.allocate!(**command.merge(allocations: command[:allocations].reverse)).id).to eq(entry.id)
    expect do
      ledger.allocate!(**command.merge(allocations: [{ kind: "unpaid", hours: "8" }, { kind: "defer", hours: "52" }]))
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(review).to include(confirmed_unpaid_hours: "23.0", deferred_pto_hours: "37.0", fee_estimate: "85625.0", closing_pto_hours: "40.0")
    expect do
      Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current, inputs: { confirmed_unpaid_hours: "60" }).process
    end.to raise_error(Payroll::ConsultantReview::InvalidInput, /approved PTO decisions/)
  end

  it "does not duplicate forty opening debt when a new ten-hour gap is advanced" do
    policy(opening: "-40", accrual: "16")
    advance = decide("advance")
    expect(advance.debt_minutes / 60).to eq(10)
    ledger.accrue!(through: Date.new(2026, 10, 1))
    obligations = Payroll::PtoObligations.new(employment, as_of: Date.new(2026, 10, 31)).call
    expect(obligations.sum(0.to_d) { |row| row[:remaining_minutes] } / 60).to eq(34)
    expect(Payroll::PtoFacts.new(employment, month: Date.new(2026, 10, 1)).call.fetch("closing_hours")).to eq("-34.0")
  end

  it "does not require or grant accrual after exit before the configured credit day" do
    policy(opening: "0", accrual: "16")
    employment.update!(resigned_at: Date.new(2026, 10, 15))
    # A new approved version chooses day 28 explicitly; the opening remains reconciled.
    attributes = { effective_on: "2026-10-01", opening_on: "2026-09-01", opening_hours: "0", monthly_accrual_hours: "16",
      accrual_day: "28", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "100", exception_threshold_hours: "8", negative_threshold_hours: "8", reason: "Synthetic explicit schedule",
      evidence: "synthetic-opening-2026", idempotency_key: SecureRandom.uuid }
    ledger.configure!(**attributes)
    ledger.accrue!(through: Date.new(2026, 12, 1))
    after_exit = Payroll::PtoFacts.new(employment.reload, month: Date.new(2026, 12, 1)).call
    expect(after_exit.fetch("blockers")).not_to include("pto_accrual_pending")
    expect(PayrollPtoEntry.where(kind: "accrual")).to be_empty
  end

  it "posts earned late-day accrual once after early payment without rewriting its frozen financial report" do
    travel_to(Time.utc(2026, 9, 10, 12))
    policy(opening: "0", accrual: "16", accrual_day: "28")
    work_entry.update!(duration: 6_000)
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period,
      monthly_fee: 100_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india",
      legal_entity_name: legal_name, change_reason: "Synthetic India funding")
    decide("unpaid")
    expect(facts.fetch("blockers")).not_to include("pto_accrual_pending")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601,
      expected_digest: nil, idempotency_key: SecureRandom.uuid)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    india = Payroll::IndiaHandoff.new(run)
    handoff = india.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "synthetic-accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    handoff.payroll_india_deliveries.last.update!(state: "sent", sent_at: Time.current)
    india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "62500.00", reference: "Synthetic early credit", credited_on: Date.current.iso8601)
    frozen_payload, frozen_report = revision.payroll_payload.deep_dup, handoff.report.deep_dup
    travel_to(Time.utc(2026, 10, 28, 12))
    owner.update!(current_workspace: create(:company))
    2.times { ledger.accrue!(through: Date.current, scheduled: true) }
    expect(PayrollPtoEntry.where(employment:, kind: "accrual").sum(:minutes) / 60).to eq(32)
    expect(revision.reload.payroll_payload).to eq(frozen_payload)
    expect(handoff.reload.report).to eq(frozen_report)
    expect(handoff.entitlement_minor).to eq(6_250_000)
    expect(PayrollPtoRecovery.where(kind: "settled").count).to eq(1)
  end

  it "rejects a retroactive policy replacement that disagrees with an already posted accrual" do
    original = policy(opening: "0")
    ledger.accrue!(through: Date.new(2026, 10, 1))
    expect do
      policy(opening: "0", accrual: "16", effective_on: "2026-10-01")
    end.to raise_error(Payroll::Workflow::Conflict, /accrual/)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        ConsultantPtoPolicy.insert_all!([original.attributes.except("id").merge(
          "effective_on" => Date.new(2026, 10, 1), "monthly_accrual_minutes" => 960, "idempotency_key" => "raw-posted-policy")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /accrual/)
  end

  it "preserves a cash treatment once an intervening earned credit has changed the debt balance" do
    policy(opening: "-40", accrual: "10")
    origin = PayrollPtoEntry.find_by!(employment:, kind: "opening")
    cash = ledger.review_obligation!(origin_entry_id: origin.id, period: run.period, kind: "unpaid",
      reason: "Synthetic explicitly approved historical cash", expected_digest: facts.fetch("digest"), idempotency_key: "historical-cash",
      rate_amount: "100000", rate_hours: "160", rate_reference: "Synthetic reconciled origin basis")
    ledger.accrue!(through: Date.new(2026, 10, 1))
    expect(Payroll::PtoFacts.new(employment, month: Date.new(2026, 10, 1)).call.fetch("closing_hours")).to eq("10.0")
    expect do
      ledger.review_obligation!(origin_entry_id: origin.id, period: run.period, kind: "defer",
        origin_component: "opening", reason: "Synthetic attempted backdated debt reopening", expected_digest: facts.fetch("digest"), idempotency_key: "reopen-after-accrual")
    end.to raise_error(Payroll::Workflow::Conflict, /accrual/)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([cash.attributes.except("id").merge("previous_entry_id" => cash.id,
          "kind" => "review_defer", "balance_delta_minutes" => 0, "cash_amount_minor" => 0, "idempotency_key" => "raw-reopen-cash")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /accrual/)
    expect(Payroll::PtoObligations.new(employment, as_of: Date.new(2026, 10, 31)).call).to be_empty
  end

  it "clears an obsolete leave allocation explicitly after corrected work fills the entire gap" do
    policy
    paid = decide("paid")
    work_entry.update!(duration: 9_600)
    expect(facts.fetch("blockers")).to include("pto_decision_source_changed")
    cleared = decide("correction")
    expect(cleared.previous_entry_id).to eq(paid.id)
    expect(cleared.minutes).to eq(0)
    expect(review).to include(approved_paid_hours: "0.0", closing_pto_hours: "40.0", fee_estimate: "100000.0")
    expect(facts.fetch("blockers")).to eq([])
    expect(paid.reload.balance_delta_minutes).to eq(-600)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([cleared.attributes.except("id").merge("previous_entry_id" => cleared.id,
          "allocations" => [{ "kind" => "unpaid", "minutes" => "60" }], "idempotency_key" => "raw-zero-gap-deduction")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /complete approved quantity/)
  end

  it "posts an earned company-local credit when the UTC date is still the previous day" do
    company.update!(timezone: "Asia/Kolkata")
    policy(opening: "0", accrual: "16", accrual_day: "9")
    Time.use_zone("UTC") do
      travel_to(Time.utc(2026, 11, 8, 18, 45))
      expect(company.resolved_time_zone.today).to eq(Date.new(2026, 11, 9))
      expect { ledger.accrue!(through: company.resolved_time_zone.today) }.not_to raise_error
    end
    expect(PayrollPtoEntry.where(employment:, kind: "accrual", period: Date.new(2026, 11, 1)).sum(:minutes) / 60).to eq(16)
  end

  it "rejects backdated leave debits against a balance already consumed by a later approved decision" do
    policy
    work_entry.update!(duration: 6_000)
    unpaid = decide("unpaid")
    later = Date.new(2026, 10, 1)
    create(:timesheet_entry, user: worker, project: work_entry.project, work_date: later + 1, duration: 8_160, review_status: "approved")
    ledger.decide!(period: later, kind: "paid", reason: "Synthetic later forty-hour paid leave",
      expected_digest: Payroll::PtoFacts.new(employment, month: later).call.fetch("digest"), idempotency_key: "later-paid")
    expect do
      ledger.allocate!(period: run.period, allocations: [{ kind: "paid", hours: "40" }, { kind: "unpaid", hours: "20" }],
        reason: "Synthetic attempted backdated debit", expected_digest: facts.fetch("digest"), idempotency_key: "backdated-paid")
    end.to raise_error(Payroll::Workflow::Conflict, /later/)
    expect(Payroll::PtoFacts.new(employment, month: later).call.fetch("closing_hours")).to eq("0.0")
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([unpaid.attributes.except("id").merge("previous_entry_id" => unpaid.id,
          "kind" => "allocation", "allocations" => [{ "kind" => "paid", "minutes" => "2400" }, { "kind" => "unpaid", "minutes" => "1200" }],
          "balance_delta_minutes" => -2400, "idempotency_key" => "raw-backdated-paid")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /later/)
  end

  it "keeps nonzero historical decisions in their original period and permits later zero-delta review" do
    policy(opening: "-40")
    origin = PayrollPtoEntry.find_by!(employment:, kind: "opening")
    october, november, march = Date.new(2026, 10, 1), Date.new(2026, 11, 1), Date.new(2027, 3, 1)
    month_facts = ->(month) { Payroll::PtoFacts.new(employment, month:).call }
    cash = ledger.review_obligation!(origin_entry_id: origin.id, origin_component: "opening", period: october, kind: "unpaid",
      reason: "Synthetic original October cash review", expected_digest: month_facts.call(october).fetch("digest"), idempotency_key: "october-cash",
      rate_amount: "100000", rate_hours: "160", rate_reference: "Synthetic reconciled opening rate")
    expect(month_facts.call(october).fetch("closing_hours")).to eq("0.0")
    expect(month_facts.call(november).fetch("opening_hours")).to eq("0.0")
    travel_to(Time.utc(2027, 3, 31, 12))
    expect do
      ledger.review_obligation!(origin_entry_id: origin.id, origin_component: "opening", period: march, kind: "waive",
        reason: "Synthetic attempted period shift", expected_digest: month_facts.call(march).fetch("digest"), idempotency_key: "march-shift")
    end.to raise_error(Payroll::Workflow::Conflict, /period/)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([cash.attributes.except("id").merge("previous_entry_id" => cash.id, "period" => march,
          "kind" => "review_waive", "cash_amount_minor" => 0, "idempotency_key" => "raw-period-shift")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /period/)
    ledger.review_obligation!(origin_entry_id: origin.id, origin_component: "opening", period: october, kind: "waive",
      reason: "Synthetic same-period cash waiver", expected_digest: month_facts.call(october).fetch("digest"), idempotency_key: "october-waiver")
    expect(month_facts.call(november).fetch("opening_hours")).to eq(month_facts.call(october).fetch("closing_hours"))
    advance = decide("advance")
    ledger.review_obligation!(origin_entry_id: advance.id, origin_component: "advance", period: october, kind: "defer",
      reason: "Synthetic zero-delta deferral", expected_digest: month_facts.call(october).fetch("digest"), idempotency_key: "october-defer")
    ledger.review_obligation!(origin_entry_id: advance.id, origin_component: "advance", period: march, kind: "waive",
      reason: "Synthetic later explicit debt waiver", expected_digest: month_facts.call(march).fetch("digest"), idempotency_key: "march-waiver")
    expect(month_facts.call(march)).to include("opening_hours" => "-10.0", "closing_hours" => "0.0")
  end
end
