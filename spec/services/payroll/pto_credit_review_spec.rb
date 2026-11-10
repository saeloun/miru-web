# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PTO recovery after credit reconciliation" do
  include_context "approved mercury consultant payroll"
  let(:run) { PayrollRun.create!(company:, period: Date.new(2026, 9, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner) }
  let(:ledger) { Payroll::PtoLedger.new(employment, actor: owner) }
  let(:service) { Payroll::MercuryReconciliation.new(run) }
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period, monthly_fee: 100_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic terms")
    work_entry.update!(work_date: Date.new(2026, 9, 2), duration: 6_000, review_status: "approved")
    calendar = create(:holiday, company:, year: 2026)
    %w[2026-09-03 2026-09-04].each { |date| create(:holiday_info, holiday: calendar, date:, category: :national) }
    ledger.configure!(effective_on: "2026-09-01", opening_on: "2026-09-01", opening_hours: "0", monthly_accrual_hours: "0",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "80", exception_threshold_hours: "8", negative_threshold_hours: "8", reason: "Synthetic owner policy",
      evidence: "Synthetic reconciled opening", idempotency_key: "policy")
    ledger.decide!(period: run.period, kind: "unpaid", reason: "Synthetic confirmed unpaid", expected_digest: Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest"), idempotency_key: "unpaid")
  end

  def approve_current(key: "revision")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: run.current_revision&.digest, idempotency_key: key)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    revision
  end

  def prepare
    accepted_instruction(revision: approve_current)
  end

  def status(leg, transactions)
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("status" => "approved", "createdAt" => leg.provider_request_created_at.iso8601)))
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => transactions.size, "transactions" => transactions }))
    service.refresh!(actor: owner, instruction_id: leg.id)
  end

  def credited
    leg = prepare
    status(leg, [mercury_transaction("status" => "sent")])
    service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: Date.current.iso8601, reference: "SYNTHETIC-CREDIT")
    leg
  end

  it "requires a distinct explicit owner review after a reachable ambiguous hold clears, with exact replay protection" do
    leg = credited
    original = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(original.kind).to eq("settled")
    status(leg, [mercury_transaction("status" => "sent"), mercury_transaction("id" => "unrelated-adverse", "status" => "reversed")])
    review = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(review.kind).to eq("returned_review")
    expect { status(leg, [mercury_transaction("status" => "sent")]) }.to raise_error(Payroll::Workflow::Conflict, /review/)
    expect(leg.reload.held_reason).to be_nil
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_nil
    expect do
      Payroll::PtoRecovery.resolve_review!(review, actor: accounts, reason: "Synthetic owner review", expected_recovery_id: review.id)
    end.to raise_error(Payroll::Workflow::NotAuthorized)
    resolved = Payroll::PtoRecovery.resolve_review!(review, actor: owner, reason: "Synthetic owner confirmed original wire and credit", expected_recovery_id: review.id)
    expect(resolved.kind).to eq("settled")
    expect(resolved.actor_id).to eq(owner.id)
    expect do
      expect(Payroll::PtoRecovery.resolve_review!(review, actor: owner, reason: "Synthetic owner confirmed original wire and credit", expected_recovery_id: review.id).id).to eq(resolved.id)
    end.not_to change(PayrollPtoRecovery, :count)
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(leg.payroll_payment_events.where(kind: "credit_recorded").count).to eq(1)
  end

  it "preserves a confirmed reversal as a manual bank-reconciliation hold without another deduction or resend" do
    leg = credited
    status(leg, [mercury_transaction("status" => "reversed")])
    review = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    status(leg, [mercury_transaction("status" => "sent")])
    expect(leg.reload.transaction_status).to eq("reversed")
    expect do
      Payroll::PtoRecovery.resolve_review!(review, actor: owner, reason: "Synthetic attempted premature resolution", expected_recovery_id: review.id)
    end.to raise_error(Payroll::Workflow::Conflict, /confirmed/)
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).kind).to eq("returned_review")
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_nil
    expect(PayrollPaymentInstruction.where(payroll_run: run).count).to eq(1)
  end

  it "carries only a provably identical protected line and keeps settlement bound to its original reservation" do
    leg = prepare
    original = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    travel 1.minute
    newer = approve_current(key: "unchanged-protected-line")
    expect(newer.id).not_to eq(original.payroll_revision_id)
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).id).to eq(original.id)
    expect(PayrollPtoRecovery.where(payroll_run: run, kind: "reserved").count).to eq(1)
    status(leg, [mercury_transaction("status" => "sent")])
    service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: Date.current.iso8601, reference: "SYNTHETIC-PROTECTED-CREDIT")
    settled = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(settled.kind).to eq("settled")
    expect(settled.payroll_revision_id).to eq(original.payroll_revision_id)
    expect(PayrollPaymentInstruction.where(payroll_run: run).count).to eq(1)
  end

  it "does not use late credit for an older revision to settle a newer reservation" do
    terms = ConsultantCompensation.create!(employment:, created_by: owner, effective_on: run.period, monthly_fee: 100_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India funding")
    ledger.decide!(period: run.period, kind: "unpaid", reason: "Synthetic fresh funding source review",
      expected_digest: Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest"), idempotency_key: "india-source")
    older = approve_current(key: "older-before-known-bank-activity")
    newer = approve_current(key: "newer-after-safe-release")
    reservation = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(reservation.payroll_revision_id).to eq(newer.id)
    old_line = older.payroll_payload.fetch("lines").first
    report = Payroll::IndiaReport.new(run, employment:, line: old_line, terms:).call.merge("revision_digest" => older.digest,
      "accounts_email" => "synthetic-accounts@example.test")
    # Synthetic late-discovered historical bank evidence, not a new stale-head handoff request.
    handoff = PayrollIndiaHandoff.create!(company:, payroll_run: run, payroll_revision: older, employment:,
      consultant_compensation: terms, created_by: owner, report:, line_digest: Payroll::IndiaHandoff.line_digest(old_line),
      bank_digest: report.fetch("bank_digest"), entitlement_minor: old_line.dig("amounts", "net_minor"))
    handoff.payroll_india_deliveries.create!(attempt_number: 1, state: "sent", sent_at: Time.current)
    handoff.payroll_india_credits.create!(company:, actor: accounts, amount_minor: handoff.entitlement_minor,
      credited_on: Date.current, reference: "SYNTHETIC-OLD-CREDIT", reference_digest: Digest::SHA256.hexdigest("SYNTHETIC-OLD-CREDIT"))
    handoff.update!(credited_minor: handoff.entitlement_minor, fully_credited_at: Time.current)
    expect { Payroll::PtoRecovery.settle!(run, employment.id) }.to raise_error(Payroll::Workflow::Conflict, /reserved revision/)
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).id).to eq(reservation.id)
    expect(PayrollPtoRecovery.where(payroll_run: run, kind: "settled")).to be_empty
  end

  it "settles one carried reservation after an unchanged revision replaces only a missing spouse leg" do
    original_revision = approve_current
    split = Payroll::SplitArrangements.new(run)
    spouse_id = "66666666-6666-4666-8666-666666666666"
    details = { "bank_account_name" => "Synthetic Spouse", "bank_name" => "Synthetic Bank", "bank_country" => "IN", "bank_account_currency" => "INR",
      "bank_account_number" => "222233334444", "bank_ifsc" => "SPOU0000002", "bank_swift" => "SPOUINBBXXX" }
    arrangement = split.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
      details:, account_number_confirmation: details.fetch("bank_account_number"))
    split.verify!(actor: accounts, arrangement_id: arrangement.id)
    split.approve!(actor: owner, arrangement_id: arrangement.id)
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_id}").to_return(mercury_json(mercury_recipient("id" => spouse_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => details.fetch("bank_account_number"), "swiftCode" => details.fetch("bank_swift"),
        "countrySpecific" => { "india" => { "ifscCode" => details.fetch("bank_ifsc") } } })))
    payment = ready_payment
    linked_recipient(beneficiary: "spouse", id: spouse_id)
    first, missing = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: original_revision.digest, quote:)
    stub_mercury_write(mercury_json(mercury_request("amount" => first.principal_minor / 100.0)))
    payment.submit!(actor: owner, instruction_id: first.id, expected_digest: first.frozen_digest)
    payment.void!(actor: owner, instruction_id: missing.id)
    reservation = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    newer = approve_current(key: "unchanged-split-replacement")
    replacement = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: newer.digest, quote:).sole
    expect(replacement.beneficiary).to eq("spouse")
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).id).to eq(reservation.id)
    expect(replacement.payroll_payment_group.reload.payroll_revision_id).to eq(newer.id)
    sent_transactions = {}
    [first.reload, replacement].each_with_index do |leg, index|
      request = mercury_request("requestId" => index.zero? ? request_id : SecureRandom.uuid,
        "recipientId" => leg.mercury_recipient_id, "amount" => leg.principal_minor / 100.0)
      unless index.zero?
        stub_mercury_write(mercury_json(request))
        payment.submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      end
      stub_request(:get, "#{mercury_base}/request-send-money/#{leg.reload.provider_request_id}")
        .to_return(mercury_json(request.merge("status" => "approved", "createdAt" => leg.provider_request_created_at.iso8601)))
      transaction = mercury_transaction("id" => SecureRandom.uuid, "requestId" => leg.provider_request_id,
        "amount" => -leg.principal_minor / 100.0, "status" => "sent")
      sent_transactions[leg.id] = transaction
      stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
        .to_return(mercury_json({ "total" => 1, "transactions" => [transaction] }))
      service.refresh!(actor: owner, instruction_id: leg.id)
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: format("%.2f", leg.entitlement_minor / 100.0),
        credited_on: Date.current.iso8601, reference: "SYNTHETIC-SPLIT-CREDIT-#{index}")
    end
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).kind).to eq("settled")
    service.record_credit!(actor: accounts, instruction_id: replacement.id, amount: format("%.2f", replacement.entitlement_minor / 100.0),
      credited_on: Date.current.iso8601, reference: "SYNTHETIC-SPLIT-CREDIT-1")
    expect(PayrollPtoRecovery.where(payroll_run: run, kind: "settled").count).to eq(1)
    expect(PayrollPaymentInstruction.where(payroll_run: run).count).to eq(3)
    expect(a_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money")).to have_been_made.twice
    first_request = mercury_request("status" => "approved", "amount" => first.principal_minor / 100.0,
      "createdAt" => first.reload.provider_request_created_at.iso8601)
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(first_request))
    transaction = sent_transactions.fetch(first.id)
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 2, "transactions" => [transaction, mercury_transaction("id" => "unrelated-adverse", "status" => "reversed")] }))
    service.refresh!(actor: owner, instruction_id: first.id)
    review = PayrollPtoRecovery.heads.find_by!(payroll_run: run)
    expect(review.kind).to eq("returned_review")
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 1, "transactions" => [transaction] }))
    expect { service.refresh!(actor: owner, instruction_id: first.id) }.to raise_error(Payroll::Workflow::Conflict, /review/)
    Payroll::PtoRecovery.resolve_review!(review, actor: owner, reason: "Synthetic original split wire review", expected_recovery_id: review.id)
    expect(first.payroll_payment_group.reload.fully_credited_at).to be_present
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 1, "transactions" => [transaction.merge("status" => "reversed")] }))
    service.refresh!(actor: owner, instruction_id: first.id)
    expect(PayrollPtoRecovery.heads.find_by!(payroll_run: run).kind).to eq("returned_review")
    expect(first.payroll_payment_group.reload.fully_credited_at).to be_nil
  end
end
