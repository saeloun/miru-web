# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Billing identity retained history and fresh outbound sources" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "reviewed mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  let(:payment) { Payroll::MercuryPayment.new(run) }
  let(:spouse_recipient_id) { "66666666-6666-4666-8666-666666666666" }

  def accepted_split
    revision = approve_revision
    details = { "bank_account_name" => "Synthetic Spouse", "bank_name" => "Spouse Bank", "bank_country" => "IN", "bank_account_currency" => "INR",
      "bank_account_number" => "222233334444", "bank_ifsc" => "SPOU0000002", "bank_swift" => "SPOUINBBXXX" }
    split = Payroll::SplitArrangements.new(run)
    arrangement = split.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
      details:, account_number_confirmation: details.fetch("bank_account_number"))
    split.verify!(actor: accounts, arrangement_id: arrangement.id)
    split.approve!(actor: owner, arrangement_id: arrangement.id)
    verified_connection
    linked_recipient
    recipient = mercury_recipient("id" => spouse_recipient_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => "222233334444", "swiftCode" => "SPOUINBBXXX",
        "countrySpecific" => { "india" => { "ifscCode" => "SPOU0000002" } } })
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_recipient_id}").to_return(mercury_json(recipient))
    linked_recipient(beneficiary: "spouse", id: spouse_recipient_id)
    consultant, spouse = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
    stub_mercury_write(mercury_json(mercury_request("amount" => consultant.principal_minor / 100.0)))
    payment.submit!(actor: owner, instruction_id: consultant.id, expected_digest: consultant.frozen_digest)
    [consultant, spouse]
  end

  def change_work_source
    work_entry.update!(duration: work_entry.duration + 1)
    line = run.current_revision.payroll_payload.fetch("lines").sole
    expect(PayrollSources::MonthlyFacts.current_snapshot?(line.fetch("source_snapshot"), company:, employment:)).to be(false)
    expect(workflow.status).to eq("approved") # Accepted history remains available for reconciliation.
  end

  it "blocks the prepared spouse transfer when the accepted consultant protects stale history" do
    consultant, spouse = accepted_split
    change_work_source
    write = stub_mercury_write(mercury_json(mercury_request("recipientId" => spouse_recipient_id, "amount" => spouse.principal_minor / 100.0)))
      .with { |request| JSON.parse(request.body).fetch("recipientId") == spouse_recipient_id }

    expect do
      payment.submit!(actor: owner, instruction_id: spouse.id, expected_digest: spouse.frozen_digest)
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("source_missing_or_changed") }
    expect(write).not_to have_been_requested
    expect(spouse.reload.submission_state).to eq("prepared")
    expect(consultant.reload.submission_state).to eq("accepted")
  end

  it "blocks a replacement spouse preparation against the retained stale source" do
    consultant, spouse = accepted_split
    payment.void!(actor: owner, instruction_id: spouse.id)
    change_work_source

    expect do
      payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: run.current_revision.digest, quote:)
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("source_missing_or_changed") }
    expect(PayrollPaymentInstruction.count).to eq(2)
    expect(consultant.reload.submission_state).to eq("accepted")
  end

  context "when India transport has claimed a report" do
    it "refreshes bank evidence on each call of the same guard instance" do
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-01", monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India funding")
      record_synthetic_pto_treatment
      revision = approve_revision
      service = Payroll::IndiaHandoff.new(run)
      handoff = service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
      guard = Payroll::MercuryRevisionGuard.new(run)
      line = revision.payroll_payload.fetch("lines").sole
      expect(guard.protected_line?(line)).to be(false)
      expect(guard.retained_lines).to be_empty
      allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
        original.call(*args).tap do |mail|
          mail.message.delivery_method(:test)
          mail.message.perform_deliveries = true
          expect(guard.protected_line?(line)).to be(true)
        end
      end

      Payroll::IndiaDelivery.new(handoff.payroll_india_deliveries.sole).deliver

      expect(handoff.payroll_india_deliveries.sole.reload.state).to eq("sent")
      expect(guard.protected_line?(line)).to be(true)
      expect(guard.retained_lines).to eq([line])
    end

    it "rechecks the real work source after rendering and before sending" do
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-01", monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India funding")
      record_synthetic_pto_treatment
      revision = approve_revision
      handoff = Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
      delivery = handoff.payroll_india_deliveries.sole
      ActionMailer::Base.deliveries.clear
      allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
        original.call(*args).tap do |mail|
          mail.message.delivery_method(:test)
          mail.message.perform_deliveries = true
          expect(delivery.reload.state).to eq("sending")
          change_work_source
        end
      end

      Payroll::IndiaDelivery.new(delivery).deliver

      expect(delivery.reload.state).to eq("failed")
      expect(delivery.error_code).to eq("source_missing_or_changed")
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end
end
