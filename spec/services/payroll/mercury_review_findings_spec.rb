# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mercury payroll review findings" do
  include_context "approved mercury consultant payroll"

  let(:payment) { Payroll::MercuryPayment.new(run) }
  let(:service) { Payroll::MercuryReconciliation.new(run) }
  let(:write_url) { "#{mercury_base}/account/#{account_id}/request-send-money" }
  let(:transactions_url) { %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions} }
  let(:spouse_recipient_id) { "66666666-6666-4666-8666-666666666666" }
  let(:split_service) { Payroll::SplitArrangements.new(run) }
  let(:spouse_details) do
    { "bank_account_name" => "Synthetic Spouse", "bank_name" => "Spouse Bank", "bank_country" => "IN", "bank_account_number" => "222233334444",
      "bank_ifsc" => "SPOU0000002", "bank_swift" => "SPOUINBBXXX" }
  end

  def blocked_codes
    yield
    []
  rescue Payroll::MercuryPayment::Blocked => error
    error.codes
  end

  def stub_status(request: mercury_request("status" => "approved"), transactions: [])
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(request))
    stub_request(:get, transactions_url).to_return(mercury_json({ "total" => transactions.size, "transactions" => transactions }))
  end

  def stub_listing(requests)
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/request-send-money\?})
      .to_return(mercury_json({ "requests" => requests, "page" => { "nextPage" => nil, "previousPage" => nil } }))
  end

  def refresh(leg)
    service.refresh!(actor: owner, instruction_id: leg.id)
  end

  def uncertain_instruction
    instruction = prepared_instruction
    stub_mercury_reads
    stub_request(:post, write_url).to_timeout
    payment.submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
  end

  def request_split(value: "50")
    split_service.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: "percentage", allocation_value: value, allocated_to: "spouse", remainder_to: "consultant" },
      details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
  end

  def approved_split(value: "50")
    arrangement = request_split(value:)
    split_service.verify!(actor: accounts, arrangement_id: arrangement.id)
    split_service.approve!(actor: owner, arrangement_id: arrangement.id)
  end

  def link_spouse
    recipient = mercury_recipient("id" => spouse_recipient_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => "222233334444", "swiftCode" => "SPOUINBBXXX",
                                          "countrySpecific" => { "india" => { "ifscCode" => "SPOU0000002" } } })
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_recipient_id}").to_return(mercury_json(recipient))
    linked_recipient(beneficiary: "spouse", id: spouse_recipient_id)
  end

  describe "finding 1: terms corrected after approval" do
    it "returns the run to draft when the fee changes for the approved month" do
      revision = approve_revision
      expect(workflow.status).to eq("approved")
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 50_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Correction")
      expect(workflow.status).to eq("draft")
      expect(revision.approval_issues).to include("terms_changed")
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("run_not_approved")
    end

    it "does not disturb an approved month when terms start later" do
      approve_revision
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 12, 1), monthly_fee: 50_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Next month")
      expect(workflow.status).to eq("approved")
    end
  end

  describe "finding 2: stale prepared leg after a split change" do
    it "refuses to create legs that would exceed the entitlement" do
      revision = approve_revision
      approved_split(value: "50")
      verified_connection
      linked_recipient
      link_spouse
      legs = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      payment.void!(actor: owner, instruction_id: legs.last.id)
      split_service.withdraw!(actor: owner, arrangement_id: PayrollSplitArrangement.current_for(employment).id)
      approved_split(value: "80")
      link_spouse
      expect(blocked_codes do
        Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to eq(["void_stale_transfer_first"])
      expect(legs.first.reload.payroll_payment_group.split_arrangement_id).not_to eq(PayrollSplitArrangement.current_for(employment).id)
    end

    it "blocks submitting a leg whose allocation no longer matches" do
      revision = approve_revision
      approved_split(value: "50")
      verified_connection
      linked_recipient
      link_spouse
      leg = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      group = leg.payroll_payment_group
      split_service.withdraw!(actor: owner, arrangement_id: PayrollSplitArrangement.current_for(employment).id)
      group.update!(split_arrangement: nil)
      stub_mercury_reads
      stub = stub_mercury_write
      expect(blocked_codes { Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest) })
        .to include("allocation_changed")
      expect(stub).not_to have_been_requested
    end
  end

  describe "finding 3: recovery after attestation" do
    let!(:leg) { uncertain_instruction }

    before { stub_listing([]) }

    it "does not let the attester void their own attestation" do
      accounts.add_role(:owner, company)
      service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1")
      expect(blocked_codes { payment.void!(actor: accounts, instruction_id: leg.id) }).to eq(["attester_cannot_retry"])
    end

    it "refuses attestation while a candidate is listed" do
      stub_listing([mercury_request])
      expect(blocked_codes { service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1") }).to eq(["candidates_must_be_resolved"])
      expect(leg.reload.retry_unlocked?).to be(false)
    end

    it "refuses retry or void if a candidate appears after attestation" do
      service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1")
      stub_listing([mercury_request])
      stub_mercury_reads
      stub_mercury_write
      expect(blocked_codes { payment.submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest) }).to eq(["candidates_must_be_resolved"])
      expect(blocked_codes { payment.void!(actor: owner, instruction_id: leg.id) }).to eq(["candidates_must_be_resolved"])
      expect(a_request(:post, write_url)).to have_been_made.once
    end
  end

  describe "finding 4: release needs proof that no money moved" do
    it "does not release when a sent wire later fails" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(leg)
      stub_status(transactions: [mercury_transaction("status" => "failed")])
      refreshed = refresh(leg)
      expect(refreshed.released_at).to be_nil
      expect(refreshed.transaction_link_state).to eq("reconciliation_required")
    end

    it "does not release when an approved request is later cancelled" do
      leg = accepted_instruction
      stub_status
      refresh(leg)
      stub_status(request: mercury_request("status" => "cancelled"))
      refreshed = refresh(leg)
      expect(refreshed.released_at).to be_nil
      expect(refreshed.last_error_code).to eq("cancelled_after_approval")
    end

    it "reads transactions before releasing a terminal request" do
      leg = accepted_instruction
      stub_status(request: mercury_request("status" => "cancelled"), transactions: [mercury_transaction("status" => "pending")])
      refreshed = refresh(leg)
      expect(refreshed.released_at).to be_nil
    end

    it "does not release a terminal request when transactions cannot be read" do
      leg = accepted_instruction
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("status" => "rejected")))
      stub_request(:get, transactions_url).to_return(status: 503)
      expect(blocked_codes { refresh(leg) }).to eq(["provider_status_unavailable"])
      expect(leg.reload.released_at).to be_nil
    end
  end

  describe "finding 5: reconciliation does not bypass transaction state" do
    def credit(leg)
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
    end

    %w[failed reversed].each do |status|
      it "stores an unlinkable #{status} status and bars credit" do
        leg = accepted_instruction
        stub_status(transactions: [mercury_transaction("status" => status, "kind" => "other")])
        refreshed = refresh(leg)
        expect(refreshed.transaction_status).to eq(status)
        expect(refreshed.provider_transaction_id).to be_nil
        expect(blocked_codes { credit(leg) }).to eq(["credit_not_recordable"])
      end
    end

    it "bars credit on a request mismatch before approval" do
      leg = accepted_instruction
      stub_status(request: mercury_request("amount" => 1.00))
      refresh(leg)
      expect(blocked_codes { credit(leg) }).to eq(["credit_not_recordable"])
    end

    it "bars credit on a released leg" do
      leg = accepted_instruction
      stub_status(request: mercury_request("status" => "rejected"))
      refresh(leg)
      expect(blocked_codes { credit(leg) }).to eq(["credit_not_recordable"])
    end

    it "says a manual-proof credit still lacks a Mercury link" do
      leg = accepted_instruction
      stub_status(transactions: [mercury_transaction("kind" => "other", "status" => "sent")])
      refresh(leg)
      expect(credit(leg).display_state).to eq("credited_unlinked")
    end
  end

  describe "finding 6: scan window and foreign keys" do
    it "still finds the original request after a later attempt" do
      leg = uncertain_instruction
      original = mercury_request("createdAt" => 1.minute.ago.utc.iso8601, "memo" => leg.idempotency_key)
      travel_to(3.days.from_now) do
        stub_listing([])
        stub_mercury_reads
        PayrollPaymentInstruction.where(id: leg.id).update_all(submission_started_at: Time.current)
        stub_listing([original])
        expect(service.reconcile!(actor: owner, instruction_id: leg.id)[:outcome]).to eq("linked")
      end
    end

    it "does not offer or link a request carrying another transfer's key" do
      leg = uncertain_instruction
      foreign = mercury_request("memo" => "miru-payroll-#{SecureRandom.uuid}")
      stub_listing([foreign])
      expect(service.reconcile!(actor: owner, instruction_id: leg.id)[:outcome]).to eq("none_found")
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(foreign))
      expect(blocked_codes { service.confirm_request!(actor: owner, instruction_id: leg.id, request_id:) }).to eq(["request_does_not_match"])
    end
  end

  describe "finding 8: settlement and failed legs" do
    let!(:leg) do
      accepted = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(accepted)
    end

    def credit(amount)
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount:, credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR-#{amount}")
    end

    it "does not resolve a shortfall on a failed wire" do
      credit("1.00")
      stub_status(transactions: [mercury_transaction("status" => "failed")])
      refresh(leg)
      expect(blocked_codes { service.resolve_shortfall!(actor: accounts, instruction_id: leg.id, reason: "Accepted") }).to eq(["no_open_shortfall"])
    end

    %w[failed cancelled blocked reversed].each do |status|
      it "reopens a fully credited group when the wire becomes #{status}" do
        credit("62500.00")
        expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
        stub_status(transactions: [mercury_transaction("status" => status)])
        refresh(leg)
        expect(leg.payroll_payment_group.reload.fully_credited_at).to be_nil
      end
    end
  end

  describe "finding 9: guards under the lock" do
    it "does not let a late acceptance overwrite a voided transfer" do
      leg = prepared_instruction
      payment.void!(actor: owner, instruction_id: leg.id)
      parsed = PayrollProviders::MercuryContract.send_money_request(JSON.parse(JSON.generate(mercury_request), decimal_class: BigDecimal))
      expect { Payroll::MercuryReconciliation.accept!(leg, parsed, actor: owner, event: "request_reconciled") }
        .to raise_error(Payroll::MercuryPayment::Blocked)
      expect(leg.reload.submission_state).to eq("voided")
    end
  end

  describe "finding 10: rate freshness" do
    it "refuses a recently written row for an old date" do
      revision = approve_revision
      ExchangeRate.set_rate("USD", "INR", BigDecimal("83.00"), 90.days.ago.to_date, "api")
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: { mode: "exchange_rate" })
      end).to eq(["rate_unavailable"])
    end

    it "refuses an implausible manual rate" do
      revision = approve_revision
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: quote.merge(reference_rate: "8.35"))
      end).to eq(["rate_implausible"])
    end
  end

  describe "finding 11: split authority" do
    it "refuses a new split while a transfer is in flight, and withdrawal too" do
      revision = approve_revision
      arrangement = approved_split(value: "50")
      verified_connection
      linked_recipient
      link_spouse
      legs = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => legs.first.principal_minor / 100.0)))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: legs.first.id, expected_digest: legs.first.frozen_digest)
      expect(blocked_codes { request_split(value: "30") }).to eq(["split_locked_by_bank_activity"])
      expect(blocked_codes { split_service.withdraw!(actor: owner, arrangement_id: arrangement.id) }).to eq(["split_locked_by_bank_activity"])
    end

    it "requires the assigned accounts reviewer to verify" do
      approve_revision
      arrangement = request_split
      expect { split_service.verify!(actor: owner, arrangement_id: arrangement.id) }.to raise_error(Payroll::Workflow::NotAuthorized)
    end

    it "does not let one person verify and approve, even with both roles" do
      accounts.add_role(:owner, company)
      approve_revision
      arrangement = request_split
      split_service.verify!(actor: accounts, arrangement_id: arrangement.id)
      expect(blocked_codes { split_service.approve!(actor: accounts, arrangement_id: arrangement.id) }).to eq(["split_approver_must_differ"])
    end

    it "does not take a split for someone outside the run" do
      approve_revision
      other = create(:employment, company:, resigned_at: nil)
      expect do
        split_service.request!(actor: accounts, employment_id: other.id,
          attributes: { allocation_kind: "percentage", allocation_value: "10", allocated_to: "spouse", remainder_to: "consultant" },
          details: spouse_details, account_number_confirmation: spouse_details["bank_account_number"])
      end.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "gate review E1: returned wire with two transactions" do
    let!(:leg) do
      accepted = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(accepted)
    end

    it "stores the reversal, bars credit and reopens the group" do
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      returned = mercury_transaction("id" => "return-tx", "amount" => 744.05, "kind" => "incomingDomesticWire", "status" => "sent")
      stub_status(transactions: [mercury_transaction("status" => "reversed"), returned])
      refreshed = refresh(leg)
      expect(refreshed.transaction_status).to eq("reversed")
      expect(refreshed.display_state).to eq("returned")
      expect(refreshed.payroll_payment_group.reload.fully_credited_at).to be_nil
    end

    it "bars credit on a linked leg when a second transaction shows failure" do
      stub_status(transactions: [mercury_transaction, mercury_transaction("id" => "other", "status" => "failed")])
      refreshed = refresh(leg)
      expect(refreshed.transaction_status).to eq("failed")
      expect(refreshed.credit_recordable?).to be(false)
    end
  end

  describe "gate review E2: approval seen on linking" do
    it "does not release a request first linked as approved and later cancelled" do
      leg = uncertain_instruction
      stub_listing([mercury_request("memo" => leg.idempotency_key, "status" => "approved")])
      service.reconcile!(actor: owner, instruction_id: leg.id)
      expect(leg.reload.request_approved_at).to be_present
      stub_status(request: mercury_request("status" => "cancelled"))
      expect(refresh(leg).released_at).to be_nil
    end

    it "does not release after seeing a transaction, even if the list is later empty" do
      leg = accepted_instruction
      stub_status(request: mercury_request("status" => "cancelled"), transactions: [mercury_transaction("status" => "sent")])
      refresh(leg)
      stub_status(request: mercury_request("status" => "cancelled"))
      refreshed = refresh(leg)
      expect(refreshed.released_at).to be_nil
      expect(refreshed.transaction_link_state).to eq("reconciliation_required")
    end
  end

  describe "verification N3: split lock across runs" do
    def in_flight_split
      revision = approve_revision
      arrangement = approved_split(value: "50")
      verified_connection
      linked_recipient
      link_spouse
      leg = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => leg.principal_minor / 100.0)))
      accepted = Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      [arrangement, accepted, Payroll::SplitArrangements.new(later)]
    end

    it "refuses a split change through another run while a transfer can still complete" do
      arrangement, _leg, other_run = in_flight_split
      expect(blocked_codes { other_run.withdraw!(actor: owner, arrangement_id: arrangement.id) }).to eq(["split_locked_by_bank_activity"])
    end

    it "does not lock future months because of a returned transfer" do
      arrangement, leg, other_run = in_flight_split
      PayrollPaymentInstruction.where(id: leg.id).update_all(transaction_status: "reversed")
      expect(other_run.withdraw!(actor: owner, arrangement_id: arrangement.id).withdrawn?).to be(true)
    end
  end

  describe "verification N4: known request exit reads transactions" do
    let!(:leg) do
      instruction = prepared_instruction
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => 1.00)))
      payment.submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    end

    before do
      stub_listing([])
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("amount" => 1.00, "status" => "cancelled")))
    end

    def attest
      service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1")
    end

    it "refuses attestation when the cancelled request has a transaction" do
      stub_request(:get, transactions_url).to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("amount" => -1.00, "status" => "sent")] }))
      expect(blocked_codes { attest }).to eq(["request_id_known"])
      expect(leg.reload.retry_unlocked?).to be(false)
    end

    it "refuses attestation when transactions cannot be read" do
      stub_request(:get, transactions_url).to_return(status: 503)
      expect(blocked_codes { attest }).to eq(["provider_status_unavailable"])
    end

    it "allows attestation with an empty transaction read" do
      stub_request(:get, transactions_url).to_return(mercury_json({ "total" => 0, "transactions" => [] }))
      expect(attest.retry_unlocked?).to be(true)
    end
  end

  describe "verification R1: return reported as a second sent transaction" do
    let!(:leg) do
      accepted = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(accepted)
    end

    it "reopens the group and bars further credit" do
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      returned = mercury_transaction("id" => "return-tx", "amount" => 744.05, "kind" => "incomingDomesticWire", "status" => "sent")
      stub_status(transactions: [mercury_transaction("status" => "sent"), returned])
      refreshed = refresh(leg)
      expect(refreshed.last_error_code).to eq("multiple_transactions")
      expect(refreshed.payroll_payment_group.reload.fully_credited_at).to be_nil
    end

    it "does not take a credit while two transactions are unexplained" do
      stub_status(transactions: [mercury_transaction("status" => "sent"), mercury_transaction("id" => "other", "status" => "sent")])
      expect(refresh(leg).credit_recordable?).to be(false)
    end
  end

  describe "gate review E5 and E6: terms" do
    it "treats a same-date schedule correction as a change even with the same fee" do
      builder = Payroll::ConsultantRevision.new(run, actor: accounts)
      employment.update!(joined_at: Date.new(2020, 1, 1))
      travel_to(Time.utc(2026, 12, 5, 12)) do
        revision = builder.create!(consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "t1")
        expect(revision.approval_issues).to eq([])
        ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
          hours_per_day: 8, weekdays: [1, 2, 3, 4], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Four-day week")
        expect(revision.approval_issues).to include("terms_changed")
      end
    end

    it "refuses terms that would change a month with bank activity" do
      accepted_instruction
      terms = { employment:, created_by: owner, monthly_fee: 70_000, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us",
                legal_entity_name: legal_name, change_reason: "Raise" }
      [Date.new(2026, 11, 1), Date.new(2026, 11, 15)].each do |effective_on|
        expect { ConsultantCompensation.create!(terms.merge(effective_on:)) }.to raise_error(ActiveRecord::RecordInvalid, /bank activity/)
      end
      expect { ConsultantCompensation.create!(terms.merge(effective_on: Date.new(2026, 12, 1))) }.not_to raise_error
    end
  end

  describe "gate review E7: mismatched request has an exit" do
    let!(:leg) do
      instruction = prepared_instruction
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => 1.00)))
      payment.submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    end

    before { stub_listing([]) }

    it "stays blocked while the mismatched request may still pay" do
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("amount" => 1.00)))
      expect(blocked_codes { service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1") }).to eq(["request_id_known"])
    end

    it "allows attestation once Mercury shows that request cancelled" do
      stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("amount" => 1.00, "status" => "cancelled")))
      stub_request(:get, transactions_url).to_return(mercury_json({ "total" => 0, "transactions" => [] }))
      attested = service.attest_absence!(actor: accounts, instruction_id: leg.id, evidence_reference: "Case 1")
      expect(attested.retry_unlocked?).to be(true)
      expect(attested.provider_request_id).to be_nil
      expect(attested.payroll_payment_events.find_by(kind: "absence_attested").data["cleared_request_id"]).to eq(request_id)
    end
  end

  describe "gate review D5/D7: review signals" do
    let(:leg) do
      accepted = accepted_instruction
      stub_status(transactions: [mercury_transaction("status" => "sent")])
      refresh(accepted)
    end

    def consultant
      Payroll::MercuryPaymentReview.new(run, owner).call[:consultants].first
    end

    it "does not raise the settled-claim alert from settlement alone" do
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      PayrollPaymentGroup.where(id: leg.payroll_payment_group_id).update_all(fully_credited_at: nil)
      expect(consultant[:settled_claims_need_review]).to be(false)
    end

    it "does not claim reimbursements were paid when a consultant without claims has a return" do
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "62500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      stub_status(transactions: [mercury_transaction("status" => "reversed")])
      refresh(leg)
      expect(consultant[:settled_claims_need_review]).to be(false)
    end

    it "marks a recipient unverified after bank details change" do
      leg
      employment.employee_record.update!(private_details: bank_details.merge("bank_account_number" => "999999999999"))
      expect(consultant[:recipients].first[:current]).to be(false)
    end

    it "hides submit and void from the attester and resolve on a barred leg" do
      instruction = uncertain_instruction
      stub_listing([])
      accounts.add_role(:owner, company)
      service.attest_absence!(actor: accounts, instruction_id: instruction.id, evidence_reference: "Case 1")
      actions = Payroll::MercuryPaymentReview.new(run, accounts).call[:consultants].first[:legs].first[:actions]
      expect(actions.values_at(:submit, :void)).to eq([false, false])
    end
  end

  describe "gate review X2: read failures" do
    it "reports a token or provider failure separately from an ineligible account" do
      stub_mercury_reads
      Payroll::MercurySetup.new(company).save!(actor: owner, attributes: { api_token: token, environment: "sandbox",
        source_account_id: account_id, expected_legal_business_name: legal_name })
      stub_request(:get, "#{mercury_base}/account/#{account_id}").to_return(status: 401)
      expect(blocked_codes { Payroll::MercurySetup.new(company).verify!(actor: owner) }).to eq(["mercury_read_failed"])
    end
  end

  describe "finding 12: logging" do
    it "filters revision inputs and credit details from logs" do
      filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      filtered = filter.filter("consultants" => [{ "withholding" => "100", "unpaid_reason" => "Synthetic" }],
        "mercury_payment" => { "amount" => "1.00", "reference" => "UTR", "reason" => "Synthetic", "evidence_reference" => "Case" })
      expect(filtered.to_s).not_to include("100", "Synthetic", "UTR", "Case")
    end
  end
end
