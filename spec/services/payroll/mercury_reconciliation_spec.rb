# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::MercuryReconciliation do
  include_context "approved mercury consultant payroll"

  let(:service) { described_class.new(run) }
  let(:write_url) { "#{mercury_base}/account/#{account_id}/request-send-money" }
  let(:transactions_url) { %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions} }

  def stub_status(request: mercury_request("status" => "approved"), transactions: [], total: nil)
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(request))
    stub_request(:get, transactions_url).to_return(mercury_json({ "total" => total || transactions.size, "transactions" => transactions }))
  end

  def refresh(leg)
    service.refresh!(actor: owner, instruction_id: leg.id)
  end

  def uncertain_instruction
    instruction = prepared_instruction
    stub_mercury_reads
    stub_request(:post, write_url).to_timeout
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
  end

  def blocked_codes
    yield
    []
  rescue Payroll::MercuryPayment::Blocked => error
    error.codes
  end

  describe "request and transaction lifecycle" do
    it "keeps approval separate from sent and credited" do
      leg = accepted_instruction
      stub_status
      refreshed = refresh(leg)
      expect(refreshed.request_status).to eq("approved")
      expect(refreshed.display_state).to eq("bank_approved_awaiting_transaction")
      expect(refreshed.credit_state).to eq("none")

      stub_status(transactions: [mercury_transaction])
      expect(refresh(leg).display_state).to eq("processing")

      stub_status(transactions: [mercury_transaction("status" => "sent")])
      sent = refresh(leg)
      expect(sent.display_state).to eq("sent_awaiting_credit")
      expect(sent.credit_state).to eq("none")
      expect(sent.credited_minor).to eq(0)
    end

    it "does not look up transactions while approval is pending" do
      leg = accepted_instruction
      stub_status(request: mercury_request)
      refresh(leg)
      expect(a_request(:get, transactions_url)).not_to have_been_made
    end

    %w[rejected cancelled].each do |status|
      it "records a bank #{status} request and releases the slot" do
        leg = accepted_instruction
        stub_status(request: mercury_request("status" => status))
        refreshed = refresh(leg)
        expect(refreshed.display_state).to eq("bank_#{status}")
        expect(refreshed.released_at).to be_present
      end
    end

    %w[failed cancelled].each do |status|
      it "releases only after an authoritative #{status} transaction" do
        leg = accepted_instruction
        stub_status(transactions: [mercury_transaction("status" => status, "reasonForFailure" => "Synthetic failure")])
        refreshed = refresh(leg)
        expect(refreshed.display_state).to eq("transaction_#{status}")
        expect(refreshed.released_at).to be_present
      end
    end

    %w[reversed blocked].each do |status|
      it "holds the slot for a #{status} transaction" do
        leg = accepted_instruction
        stub_status(transactions: [mercury_transaction("status" => status)])
        expect(refresh(leg).released_at).to be_nil
      end
    end

    it "flags a response that disagrees with the frozen request" do
      leg = accepted_instruction
      stub_status(request: mercury_request("amount" => 1.00))
      refreshed = refresh(leg)
      expect(refreshed.display_state).to eq("reconciliation_required")
      expect(refreshed.last_error_code).to eq("request_mismatch")
    end
  end

  describe "transaction linkage" do
    [
      ["a returned or incoming payment of the same magnitude", { "amount" => 744.05, "kind" => "incomingDomesticWire" }],
      ["a positive outgoing amount", { "amount" => 744.05 }],
      ["an unknown kind", { "kind" => "other" }],
      ["a different account", { "accountId" => "99999999-9999-4999-8999-999999999999" }],
      ["a different principal", { "amount" => -744.06 }]
    ].each do |name, change|
      it "does not link #{name}" do
        leg = accepted_instruction
        stub_status(transactions: [mercury_transaction(change)])
        refreshed = refresh(leg)
        expect(refreshed.provider_transaction_id).to be_nil
        expect(refreshed.transaction_link_state).to eq("reconciliation_required")
      end
    end

    it "ignores transactions with a different request ID" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction("requestId" => "99999999-9999-4999-8999-999999999999")])
      refreshed = refresh(leg)
      expect(refreshed.provider_transaction_id).to be_nil
      expect(refreshed.transaction_link_state).to eq("none")
    end

    it "ignores the wire fee but does not count it as the wire" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction("id" => "fee", "kind" => "wireFee", "amount" => -15.00), mercury_transaction])
      expect(refresh(leg).provider_transaction_id).to eq("55555555-5555-4555-8555-555555555555")
    end

    it "does not guess among two candidates" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction, mercury_transaction("id" => "other")])
      expect(refresh(leg).last_error_code).to eq("multiple_transactions")
    end

    it "flags a truncated list" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction], total: 51)
      expect(refresh(leg).last_error_code).to eq("transaction_list_incomplete")
    end

    it "does not replace an already linked transaction" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction])
      refresh(leg)
      stub_status(transactions: [mercury_transaction("id" => "other")])
      refreshed = refresh(leg)
      expect(refreshed.provider_transaction_id).to eq("55555555-5555-4555-8555-555555555555")
      expect(refreshed.last_error_code).to eq("transaction_mismatch")
    end

    it "flags no transaction only after the waiting period" do
      leg = accepted_instruction
      stub_status
      refresh(leg)
      expect(leg.reload.transaction_link_state).to eq("none")
      travel_to(4.days.from_now) do
        stub_status
        expect(refresh(leg).last_error_code).to eq("transaction_not_found")
      end
    end
  end

  describe "uncertain submission recovery" do
    let!(:leg) { uncertain_instruction }

    def stub_listing(requests, next_page: nil)
      stub_request(:get, %r{#{Regexp.escape(mercury_base)}/request-send-money\?})
        .to_return(mercury_json({ "requests" => requests, "page" => { "nextPage" => next_page, "previousPage" => nil } }))
    end

    it "does not unlock anything from an empty complete list, however long it has been" do
      stub_listing([])
      travel_to(30.days.from_now) do
        result = service.reconcile!(actor: owner, instruction_id: leg.id)
        expect(result[:outcome]).to eq("none_found")
        fresh = leg.reload
        expect(fresh.submission_state).to eq("uncertain")
        expect(fresh.retry_unlocked?).to be(false)
        expect(fresh.released_at).to be_nil
      end
      expect(a_request(:post, write_url)).to have_been_made.once
    end

    it "links automatically only on an exact key echoed in memo" do
      stub_listing([mercury_request("memo" => leg.idempotency_key)])
      result = service.reconcile!(actor: owner, instruction_id: leg.id)
      expect(result[:outcome]).to eq("linked")
      expect(leg.reload.submission_state).to eq("accepted")
    end

    it "only shows same-amount candidates and never links them by itself" do
      stub_listing([mercury_request])
      result = service.reconcile!(actor: owner, instruction_id: leg.id)
      expect(result[:outcome]).to eq("candidates")
      expect(result[:candidates].first[:request_id]).to eq(request_id)
      expect(leg.reload.submission_state).to eq("uncertain")
    end

    it "lets the owner confirm a candidate, which is re-read and strictly compared" do
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("amount" => 2.00)))
      expect(blocked_codes { service.confirm_request!(actor: owner, instruction_id: leg.id, request_id:) }).to eq(["request_does_not_match"])
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request))
      service.confirm_request!(actor: owner, instruction_id: leg.id, request_id:)
      expect(leg.reload.provider_request_id).to eq(request_id)
      expect(leg.payroll_payment_events.pluck(:kind)).to include("request_linked_by_owner")
    end

    it "does not link a request created before this attempt" do
      old = mercury_request("createdAt" => 1.day.ago.utc.iso8601)
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(old))
      expect(blocked_codes { service.confirm_request!(actor: owner, instruction_id: leg.id, request_id:) }).to eq(["request_does_not_match"])
    end

    it "requires an accounts attestation with evidence before any retry" do
      stub_listing([])
      expect { service.attest_absence!(actor: owner, instruction_id: leg.id, evidence_reference: "Support case 1") }
        .to raise_error(Payroll::Workflow::NotAuthorized)
      expect(blocked_codes { service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "") }).to eq(["absence_evidence_required"])
      attested = service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Mercury support case 123")
      expect(attested.retry_unlocked?).to be(true)
      expect(attested.absent_confirmed_by).to eq(accounts)
      expect(attested.payroll_payment_events.find_by(kind: "absence_attested").data["evidence_reference"]).to eq("Mercury support case 123")
    end

    it "retries with the same key after attestation, by someone else" do
      stub_listing([])
      key = leg.idempotency_key
      service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Mercury support case 123")
      stub_mercury_reads
      keys = []
      stub_request(:post, write_url).with { |request| keys << JSON.parse(request.body)["idempotencyKey"] }.to_return(mercury_json(mercury_request))
      result = Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      expect(result.submission_state).to eq("accepted")
      expect(keys.uniq).to eq([key])
    end

    it "refuses attestation when a request ID is already known" do
      PayrollPaymentInstruction.where(id: leg.id).update_all(provider_request_id: request_id)
      expect(blocked_codes { service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1") }).to eq(["request_id_known"])
    end

    it "does not reconcile a submission still in flight" do
      fresh = PayrollPaymentInstruction.find(leg.id)
      fresh.update!(submission_state: "submitting", submission_started_at: Time.current)
      expect(blocked_codes { service.reconcile!(actor: owner, instruction_id: leg.id) }).to eq(["submission_in_progress"])
    end
  end

  describe "credit reconciliation" do
    let!(:leg) do
      accepted = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(accepted)
    end

    def credit(amount: "62500.00", reference: "UTR123", actor: accounts)
      service.record_credit!(actor:, instruction_id: leg.id, amount:, credited_on: Date.current.iso8601, reference:)
    end

    it "marks the entitlement credited only from a recorded credit" do
      expect(credit.credit_state).to eq("credited")
      expect(leg.reload.display_state).to eq("credited")
      expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    end

    it "keeps an INR credit above the entitlement as credited with its actual amount" do
      expect(credit(amount: "63000.00").credited_minor).to eq(6_300_000)
      expect(leg.reload.credit_state).to eq("credited")
    end

    it "keeps a shortfall partial until accounts resolves it, without changing the entitlement" do
      partial = credit(amount: "62000.00")
      expect(partial.display_state).to eq("partially_credited")
      expect(partial.shortfall_minor).to eq(50_000)
      expect(partial.payroll_payment_group.reload.fully_credited_at).to be_nil
      expect(blocked_codes { service.resolve_shortfall!(actor: accounts, instruction_id: leg.id, reason: " ") }).to eq(["shortfall_reason_required"])
      resolved = service.resolve_shortfall!(actor: accounts, instruction_id: leg.id, reason: "Receiving bank fee accepted")
      expect(resolved.display_state).to eq("credited_shortfall_resolved")
      expect(resolved.entitlement_minor).to eq(6_250_000)
      expect(resolved.payroll_payment_group.reload.fully_credited_at).to be_present
    end

    it "deduplicates a repeated credit entry" do
      credit(amount: "1000.00")
      expect(credit(amount: "1000.00").credited_minor).to eq(100_000)
    end

    ["-1", "1.234", "abc", "0", ""].each do |amount|
      it "rejects the credit amount #{amount.inspect}" do
        expect(blocked_codes { credit(amount:) }).to eq(["credit_amount_invalid"])
      end
    end

    it "rejects a future credit date" do
      expect(blocked_codes do
        service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "1.00", credited_on: 2.days.from_now.to_date.iso8601, reference: "UTR")
      end).to eq(["credit_date_invalid"])
    end

    it "refuses unrelated staff" do
      other = create(:user, current_workspace: company)
      create(:employment, company:, user: other, resigned_at: nil)
      other.add_role(:book_keeper, company)
      expect { credit(actor: other) }.to raise_error(Payroll::Workflow::NotAuthorized)
    end

    it "reopens the group on a late return and keeps the credit history" do
      credit
      stub_status(transactions: [mercury_transaction("status" => "reversed")])
      refreshed = refresh(leg)
      expect(refreshed.display_state).to eq("returned")
      expect(refreshed.credited_minor).to eq(6_250_000)
      expect(refreshed.payroll_payment_group.reload.fully_credited_at).to be_nil
      expect(refreshed.payroll_payment_events.pluck(:kind)).to include("credit_recorded", "group_credit_reopened")
    end

    it "does not allow credit before the wire is sent" do
      other = PayrollPaymentInstruction.find(leg.id)
      other.update!(transaction_status: "pending")
      expect(blocked_codes { credit }).to eq(["credit_not_recordable"])
    end

    it "allows manual proof when reconciliation is required" do
      other = PayrollPaymentInstruction.find(leg.id)
      other.update!(transaction_status: nil, transaction_link_state: "reconciliation_required", provider_transaction_id: nil, request_status: "approved")
      expect(credit.credit_state).to eq("credited")
    end
  end
end
