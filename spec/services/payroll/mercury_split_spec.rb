# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mercury spouse split payments" do
  include_context "approved mercury consultant payroll"

  let(:spouse_recipient_id) { "66666666-6666-4666-8666-666666666666" }
  let(:split_service) { Payroll::SplitArrangements.new(run) }
  let(:spouse_details) do
    { "bank_account_name" => "Synthetic Spouse", "bank_name" => "Spouse Bank", "bank_country" => "IN", "bank_account_number" => "222233334444",
      "bank_ifsc" => "SPOU0000002", "bank_swift" => "SPOUINBBXXX" }
  end
  let(:spouse_recipient) do
    mercury_recipient("id" => spouse_recipient_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => "222233334444", "swiftCode" => "SPOUINBBXXX",
                                          "countrySpecific" => { "india" => { "ifscCode" => "SPOU0000002" } } })
  end

  let!(:base_revision) { approve_revision }

  before do
    stub_mercury_reads
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_recipient_id}").to_return(mercury_json(spouse_recipient))
  end

  def approved_arrangement(kind: "percentage", value: "25", allocated_to: "spouse", remainder_to: "consultant")
    arrangement = split_service.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: kind, allocation_value: value, allocated_to:, remainder_to: },
      details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
    split_service.verify!(actor: accounts, arrangement_id: arrangement.id)
    split_service.approve!(actor: owner, arrangement_id: arrangement.id)
  end

  def prepared_legs(revision: base_revision)
    verified_connection
    linked_recipient
    linked_recipient(beneficiary: "spouse", id: spouse_recipient_id)
    Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
  end

  def submit(leg)
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
  end

  def blocked_codes
    yield
    []
  rescue Payroll::MercuryPayment::Blocked => error
    error.codes
  end

  describe "arrangement approval" do
    it "requires the account number twice" do
      expect(blocked_codes do
        split_service.request!(actor: accounts, employment_id: employment.id,
          attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
          details: spouse_details, account_number_confirmation: "000")
      end).to eq(["account_number_mismatch"])
    end

    it "requires verification, then approval by someone else" do
      arrangement = split_service.request!(actor: accounts, employment_id: employment.id,
        attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
        details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
      expect(blocked_codes { split_service.approve!(actor: owner, arrangement_id: arrangement.id) }).to eq(["split_not_verified"])
      expect { split_service.verify!(actor: owner, arrangement_id: arrangement.id) }.to raise_error(Payroll::Workflow::NotAuthorized)
    end

    it "does not let an accounts reviewer approve" do
      arrangement = split_service.request!(actor: accounts, employment_id: employment.id,
        attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
        details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
      split_service.verify!(actor: accounts, arrangement_id: arrangement.id)
      expect { split_service.approve!(actor: accounts, arrangement_id: arrangement.id) }.to raise_error(Payroll::Workflow::NotAuthorized)
    end

    it "encrypts spouse details and redacts them from inspect and audits" do
      arrangement = approved_arrangement
      raw = PayrollSplitArrangement.connection.select_value("SELECT details FROM payroll_split_arrangements WHERE id = #{arrangement.id}")
      expect(raw).not_to include("222233334444")
      expect(arrangement.inspect).not_to include("222233334444")
      expect(Audited::Audit.where(auditable: arrangement).to_json).not_to include("222233334444")
    end

    it "blocks an unapproved arrangement without silently paying only the consultant" do
      split_service.request!(actor: accounts, employment_id: employment.id,
        attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
        details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
      revision = base_revision
      verified_connection
      linked_recipient
      expect(blocked_codes do
        Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("split_pending_approval")
    end
  end

  describe "allocation" do
    def allocate(line_amounts, **options)
      arrangement = approved_arrangement(**options)
      Payroll::ConsultantAllocation.call(line: { "amounts" => line_amounts }, arrangement:).to_h { |result| [result.beneficiary, result.amount_minor] }
    end

    it "splits a percentage of fee after adjustments and keeps reimbursements with the consultant" do
      result = allocate({ "net_minor" => 7_250_000, "reimbursements_minor" => 1_000_000 }, value: "25")
      expect(result).to eq("consultant" => 5_687_500, "spouse" => 1_562_500)
    end

    it "reconciles INR rounding exactly" do
      result = allocate({ "net_minor" => 100_001, "reimbursements_minor" => 0 }, value: "33.33")
      expect(result.values.sum).to eq(100_001)
    end

    it "honours a fixed INR allocation with an explicit remainder party" do
      result = allocate({ "net_minor" => 6_250_000, "reimbursements_minor" => 0 }, kind: "fixed_inr", value: "20000", allocated_to: "consultant", remainder_to: "spouse")
      expect(result).to eq("consultant" => 2_000_000, "spouse" => 4_250_000)
    end

    it "blocks a fixed allocation above the split base" do
      expect do
        allocate({ "net_minor" => 100_000, "reimbursements_minor" => 0 }, kind: "fixed_inr", value: "2000")
      end.to raise_error(Payroll::MercuryPayment::Blocked)
    end

    it "blocks an allocation that empties a transfer" do
      expect do
        allocate({ "net_minor" => 100_000, "reimbursements_minor" => 0 }, kind: "fixed_inr", value: "1000")
      end.to raise_error(Payroll::MercuryPayment::Blocked)
    end

    it "requires an explicit different remainder party" do
      expect do
        approved_arrangement(allocated_to: "spouse", remainder_to: "spouse")
      end.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "legs" do
    before { approved_arrangement }

    it "creates independent legs on one quote with separate fees and keys" do
      legs = prepared_legs
      expect(legs.map(&:beneficiary)).to eq(%w[consultant spouse])
      expect(legs.map(&:entitlement_minor)).to eq([4_687_500, 1_562_500])
      expect(legs.map(&:buffered_rate).uniq).to eq([BigDecimal("84")])
      expect(legs.map(&:principal_minor)).to eq([55_804, 18_601])
      expect(legs.map(&:fee_minor)).to eq([1_500, 1_500])
      expect(legs.map(&:company_debit_minor)).to eq([57_304, 20_101])
      expect(legs.map(&:idempotency_key).uniq.size).to eq(2)
    end

    it "keeps the consultant as the purpose identity on the spouse leg" do
      spouse = prepared_legs.last
      expect(spouse.mercury_recipient_id).to eq(spouse_recipient_id)
      expect(spouse.purpose_info).to eq("Synthetic Consultant")
    end

    it "retries only the failed leg and never resends the successful one" do
      revision = base_revision
      consultant_leg, spouse_leg = prepared_legs(revision:)
      stub_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money").to_return(mercury_json(mercury_request("amount" => 558.04)))
      submit(consultant_leg)
      spouse_id = "77777777-7777-4777-8777-777777777777"
      stub_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money")
        .to_return(mercury_json(mercury_request("requestId" => spouse_id, "recipientId" => spouse_recipient_id, "amount" => 186.01)))
      submit(spouse_leg)
      stub_request(:get, "#{mercury_base}/request-send-money/#{spouse_id}")
        .to_return(mercury_json(mercury_request("requestId" => spouse_id, "recipientId" => spouse_recipient_id, "amount" => 186.01, "status" => "rejected")))
      stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions}).to_return(mercury_json({ "total" => 0, "transactions" => [] }))
      Payroll::MercuryReconciliation.new(run).refresh!(actor: owner, instruction_id: spouse_leg.id)
      replacement = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      expect(replacement.map(&:beneficiary)).to eq(["spouse"])
      expect(replacement.first.idempotency_key).not_to eq(spouse_leg.idempotency_key)
      expect(consultant_leg.reload.released_at).to be_nil
      expect(consultant_leg.reload.idempotency_key).to eq(consultant_leg.idempotency_key)
      expect(PayrollPaymentInstruction.open_slot.where(beneficiary: "consultant").count).to eq(1)
    end

    it "requires every leg credited before the group is fully credited" do
      revision = base_revision
      consultant_leg, spouse_leg = prepared_legs(revision:)
      group = consultant_leg.payroll_payment_group
      service = Payroll::MercuryReconciliation.new(run)
      PayrollPaymentInstruction.where(id: [consultant_leg.id, spouse_leg.id]).find_each do |leg|
        leg.update!(submission_state: "accepted", request_status: "approved", provider_request_created_at: Time.current,
          provider_request_id: SecureRandom.uuid, transaction_status: "sent", transaction_link_state: "linked")
      end
      service.record_credit!(actor: accounts, instruction_id: consultant_leg.id, amount: "46875.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      expect(group.reload.fully_credited_at).to be_nil
      service.record_credit!(actor: accounts, instruction_id: spouse_leg.id, amount: "15625.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR2")
      expect(group.reload.fully_credited_at).to be_present
    end

    it "invalidates unsent legs when the arrangement changes" do
      revision = base_revision
      leg = prepared_legs(revision:).first
      split_service.request!(actor: accounts, employment_id: employment.id,
        attributes: { allocation_kind: "percentage", allocation_value: "30", allocated_to: "spouse", remainder_to: "consultant" },
        details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
      expect(blocked_codes { submit(leg) }).to include("split_changed")
    end

    it "blocks when the spouse bank details differ from the Mercury recipient" do
      verified_connection
      changed = spouse_recipient
      changed["internationalWireRoutingInfo"]["iban"] = "000000000000"
      stub_request(:get, "#{mercury_base}/recipient/#{spouse_recipient_id}").to_return(mercury_json(changed))
      expect(blocked_codes { linked_recipient(beneficiary: "spouse", id: spouse_recipient_id) }).to eq(["recipient_account_mismatch"])
    end
  end

  describe "reimbursement reservations across split legs" do
    around do |example|
      travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
    end

    let(:receipt) { "description,amount,currency\nSynthetic travel,5000,INR\n" }
    let(:claim) do
      create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved, approved_at: 1.minute.ago).tap do |expense|
        expense.receipts.attach(io: StringIO.new(receipt), filename: "synthetic-receipt.csv", content_type: "text/csv")
      end
    end
    let!(:base_revision) do
      company.update!(timezone: "Asia/Kolkata")
      employment.update!(joined_at: Date.new(2020, 1, 1))
      revision = revise_with_claims([claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      revision
    end

    def revise_with_claims(ids)
      Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, expense_ids: ids, acknowledged: true }], cutoff: Date.current.iso8601,
        expected_digest: run.current_revision&.digest, idempotency_key: SecureRandom.uuid)
    end

    it "pays a claim once only after both split credits and preserves its receipt and INR allocation" do
      receipt_id = claim.receipts.sole.blob_id
      approved_arrangement
      legs = prepared_legs
      expect(legs.map(&:entitlement_minor)).to eq([5_187_500, 1_562_500])
      expect(legs.map(&:principal_minor)).to eq([61_756, 18_601])
      expect(legs.map(&:fee_minor)).to eq([1_500, 1_500])
      expect(legs.map(&:company_debit_minor)).to eq([63_256, 20_101])
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim, payroll_revision: base_revision)
      group = legs.first.payroll_payment_group
      expect(legs.map(&:payroll_payment_group_id).uniq).to eq([group.id])
      expect(group.entitlement_minor).to eq(6_750_000)
      requests = [mercury_request("amount" => legs.first.principal_minor / 100.0),
                  mercury_request("requestId" => "77777777-7777-4777-8777-777777777777", "recipientId" => spouse_recipient_id, "amount" => legs.last.principal_minor / 100.0)]
      transactions = legs.zip(requests).map do |leg, request|
        stub_mercury_write(mercury_json(request))
        submit(leg)
        stub_request(:get, "#{mercury_base}/request-send-money/#{request.fetch('requestId')}").to_return(mercury_json(request.merge("status" => "approved")))
        mercury_transaction("id" => SecureRandom.uuid, "requestId" => request.fetch("requestId"), "amount" => -leg.principal_minor / 100.0, "status" => "sent")
      end
      stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
        .to_return(mercury_json({ "total" => transactions.size, "transactions" => transactions }))
      service = Payroll::MercuryReconciliation.new(run)
      credits = legs.zip(["51875.00", "15625.00"]).map do |leg, amount|
        expect(service.refresh!(actor: owner, instruction_id: leg.id)).to have_attributes(transaction_status: "sent", submission_state: "accepted")
        { actor: accounts, instruction_id: leg.id, amount:, credited_on: Date.current.iso8601, reference: "Synthetic split #{leg.beneficiary}" }
      end
      service.record_credit!(**credits.first)
      expect(legs.first.reload).to have_attributes(credit_state: "credited", credited_minor: 5_187_500, entitlement_currency: "INR")
      expect(legs.last.reload).to have_attributes(credit_state: "none", credited_minor: 0)
      expect(group.reload.fully_credited_at).to be_nil
      expect(reservation.reload.settled_at).to be_nil
      expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)

      service.record_credit!(**credits.last)
      expect(claim.reload).to have_attributes(status: "paid", amount: 5_000, currency: "INR", user_id: worker.id)
      expect(reservation.reload).to have_attributes(amount_minor: 500_000, released_at: nil)
      expect(reservation.settled_at).to be_present
      expect(claim.paid_at).to be_present
      expect(group.reload.fully_credited_at).to be_present
      settled_at, paid_at, fully_credited_at = reservation.settled_at, claim.paid_at, group.fully_credited_at

      travel 5.minutes
      credits.each { |credit| service.record_credit!(**credit) }
      legs.each { |leg| service.refresh!(actor: owner, instruction_id: leg.id) }
      expect(reservation.reload.settled_at).to eq(settled_at)
      expect(claim.reload.paid_at).to eq(paid_at)
      expect(group.reload.fully_credited_at).to eq(fully_credited_at)
      expect(claim.receipts.sole.blob_id).to eq(receipt_id)
      expect(claim.receipts.sole.download).to eq(receipt)
      expect(PayrollPaymentEvent.where(payroll_payment_instruction_id: legs.map(&:id), kind: "group_fully_credited").count).to eq(1)
      expect(PayrollPaymentEvent.where(payroll_payment_instruction_id: legs.map(&:id), kind: "group_credit_reopened")).to be_empty
      legs.each do |leg|
        expect(leg.reload).to have_attributes(credit_state: "credited", credited_minor: leg.entitlement_minor, entitlement_currency: "INR")
        expect(leg.payroll_payment_events.where(kind: "credit_recorded").sole.data).to include("currency" => "INR", "amount_minor" => leg.entitlement_minor)
      end
      expect(a_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money")).to have_been_made.twice
    end

    it "keeps the claim reserved until both split requests are proven cancelled" do
      approved_arrangement
      consultant_leg, spouse_leg = prepared_legs
      spouse_request_id = "77777777-7777-4777-8777-777777777777"
      requests = [mercury_request("amount" => consultant_leg.principal_minor / 100.0),
                  mercury_request("requestId" => spouse_request_id, "recipientId" => spouse_recipient_id, "amount" => spouse_leg.principal_minor / 100.0)]
      [consultant_leg, spouse_leg].zip(requests).each do |leg, request|
        stub_mercury_write(mercury_json(request))
        submit(leg)
      end
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim, payroll_revision: base_revision)
      service = Payroll::MercuryReconciliation.new(run)
      stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
        .to_return(mercury_json({ "total" => 0, "transactions" => [] }))
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}")
        .to_return(mercury_json(requests.first.merge("status" => "cancelled")))
      service.refresh!(actor: owner, instruction_id: consultant_leg.id)

      expect(consultant_leg.reload.released_at).to be_present
      expect(spouse_leg.reload.released_at).to be_nil
      expect(consultant_leg.payroll_payment_group.in_flight_legs.pluck(:id)).to eq([spouse_leg.id])
      expect { revise_with_claims([]) }.to raise_error(Payroll::Workflow::Conflict, /A bank transfer exists/)
      expect(run.reload.current_revision.id).to eq(base_revision.id)
      expect(reservation.reload.released_at).to be_nil

      stub_request(:get, "#{mercury_base}/request-send-money/#{spouse_request_id}")
        .to_return(mercury_json(requests.last.merge("status" => "cancelled")))
      service.refresh!(actor: owner, instruction_id: spouse_leg.id)
      expect(spouse_leg.reload.released_at).to be_present
      expect(consultant_leg.payroll_payment_group.in_flight_legs).to be_empty
      replacement = revise_with_claims([])
      expect(run.current_revision.id).to eq(replacement.id)
      expect(reservation.reload.released_at).to be_present
      expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
      expect(claim).not_to be_payroll_reserved
      expect(a_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money")).to have_been_made.twice
    end
  end
end
