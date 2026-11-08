# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::MercuryPayment do
  include_context "reviewed mercury consultant payroll"

  let(:write_url) { "#{mercury_base}/account/#{account_id}/request-send-money" }

  def submit(instruction)
    described_class.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
  end

  def stub_empty_listing
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/request-send-money\?})
      .to_return(mercury_json({ "requests" => [], "page" => { "nextPage" => nil, "previousPage" => nil } }))
  end

  def blocked_codes
    yield
    []
  rescue described_class::Blocked => error
    error.codes
  end

  describe "#prepare!" do
    it "freezes the quote and an idempotency key without any provider write" do
      instruction = prepared_instruction
      expect(instruction.entitlement_minor).to eq(6_250_000)
      expect(instruction.entitlement_currency).to eq("INR")
      expect(instruction.buffered_rate).to eq(BigDecimal("84"))
      expect(instruction.principal_minor).to eq(74_405)
      expect(instruction.fee_minor).to eq(1_500)
      expect(instruction.charge_type).to eq("ours")
      expect(instruction.purpose_category).to eq("contractor")
      expect(instruction.purpose_info).to eq("Synthetic Consultant")
      expect(instruction.submission_state).to eq("prepared")
      expect(instruction.idempotency_key).to match(/\Amiru-payroll-\h{8}-/)
      expect(a_request(:post, /mercury/)).not_to have_been_made
    end

    it "rounds the principal half up from the exact decimal division" do
      match_terms_to(2_100_000)
      record_synthetic_pto_treatment
      revision = approve_revision(payload: synthetic_payload(amount_minor: 2_100_000))
      instruction = ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        quote: quote.merge(reference_rate: "85.51")).first
      expect(BigDecimal("2100000") / BigDecimal("84.01")).to be_within(0.01).of(24_997.02)
      expect(instruction.principal_minor).to eq(24_997)
    end

    it "keeps an exact half cent deterministic" do
      match_terms_to(8_442)
      record_synthetic_pto_treatment
      revision = approve_revision(payload: synthetic_payload(amount_minor: 8_442))
      instruction = ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        quote: quote.merge(reference_rate: "85.50")).first
      expect(instruction.principal_minor).to eq(101)
    end

    it "rejects a zero or negative buffered rate" do
      revision = approve_revision
      payment = ready_payment
      ["1.50", "1.00", "0"].each do |rate|
        expect(blocked_codes do
          payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: quote.merge(reference_rate: rate))
        end).to include("rate_not_positive")
      end
    end

    [["85.1234567", "too many decimals"], ["abc", "text"], ["-85", "negative"], ["1e3", "exponent"], ["", "blank"]].each do |rate, name|
      it "rejects a #{name} reference rate" do
        revision = approve_revision
        expect(blocked_codes do
          ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: quote.merge(reference_rate: rate))
        end).to include("rate_invalid")
      end
    end

    it "rejects a stale or future rate observation" do
      revision = approve_revision
      payment = ready_payment
      [25.hours.ago, 1.hour.from_now].each do |time|
        expect(blocked_codes do
          payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: quote.merge(observed_at: time.iso8601))
        end).to include("rate_stale_or_future")
      end
    end

    it "rejects a principal over Mercury's documented maximum" do
      match_terms_to(90_000_000_000)
      record_synthetic_pto_treatment
      revision = approve_revision(payload: synthetic_payload(amount_minor: 90_000_000_000))
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("principal_out_of_range")
    end

    it "requires a fully approved current revision" do
      revision = workflow.revise!(actor: accounts, payload: synthetic_payload, idempotency_key: "draft", expected_digest: nil)
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("run_not_approved")
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      expect(blocked_codes do
        described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("run_not_approved")
    end

    it "conflicts on a stale revision digest" do
      approve_revision
      expect do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: "0" * 64, quote:)
      end.to raise_error(Payroll::Workflow::Conflict)
    end

    it "treats a SWIFT-filled profile with no linked Mercury recipient as not ready" do
      revision = approve_revision
      verified_connection
      expect(blocked_codes do
        described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("recipient_not_linked")
    end

    it "blocks an unverified connection, even though the read-only token exists" do
      revision = approve_revision
      Payroll::MercurySetup.new(company).save!(actor: owner, attributes: { api_token: token, environment: "sandbox",
        source_account_id: account_id, expected_legal_business_name: legal_name })
      expect(blocked_codes do
        described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("connection_unverified")
    end

    it "blocks lines not marked for Mercury funding" do
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Moved to India funding")
      record_synthetic_pto_treatment
      revision = approve_revision
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("funding_not_mercury")
    end

    it "blocks employee lines" do
      revision = approve_revision(payload: synthetic_payload(pay_type: "employee"))
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end).to include("not_consultant_line")
    end

    it "refuses a new revision that changes a consultant with bank activity" do
      revision = approve_revision
      instruction = prepared_instruction(revision:)
      stub_mercury_write
      submit(instruction)
      expect do
        workflow.revise!(actor: accounts, payload: synthetic_payload(reimbursements: [10_000]), idempotency_key: "changed", expected_digest: revision.digest)
      end.to raise_error(Payroll::Workflow::Conflict, /bank transfer exists/)
    end

    it "does not prepare the same transfer twice" do
      revision = approve_revision
      prepared_instruction(revision:)
      expect do
        described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
      end.to raise_error(Payroll::Workflow::Conflict, /already prepared/)
    end

    it "requires a fresh stored exchange rate when using the app's FX source" do
      revision = approve_revision
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: { mode: "exchange_rate" })
      end).to eq(["rate_unavailable"])
    end

    it "uses a fresh stored USD to INR exchange rate and records its source" do
      revision = approve_revision
      ExchangeRate.set_rate("USD", "INR", BigDecimal("85.50"), Date.current, "api")
      leg = ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: { mode: "exchange_rate" }).first
      expect(leg.rate_mode).to eq("exchange_rate")
      expect(leg.rate_source).to include("api")
      expect(leg.rate_entered_by).to be_nil
      expect(leg.principal_minor).to eq(74_405)
    end

    it "refuses a stale stored exchange rate" do
      revision = approve_revision
      ExchangeRate.set_rate("USD", "INR", BigDecimal("85.50"), Date.current, "api")
      ExchangeRate.update_all(updated_at: 25.hours.ago)
      expect(blocked_codes do
        ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote: { mode: "exchange_rate" })
      end).to eq(["rate_unavailable"])
    end

    it "records who entered a manual rate" do
      leg = prepared_instruction
      expect(leg.rate_mode).to eq("manual")
      expect(leg.rate_entered_by).to eq(owner)
      expect(leg.rate_source).to eq("Synthetic reference")
    end

    it "does not compare the Indian account currency with USD" do
      expect(prepared_instruction.entitlement_currency).to eq("INR")
    end

    it "stores configured fee and company debit separately from principal" do
      leg = prepared_instruction
      expect([leg.principal_minor, leg.fee_minor, leg.company_debit_minor]).to eq([74_405, 1_500, 75_905])
    end

    it "refuses a zero configured fee rather than dropping OUR" do
      verified_connection
      connection = PayrollMercuryConnection.find_by!(company:)
      expect { connection.update!(wire_fee_minor: 0) }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "refuses non-owners, including a global super admin with no company role" do
      revision = approve_revision
      admin = create(:user, current_workspace: company)
      create(:employment, company:, user: admin, resigned_at: nil)
      admin.add_role(:admin, company)
      allow(admin).to receive(:super_admin?).and_return(true)
      [accounts, admin].each do |actor|
        expect do
          ready_payment.prepare!(actor:, employment_id: employment.id, expected_digest: revision.digest, quote:)
        end.to raise_error(Payroll::Workflow::NotAuthorized)
      end
    end
  end

  describe "#submit!" do
    let!(:revision) { approve_revision }
    let!(:instruction) { prepared_instruction(revision:) }

    before { stub_mercury_reads }

    it "creates exactly one approval request with the frozen payload and stores its pending status" do
      stub = stub_request(:post, write_url).with do |request|
        body = JSON.parse(request.body, decimal_class: BigDecimal)
        body["amount"] == BigDecimal("744.05") && body["recipientId"] == recipient_id && body["paymentMethod"] == "internationalWire" &&
          body["idempotencyKey"] == instruction.idempotency_key && body["chargeType"] == "ours" &&
          body["purpose"] == { "simple" => { "category" => "contractor", "additionalInfo" => "Synthetic Consultant" } }
      end.to_return(mercury_json(mercury_request))
      result = submit(instruction)
      expect(stub).to have_been_requested.once
      expect(result.submission_state).to eq("accepted")
      expect(result.request_status).to eq("pendingApproval")
      expect(result.provider_request_id).to eq(request_id)
      expect(result.display_state).to eq("awaiting_mercury_approval")
      expect(result.credit_state).to eq("none")
      expect(result.submitted_by).to eq(owner)
    end

    it "never calls the direct-send endpoint" do
      stub_mercury_write
      submit(instruction)
      expect(a_request(:post, %r{/transactions})).not_to have_been_made
    end

    it "does not reach the provider when the write switch is off" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return(nil)
      stub = stub_mercury_write
      expect(blocked_codes { submit(instruction) }).to eq(["writes_disabled"])
      expect(stub).not_to have_been_requested
      expect(instruction.reload.submission_state).to eq("prepared")
    end

    it "does not trust a client digest that disagrees with the frozen record" do
      stub = stub_mercury_write
      expect do
        described_class.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: "0" * 64)
      end.to raise_error(Payroll::Workflow::Conflict)
      expect(stub).not_to have_been_requested
    end

    it "refuses a tampered frozen field" do
      stub = stub_mercury_write
      PayrollPaymentInstruction.where(id: instruction.id).update_all(principal_minor: 999_999, company_debit_minor: 1_001_499)
      expect(blocked_codes { described_class.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest) })
        .to include("instruction_tampered")
      expect(stub).not_to have_been_requested
    end

    it "blocks when a new revision replaces the approved one" do
      stub = stub_mercury_write
      workflow.revise!(actor: accounts, payload: synthetic_payload(amount_minor: 6_300_000), idempotency_key: "changed", expected_digest: revision.digest)
      expect(blocked_codes { submit(instruction) }).to include("revision_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks when approved source data changes after approval" do
      stub = stub_mercury_write
      create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 11, 3), duration: 60)
      expect(blocked_codes { submit(instruction) }).to include("run_not_approved")
      expect(stub).not_to have_been_requested
    end

    it "blocks when the bank profile changes" do
      stub = stub_mercury_write
      employment.employee_record.update!(private_details: bank_details.merge("bank_account_number" => "999999999999"))
      expect(blocked_codes { submit(instruction) }).to include("bank_details_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks when Mercury's recipient routing changes" do
      stub = stub_mercury_write
      changed = mercury_recipient
      changed["internationalWireRoutingInfo"]["swiftCode"] = "OTHRINBBXXX"
      stub_mercury_reads(recipient: changed)
      expect(blocked_codes { submit(instruction) }).to include("recipient_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks when Mercury deleted the recipient" do
      stub = stub_mercury_write
      stub_mercury_reads(recipient: mercury_recipient("status" => "deleted"))
      expect(blocked_codes { submit(instruction) }).to include("recipient_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks when the funding account closes or its legal name changes" do
      stub = stub_mercury_write
      [{ "status" => "archived" }, { "legalBusinessName" => "Other LLC" }].each do |change|
        stub_mercury_reads(account: mercury_account(change))
        expect(blocked_codes { submit(instruction) }).to include("source_account_ineligible")
      end
      expect(stub).not_to have_been_requested
    end

    it "blocks when the balance does not cover principal plus fee" do
      stub = stub_mercury_write
      stub_mercury_reads(account: mercury_account("availableBalance" => 759.04))
      expect(blocked_codes { submit(instruction) }).to include("insufficient_balance")
      stub_mercury_reads(account: mercury_account("availableBalance" => 759.05))
      expect(blocked_codes { submit(instruction) }).to eq([])
      expect(stub).to have_been_requested.once
    end

    it "blocks when the connection is rotated after review" do
      stub = stub_mercury_write
      Payroll::MercurySetup.new(company).save!(actor: owner, attributes: { api_token: "secret-token:rotated" })
      Payroll::MercurySetup.new(company).verify!(actor: owner)
      expect(blocked_codes { submit(instruction) }).to include("connection_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks an expired quote" do
      stub = stub_mercury_write
      travel_to(25.hours.from_now) do
        expect(blocked_codes { submit(instruction) }).to include("quote_expired")
      end
      expect(stub).not_to have_been_requested
    end

    it "blocks terms moved away from Mercury after review" do
      stub = stub_mercury_write
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Moved")
      expect(blocked_codes { submit(instruction) }).to include("terms_changed")
      expect(stub).not_to have_been_requested
    end

    it "blocks the owner role being removed, a workspace switch and resignation" do
      stub = stub_mercury_write
      other = create(:company)
      owner.update!(current_workspace: other)
      expect { submit(instruction) }.to raise_error(Payroll::Workflow::NotAuthorized)
      owner.update!(current_workspace: company)
      owner.remove_role(:owner, company)
      expect { submit(instruction) }.to raise_error(Payroll::Workflow::NotAuthorized)
      expect(stub).not_to have_been_requested
    end

    context "when the outcome is ambiguous" do
      [
        ["a timeout", ->(stub) { stub.to_timeout }],
        ["a server error", ->(stub) { stub.to_return(status: 503) }],
        ["a rate limit", ->(stub) { stub.to_return(status: 429) }],
        ["a redirect", ->(stub) { stub.to_return(status: 307, headers: { "Location" => "https://elsewhere.example" }) }],
        ["an unexpected success body", ->(stub) { stub.to_return(status: 200, body: "{}", headers: { "Content-Type" => "application/json" }) }],
        ["non-JSON success", ->(stub) { stub.to_return(status: 200, body: "OK", headers: { "Content-Type" => "text/plain" }) }]
      ].each do |name, setup|
        it "preserves the key and blocks a retry after #{name}" do
          stub = setup.call(stub_request(:post, write_url))
          key = instruction.idempotency_key
          result = submit(instruction)
          expect(result.submission_state).to eq("uncertain")
          expect(result.display_state).to eq("submission_uncertain")
          expect(result.idempotency_key).to eq(key)
          expect(blocked_codes { submit(result) }).to include("reconcile_before_retry")
          expect(stub).to have_been_requested.once
          expect(PayrollPaymentInstruction.where(payroll_run_id: run.id).count).to eq(1)
        end
      end

      it "treats a response with a different payment method as uncertain" do
        stub_mercury_write(mercury_json(mercury_request("paymentMethod" => "ach")))
        expect(submit(instruction).last_error_code).to eq("response_mismatch")
      end

      it "retains a well-formed request ID when a response disagrees with the frozen amount" do
        stub_mercury_write(mercury_json(mercury_request("amount" => 1.00)))
        result = submit(instruction)
        expect(result.submission_state).to eq("uncertain")
        expect(result.provider_request_id).to eq(request_id)
        expect(result.last_error_code).to eq("response_mismatch")
      end

      it "holds the consultant's slot so no replacement can be prepared" do
        stub_request(:post, write_url).to_timeout
        submit(instruction)
        expect do
          described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
        end.to raise_error(Payroll::Workflow::Conflict, /already prepared/)
      end

      it "cannot void an uncertain instruction before reconciliation" do
        stub_request(:post, write_url).to_timeout
        submit(instruction)
        expect(blocked_codes { described_class.new(run).void!(actor: owner, instruction_id: instruction.id) }).to include("reconcile_before_retry")
      end

      it "treats a process dying after commit as uncertain" do
        allow_any_instance_of(PayrollProviders::MercuryClient).to receive(:create_send_money_request).and_raise(SignalException, "TERM")
        expect { submit(instruction) }.to raise_error(SignalException)
        expect(instruction.reload.submission_state).to eq("submitting")
        expect(instruction.display_state).to eq("submission_uncertain")
      end
    end

    context "when Mercury rejects outright" do
      it "records a first-attempt documented 404 as rejected and releases the slot" do
        stub_request(:post, write_url).to_return(status: 404)
        result = submit(instruction)
        expect(result.submission_state).to eq("rejected")
        expect(result.released_at).to be_present
        expect(result.display_state).to eq("submission_rejected")
        fresh = described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
        expect(fresh.id).not_to eq(instruction.id)
        expect(fresh.idempotency_key).not_to eq(instruction.idempotency_key)
      end

      [400, 401, 403, 409, 422].each do |status|
        it "keeps an undocumented or possibly duplicate #{status} uncertain" do
          stub_request(:post, write_url).to_return(status:)
          result = submit(instruction)
          expect(result.submission_state).to eq("uncertain")
          expect(result.released_at).to be_nil
          expect(result.last_error_code).to eq("provider_returned_#{status}")
        end
      end

      it "does not treat a 404 after an earlier uncertain attempt as a fresh first attempt" do
        stub_request(:post, write_url).to_timeout
        submit(instruction)
        instruction.reload.update!(absent_confirmed_at: Time.current)
        stub_empty_listing
        stub_request(:post, write_url).to_return(status: 404)
        result = submit(instruction.reload)
        expect(result.submission_state).to eq("uncertain")
        expect(result.released_at).to be_nil
      end
    end

    it "retries only with the same key and payload after confirmed absence" do
      first = stub_request(:post, write_url).to_timeout
      submit(instruction)
      original = instruction.reload.idempotency_key
      instruction.update!(absent_confirmed_at: Time.current)
      stub_empty_listing
      keys = []
      WebMock.reset_executed_requests!
      second = stub_request(:post, write_url).with do |request|
        keys << JSON.parse(request.body)["idempotencyKey"]
        true
      end.to_return(mercury_json(mercury_request))
      result = submit(instruction.reload)
      expect(first).not_to be_nil
      expect(second).to have_been_requested.once
      expect(keys.uniq).to eq([original])
      expect(result.submission_attempts).to eq(2)
      expect(result.submission_state).to eq("accepted")
    end

    it "treats a double submit after acceptance as a blocked no-op" do
      stub = stub_mercury_write
      accepted = submit(instruction)
      expect(blocked_codes { submit(accepted) }).to include("already_submitted")
      expect(stub).to have_been_requested.once
    end

    it "records append-only events without credentials or bank numbers" do
      stub_mercury_write
      submit(instruction)
      events = PayrollPaymentEvent.where(payroll_payment_instruction_id: instruction.id)
      expect(events.pluck(:kind)).to eq(%w[prepared submission_started submission_accepted])
      json = events.to_json
      expect(json).not_to include(token, "123456789012", "SYNT0000001", "secret-token")
      expect { events.first.destroy! }.to raise_error(ActiveRecord::ReadOnlyRecord)
      expect { events.first.update_columns(kind: "x") }.to raise_error(ActiveRecord::ActiveRecordError)
      expect { PayrollPaymentEvent.where(id: events.first.id).update_all(kind: "x") }.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
  end

  describe "#void!" do
    it "releases an unsent instruction and lets the owner prepare with a fresh rate" do
      revision = approve_revision
      instruction = prepared_instruction(revision:)
      voided = described_class.new(run).void!(actor: owner, instruction_id: instruction.id)
      expect(voided.submission_state).to eq("voided")
      expect(voided.display_state).to eq("voided")
      fresh = described_class.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        quote: quote.merge(reference_rate: "86.50")).first
      expect(fresh.idempotency_key).not_to eq(instruction.idempotency_key)
      expect(fresh.principal_minor).to eq(73_529)
    end

    it "cannot void an accepted request" do
      instruction = prepared_instruction
      stub_mercury_write
      described_class.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
      expect(blocked_codes { described_class.new(run).void!(actor: owner, instruction_id: instruction.id) }).to include("already_submitted")
    end
  end
end
