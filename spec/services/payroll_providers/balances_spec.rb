# frozen_string_literal: true

require "spec_helper"
require_relative "../../../app/services/payroll_providers/error"
require_relative "../../../app/services/payroll_providers/read_only_client"
require_relative "../../../app/services/payroll_providers/balance_adapter"
require_relative "../../../app/services/payroll_providers/mercury_balance"
require_relative "../../../app/services/payroll_providers/razorpay_balance"

RSpec.describe "Read-only payroll provider balances" do
  let(:now) { Time.utc(2026, 10, 17, 12) }
  let(:mercury_url) { "https://api.mercury.com/api/v1/accounts?limit=1000" }
  let(:razorpay_url) { "https://api.razorpay.com/v1/banking_balances?count=100&skip=0" }
  let(:complete_page) { { nextPage: nil, previousPage: nil } }
  let(:mercury_account) do
    {
      "id" => "synthetic-account", "legalBusinessName" => "Example US LLC", "status" => "active",
      "type" => "mercury", "availableBalance" => 123.29, "currentBalance" => 500,
      "accountNumber" => "synthetic-bank-number", "routingNumber" => "synthetic-routing-number"
    }
  end
  let(:razorpay_account) do
    {
      "entity" => "banking_balance", "currency" => "INR", "account_number" => "synthetic-india-account",
      "account_type" => "current_account", "amount" => 999_999, "available_amount" => 12_329,
      "refreshed_at" => now.to_i
    }
  end
  let(:mercury) do
    PayrollProviders::MercuryBalance.new(binding: { company_id: 11, account_id: "synthetic-account",
      legal_business_name: "Example US LLC" }, token: "synthetic-token", environment: :live, clock: -> { now })
  end
  let(:razorpay) do
    PayrollProviders::RazorpayBalance.new(company_id: 22, account_id: "synthetic-india-account",
      key_id: "rzp_live_synthetic_key", key_secret: "synthetic-secret", clock: -> { now })
  end

  before { WebMock.disable_net_connect! }

  def respond_with(url, value)
    body = JSON.generate(value)
    stub_request(:get, url).to_return(status: 200, body:, headers: { "Content-Type" => "application/json" })
  end

  def fetch_mercury
    mercury.fetch_balance(company_id: 11, currency: "USD")
  end

  def fetch_razorpay
    razorpay.fetch_balance(company_id: 22, currency: "INR")
  end

  describe "Mercury" do
    it "uses a bearer-authenticated GET and preserves decimal precision without returning bank details" do
      respond_with(mercury_url, { accounts: [mercury_account], page: complete_page })

      result = fetch_mercury

      expect(result).to include(provider: "mercury", environment: "live", company_id: 11, currency: "USD",
        available_minor_units: 12_329, fetched_at: now, observed_at: nil)
      expect(result[:account_reference]).to match(/\A[0-9a-f]{64}\z/)
      expect(result.to_s).not_to include("synthetic-account", "bank-number", "routing-number", "synthetic-token")
      expect(result).to be_frozen
      expect(a_request(:get, mercury_url).with(headers: { "Authorization" => "Bearer synthetic-token" })).to have_been_made.once
    end

    it "uses only the fixed sandbox endpoint when explicitly selected" do
      sandbox_url = "https://api-sandbox.mercury.com/api/v1/accounts?limit=1000"
      respond_with(sandbox_url, { accounts: [mercury_account], page: complete_page })
      adapter = PayrollProviders::MercuryBalance.new(binding: { company_id: 11, account_id: "synthetic-account",
        legal_business_name: "Example US LLC" }, token: "synthetic-sandbox-token", environment: :sandbox)

      expect(adapter.fetch_balance(company_id: 11, currency: "USD")).to include(available_minor_units: 12_329,
        environment: "sandbox")
      expect(a_request(:get, mercury_url)).not_to have_been_made
    end

    ["deleted", "pending", "archived"].each do |status|
      it "rejects a #{status} account" do
        respond_with(mercury_url, { accounts: [mercury_account.merge("status" => status)], page: complete_page })
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error)
      end
    end

    [
      { "type" => "external" }, { "type" => "recipient" }, { "legalBusinessName" => "Other Company" },
      { "availableBalance" => -1 }, { "availableBalance" => "123.29" },
      { "availableBalance" => nil }, { "availableBalance" => 1.001 }
    ].each do |change|
      it "rejects invalid Mercury account data #{change.keys.first} #{change.values.first.inspect}" do
        payload = { accounts: [mercury_account.merge(change)], page: complete_page }
        respond_with(mercury_url, payload)
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error)
      end
    end

    [{}, { nextPage: nil }, { nextPage: nil, previousPage: nil, unknown: nil },
      { nextPage: "more" }, { previousPage: "previous" }, { nextPage: false }, nil].each do |page|
      it "rejects incomplete pagination #{page.inspect}" do
        respond_with(mercury_url, { accounts: [mercury_account], page: })
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error)
      end
    end

    [[], [nil], [{ "id" => "another-account" }]].each do |accounts|
      it "rejects missing or malformed accounts #{accounts.inspect}" do
        respond_with(mercury_url, { accounts:, page: complete_page })
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error)
      end
    end

    it "rejects duplicate matching accounts rather than summing them" do
      respond_with(mercury_url, { accounts: [mercury_account, mercury_account], page: complete_page })
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error, /ambiguous/)
    end

    it "rejects cross-company and non-USD reads before making a request" do
      expect { mercury.fetch_balance(company_id: 22, currency: "USD") }.to raise_error(PayrollProviders::Error)
      expect { mercury.fetch_balance(company_id: 11, currency: "INR") }.to raise_error(PayrollProviders::Error)
      expect(a_request(:get, mercury_url)).not_to have_been_made
    end

    it "uses exact decimal arithmetic for a large JSON number beyond float precision" do
      body = JSON.generate({ accounts: [mercury_account.merge("availableBalance" => "90071992547409.93")], page: complete_page })
        .sub('"90071992547409.93"', "90071992547409.93")
      stub_request(:get, mercury_url).to_return(status: 200, body:, headers: { "Content-Type" => "application/json" })
      expect(fetch_mercury[:available_minor_units]).to eq(9_007_199_254_740_993)
    end

    it "accepts an integer zero balance" do
      respond_with(mercury_url, { accounts: [mercury_account.merge("availableBalance" => 0)], page: complete_page })
      expect(fetch_mercury[:available_minor_units]).to eq(0)
    end
  end

  describe "Razorpay" do
    it "reads available paise rather than the total balance and preserves refreshed_at" do
      respond_with(razorpay_url, { entity: "collection", count: 1, items: [razorpay_account] })
      result = fetch_razorpay
      expect(result).to include(provider: "razorpay", environment: "live", company_id: 22, currency: "INR",
        available_minor_units: 12_329, observed_at: now, fetched_at: now)
      expect(result.to_s).not_to include("synthetic-india-account", "rzp_live_synthetic_key", "synthetic-secret")
      expect(a_request(:get, razorpay_url).with(basic_auth: ["rzp_live_synthetic_key", "synthetic-secret"])).to have_been_made.once
    end

    [
      { "currency" => "USD" }, { "account_type" => "fixed_deposit" }, { "entity" => "other" },
      { "available_amount" => -1 }, { "available_amount" => 1.5 }, { "available_amount" => nil },
      { "available_amount" => "12329" }, { "refreshed_at" => nil }, { "refreshed_at" => "123" }
    ].each do |change|
      it "rejects invalid Razorpay account data #{change.keys.first} #{change.values.first.inspect}" do
        respond_with(razorpay_url, { entity: "collection", count: 1, items: [razorpay_account.merge(change)] })
        expect { fetch_razorpay }.to raise_error(PayrollProviders::Error)
      end
    end

    [-301, 31].each do |offset|
      it "rejects an observation outside the freshness window #{offset}" do
        respond_with(razorpay_url, { entity: "collection", count: 1,
          items: [razorpay_account.merge("refreshed_at" => now.to_i + offset)] })
        expect { fetch_razorpay }.to raise_error(PayrollProviders::Error, /stale or invalid/)
      end
    end

    it "rejects a full page because more accounts may be hidden" do
      respond_with(razorpay_url, { entity: "collection", count: 100, items: Array.new(100) { razorpay_account } })
      expect { fetch_razorpay }.to raise_error(PayrollProviders::Error, /Incomplete/)
    end

    it "rejects inconsistent collection counts" do
      respond_with(razorpay_url, { entity: "collection", count: 2, items: [razorpay_account] })
      expect { fetch_razorpay }.to raise_error(PayrollProviders::Error)
    end

    it "rejects the wrong company or currency before requesting" do
      expect { razorpay.fetch_balance(company_id: 11, currency: "INR") }.to raise_error(PayrollProviders::Error)
      expect { razorpay.fetch_balance(company_id: 22, currency: "USD") }.to raise_error(PayrollProviders::Error)
      expect(a_request(:get, razorpay_url)).not_to have_been_made
    end

    it "does not substitute the total amount when available_amount is absent" do
      respond_with(razorpay_url, { entity: "collection", count: 1,
        items: [razorpay_account.reject { |key, _| key == "available_amount" }] })
      expect { fetch_razorpay }.to raise_error(PayrollProviders::Error, /available balance/)
    end

    it "rejects a duplicate configured account" do
      respond_with(razorpay_url, { entity: "collection", count: 2, items: [razorpay_account, razorpay_account] })
      expect { fetch_razorpay }.to raise_error(PayrollProviders::Error, /ambiguous/)
    end

    it "does not sum an unrelated account" do
      respond_with(razorpay_url, { entity: "collection", count: 2,
        items: [razorpay_account, razorpay_account.merge("account_number" => "another-account")] })
      expect(fetch_razorpay[:available_minor_units]).to eq(12_329)
    end
  end

  describe "transport isolation" do
    [301, 302, 401, 403, 429, 500].each do |status|
      it "sanitizes status #{status} and never follows redirects" do
        stub_request(:get, mercury_url).to_return(status:, body: "synthetic-token secret-bank-number",
          headers: { "Location" => "https://untrusted.example/collect" })
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error, "Provider balance request rejected")
        expect(a_request(:any, "https://untrusted.example/collect")).not_to have_been_made
      end
    end

    it "bounds response bytes even without a content-length header" do
      stub_request(:get, mercury_url).to_return(status: 200, body: "x" * 262_145,
        headers: { "Content-Type" => "application/json" })
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error, /too large/)
    end

    it "rejects oversized declared content without returning the body" do
      stub_request(:get, mercury_url).to_return(status: 200, body: "{}",
        headers: { "Content-Type" => "application/json", "Content-Length" => "262145" })
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error, /too large/)
    end

    it "sanitizes malformed JSON without retaining its exception cause" do
      stub_request(:get, mercury_url).to_return(status: 200, body: "synthetic-token",
        headers: { "Content-Type" => "application/json" })
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error) { |error| expect(error.cause).to be_nil }
    end

    it "rejects duplicate JSON fields rather than selecting an ambiguous balance" do
      stub_request(:get, mercury_url).to_return(status: 200, body: '{"accounts": [], "accounts": [], "page": {}}',
        headers: { "Content-Type" => "application/json" })
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error, "Provider balance request failed")
    end

    it "sanitizes network errors and their cause" do
      stub_request(:get, mercury_url).to_raise(Net::ReadTimeout.new("synthetic-token"))
      expect { fetch_mercury }.to raise_error(PayrollProviders::Error, "Provider balance request failed") do |error|
        expect(error.cause).to be_nil
      end
    end

    it "does not expose credentials or account information in object inspection" do
      expect(mercury.inspect).not_to include("synthetic-token", "synthetic-account", "Example US")
      expect(razorpay.inspect).not_to include("synthetic-secret", "synthetic-india-account")
      client = PayrollProviders::ReadOnlyClient.new(endpoint: :mercury_live, token: "synthetic-token")
      expect(client.inspect).not_to include("synthetic-token")
      expect(client).not_to respond_to(:post, :put, :delete)
    end

    [{ "Content-Type" => "text/html" }, { "Content-Type" => "application/json", "Content-Encoding" => "gzip" }].each do |headers|
      it "rejects unsupported response headers #{headers}" do
        stub_request(:get, mercury_url).to_return(status: 200, body: "{}", headers:)
        expect { fetch_mercury }.to raise_error(PayrollProviders::Error)
      end
    end

    it "rejects an arbitrary destination before any request" do
      expect { PayrollProviders::ReadOnlyClient.new(endpoint: "https://untrusted.example", token: "synthetic") }
        .to raise_error(PayrollProviders::Error, "Unsupported provider endpoint")
    end

    [nil, "", "injected\r\nheader"].each do |token|
      it "rejects an invalid injected credential #{token.inspect}" do
        expect { PayrollProviders::ReadOnlyClient.new(endpoint: :mercury_live, token:) }
          .to raise_error(PayrollProviders::Error, "Provider credentials are required")
      end
    end

    it "rejects an unsupported Mercury environment" do
      expect do
        PayrollProviders::MercuryBalance.new(binding: { company_id: 11, account_id: "synthetic-account",
          legal_business_name: "Example US LLC" }, token: "synthetic-token", environment: "https://untrusted.example")
      end.to raise_error(PayrollProviders::Error, "Unsupported Mercury environment")
    end

    it "rejects an unbound company configuration" do
      expect do
        PayrollProviders::RazorpayBalance.new(company_id: nil, account_id: "synthetic-india-account",
          key_id: "rzp_live_synthetic_key", key_secret: "synthetic-secret")
      end.to raise_error(PayrollProviders::Error, /binding/)
    end

    it "rejects test keys rather than labelling the live endpoint as sandbox access" do
      expect do
        PayrollProviders::RazorpayBalance.new(company_id: 22, account_id: "synthetic-india-account",
          key_id: "rzp_test_synthetic", key_secret: "synthetic-secret")
      end.to raise_error(PayrollProviders::Error, "Live Razorpay balance credentials are required")
      expect(a_request(:get, razorpay_url)).not_to have_been_made
    end
  end
end
