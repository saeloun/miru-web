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
      service.record_credit!(actor: accounts, instruction_id: consultant_leg.id, amount: "46875.00", credited_on: Date.current.iso8601, reference: "UTR1")
      expect(group.reload.fully_credited_at).to be_nil
      service.record_credit!(actor: accounts, instruction_id: spouse_leg.id, amount: "15625.00", credited_on: Date.current.iso8601, reference: "UTR2")
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
end
