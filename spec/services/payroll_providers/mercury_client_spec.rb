# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollProviders::MercuryClient do
  let(:company_id) { 11 }
  let(:token) { "secret-token:mercury_sandbox_synthetic" }
  let(:account_id) { "11111111-1111-4111-8111-111111111111" }
  let(:recipient_id) { "22222222-2222-4222-8222-222222222222" }
  let(:request_id) { "33333333-3333-4333-8333-333333333333" }
  let(:base) { "https://api-sandbox.mercury.com/api/v1" }
  let(:client) { described_class.new(environment: "sandbox", company_id:, token:) }
  let(:body) do
    { "recipientId" => recipient_id, "paymentMethod" => "internationalWire", "idempotencyKey" => "miru-payroll-1",
      "purpose" => { "simple" => { "category" => "contractor", "additionalInfo" => "Synthetic Consultant" } },
      "chargeType" => "ours", "note" => "miru-payroll-1" }
  end
  let(:request_response) do
    { "accountId" => account_id, "requestId" => request_id, "recipientId" => recipient_id,
      "paymentMethod" => "internationalWire", "amount" => 744.05, "memo" => nil,
      "status" => "pendingApproval", "requestedByUserId" => "44444444-4444-4444-8444-444444444444",
      "reviews" => [], "createdAt" => "2026-11-03T10:00:00Z", "scheduledSendDate" => nil,
      "numberOfApproversRequired" => 1, "requesterMayApprove" => false }
  end

  before do
    enable_synthetic_payroll(company_id)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return("sandbox")
  end

  def json(value, status: 200)
    { status:, body: JSON.generate(value), headers: { "Content-Type" => "application/json" } }
  end

  def create_request(amount_minor: 74_405)
    client.create_send_money_request(account_id:, amount_minor:, body:)
  end

  describe "wire amount" do
    it "sends the exact integer minor units as a two-decimal JSON number" do
      stub = stub_request(:post, "#{base}/account/#{account_id}/request-send-money")
        .with { |request| request.body.include?(%("amount":100000.01,)) }.to_return(json(request_response))
      create_request(amount_minor: 10_000_001)
      expect(stub).to have_been_requested.once
    end

    it "does not lose a cent at the Mercury per-transaction maximum" do
      stub = stub_request(:post, "#{base}/account/#{account_id}/request-send-money")
        .with { |request| JSON.parse(request.body, decimal_class: BigDecimal)["amount"] == BigDecimal("10000000.00") }
        .to_return(json(request_response))
      create_request(amount_minor: 1_000_000_000)
      expect(stub).to have_been_requested.once
    end

    it "keeps a single cent exact" do
      stub = stub_request(:post, "#{base}/account/#{account_id}/request-send-money")
        .with { |request| request.body.include?(%("amount":0.01,)) }.to_return(json(request_response))
      create_request(amount_minor: 1)
      expect(stub).to have_been_requested.once
    end

    [0, -1, 1_000_000_001, 1.5, "100", nil].each do |invalid|
      it "refuses #{invalid.inspect} minor units before any network call" do
        expect { create_request(amount_minor: invalid) }.to raise_error(PayrollProviders::Error, /amount/i)
        expect(a_request(:any, /mercury/)).not_to have_been_made
      end
    end

    it "refuses a payload that tries to supply its own amount" do
      expect do
        client.create_send_money_request(account_id:, amount_minor: 100, body: body.merge("amount" => 999))
      end.to raise_error(PayrollProviders::Error, /amount/i)
      expect(a_request(:any, /mercury/)).not_to have_been_made
    end
  end

  describe "write gate" do
    it "refuses writes when the server switch is unset" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return(nil)
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::WritesDisabled)
      expect(a_request(:any, /mercury/)).not_to have_been_made
    end

    it "does not let a sandbox switch enable live writes" do
      live = described_class.new(environment: "live", company_id:, token:)
      expect do
        live.create_send_money_request(account_id:, amount_minor: 100, body:)
      end.to raise_error(PayrollProviders::MercuryClient::WritesDisabled)
      expect(a_request(:any, /mercury/)).not_to have_been_made
    end

    it "treats an inexact switch value as off" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return("SANDBOX")
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::WritesDisabled)
    end

    it "requires the payroll entitlement for reads and writes" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return("12")
      expect { client.account(account_id) }.to raise_error(Payroll::Entitlement::NotEnabled)
      expect { create_request }.to raise_error(Payroll::Entitlement::NotEnabled)
      expect(a_request(:any, /mercury/)).not_to have_been_made
    end
  end

  describe "fixed endpoints" do
    it "uses the fixed host with a bearer token and no redirect following" do
      stub = stub_request(:get, "#{base}/account/#{account_id}")
        .with(headers: { "Authorization" => "Bearer #{token}" })
        .to_return(status: 302, headers: { "Location" => "https://attacker.example/steal" })
      expect { client.account(account_id) }.to raise_error(PayrollProviders::MercuryClient::Ambiguous)
      expect(stub).to have_been_requested.once
      expect(a_request(:any, /attacker/)).not_to have_been_made
    end

    it "uses the production host only for the live environment" do
      stub = stub_request(:get, "https://api.mercury.com/api/v1/account/#{account_id}").to_return(json({ "id" => account_id }))
      described_class.new(environment: "live", company_id:, token:).account(account_id)
      expect(stub).to have_been_requested.once
    end

    it "rejects an unknown environment" do
      expect { described_class.new(environment: "attacker.example", company_id:, token:) }
        .to raise_error(PayrollProviders::Error)
    end

    ["../accounts", "#{SecureRandom.uuid}/x", "a b", "", nil].each do |unsafe|
      it "refuses the unsafe path identifier #{unsafe.inspect}" do
        expect { client.recipient(unsafe) }.to raise_error(PayrollProviders::Error, /identifier/)
        expect(a_request(:any, /mercury/)).not_to have_been_made
      end
    end

    it "looks up transactions by the request ID with an explicit start date" do
      url = "#{base}/account/#{account_id}/transactions?limit=50&requestId=#{request_id}&start=2026-11-02"
      stub = stub_request(:get, url).to_return(json({ "total" => 0, "transactions" => [] }))
      client.request_transactions(account_id:, request_id:, start: Date.new(2026, 11, 2))
      expect(stub).to have_been_requested.once
    end
  end

  describe "bounded responses and redaction" do
    it "refuses an oversized body without keeping it" do
      stub_request(:get, "#{base}/account/#{account_id}").to_return(
        status: 200, body: "x" * (described_class::MAX_BODY_BYTES + 1), headers: { "Content-Type" => "application/json" }
      )
      expect { client.account(account_id) }.to raise_error(PayrollProviders::MercuryClient::Ambiguous, /too large/)
    end

    it "refuses non-JSON and encoded responses" do
      stub_request(:get, "#{base}/account/#{account_id}").to_return(status: 200, body: "<html>", headers: { "Content-Type" => "text/html" })
      expect { client.account(account_id) }.to raise_error(PayrollProviders::MercuryClient::Ambiguous)
    end

    it "does not expose the token or provider body in an error" do
      stub_request(:post, "#{base}/account/#{account_id}/request-send-money")
        .to_return(json({ "message" => "PROVIDER-SECRET-DETAIL #{token}" }, status: 403))
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::Rejected) { |error|
        expect(error.message).not_to include("PROVIDER-SECRET-DETAIL", token)
        expect(error.status).to eq(403)
        expect(error.cause).to be_nil
      }
    end

    it "does not retain a network exception as the cause" do
      stub_request(:post, "#{base}/account/#{account_id}/request-send-money").to_raise(Errno::ECONNRESET.new(token))
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::Ambiguous) { |error|
        expect(error.message).not_to include(token)
        expect(error.cause).to be_nil
      }
    end

    it "redacts inspect" do
      expect(client.inspect).not_to include(token)
      expect(client.to_s).not_to include(token)
    end

    it "makes exactly one attempt on a write timeout" do
      stub = stub_request(:post, "#{base}/account/#{account_id}/request-send-money").to_timeout
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::Ambiguous)
      expect(stub).to have_been_requested.once
    end

    it "classifies a 500 as ambiguous rather than rejected" do
      stub_request(:post, "#{base}/account/#{account_id}/request-send-money").to_return(status: 500)
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::Ambiguous)
    end

    it "classifies a 400 with its status" do
      stub_request(:post, "#{base}/account/#{account_id}/request-send-money").to_return(status: 400)
      expect { create_request }.to raise_error(PayrollProviders::MercuryClient::Rejected) { |error| expect(error.status).to eq(400) }
    end
  end

  describe PayrollProviders::MercuryContract do
    it "parses an approval request with exact cents" do
      parsed = described_class.send_money_request(JSON.parse(JSON.generate(request_response), decimal_class: BigDecimal))
      expect(parsed.amount_minor).to eq(74_405)
      expect(parsed.request_id).to eq(request_id)
      expect(parsed.requester_may_approve).to be(false)
    end

    it "rejects sub-cent precision" do
      value = JSON.parse(JSON.generate(request_response), decimal_class: BigDecimal).merge("amount" => BigDecimal("1.001"))
      expect { described_class.send_money_request(value) }.to raise_error(PayrollProviders::MercuryClient::Malformed)
    end

    [{ "status" => "sent" }, { "requestId" => nil }, { "requestId" => "not-a-uuid" }, { "paymentMethod" => "cashApp" }, { "createdAt" => "yesterday" }, { "amount" => "744.05" }].each do |change|
      it "rejects the malformed request field #{change.keys.first}=#{change.values.first.inspect}" do
        value = JSON.parse(JSON.generate(request_response), decimal_class: BigDecimal).merge(change)
        expect { described_class.send_money_request(value) }.to raise_error(PayrollProviders::MercuryClient::Malformed)
      end
    end

    it "requires a known transaction status" do
      value = { "id" => "tx", "amount" => BigDecimal("-1.00"), "status" => "credited", "kind" => "outgoingPayment", "accountId" => account_id, "requestId" => request_id }
      expect { described_class.transaction(value) }.to raise_error(PayrollProviders::MercuryClient::Malformed)
    end

    it "preserves the transaction amount's sign" do
      value = { "id" => "tx", "amount" => BigDecimal("-744.05"), "status" => "sent", "kind" => "outgoingPayment", "accountId" => account_id, "requestId" => request_id }
      expect(described_class.transaction(value).amount_minor).to eq(-74_405)
    end
  end
end
