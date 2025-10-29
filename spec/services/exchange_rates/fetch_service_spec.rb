# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRates::FetchService, type: :service do
  let(:service) { described_class.new }
  let(:mock_response_body) do
    {
      "rates" => {
        "EUR" => 0.93,
        "GBP" => 0.79,
        "JPY" => 110.50,
        "CAD" => 1.25
      }
    }.to_json
  end

  let(:default_usage) { create(:exchange_rate_usage, requests_count: 100) }

  before do
    ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_api_key"
    allow(ExchangeRateUsage).to receive(:current).and_return(default_usage)
  end

  after do
    ENV.delete("OPEN_EXCHANGE_RATES_APP_ID")
  end

  describe "#process" do
    context "with auto_discover parameter" do
      it "defaults to true" do
        service = described_class.new
        expect(service.instance_variable_get(:@auto_discover)).to be true
      end

      it "can be set to false" do
        service = described_class.new(auto_discover: false)
        expect(service.instance_variable_get(:@auto_discover)).to be false
      end
    end

    context "when auto_discover is enabled" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client) { create(:client, company:, currency: "EUR") }

      before do
        client # Ensure client is created for discovery service
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "runs discovery before fetching" do
        expect_any_instance_of(ExchangeRates::CurrencyPairDiscoveryService).to receive(:process).and_call_original
        service.process
      end

      it "includes discovery results in response" do
        result = service.process
        expect(result[:discovery]).to be_present
        expect(result[:discovery][:discovered_pairs]).to be_an(Array)
        expect(result[:discovery][:total_pairs]).to be_a(Numeric)
      end

      it "logs discovery results" do
        allow(Rails.logger).to receive(:info)
        service.process
        expect(Rails.logger).to have_received(:info).with(/Currency pair discovery/)
      end
    end

    context "when auto_discover is disabled" do
      let(:service) { described_class.new(auto_discover: false) }

      before do
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "does not run discovery" do
        expect_any_instance_of(ExchangeRates::CurrencyPairDiscoveryService).not_to receive(:process)
        service.process
      end

      it "does not include discovery results" do
        result = service.process
        expect(result[:discovery]).to be_nil
      end
    end

    context "when discovery fails" do
      before do
        allow_any_instance_of(ExchangeRates::CurrencyPairDiscoveryService)
          .to receive(:process)
          .and_raise(StandardError.new("Discovery error"))
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "logs error but continues with fetch" do
        allow(Rails.logger).to receive(:error)
        result = service.process
        expect(Rails.logger).to have_received(:error).with(/Currency pair discovery failed/)
        expect(result[:success]).to be true
      end

      it "does not include discovery results" do
        allow(Rails.logger).to receive(:error)
        result = service.process
        expect(result[:discovery]).to be_nil
      end
    end

    context "when API key is not configured" do
      before do
        ENV.delete("OPEN_EXCHANGE_RATES_APP_ID")
      end

      it "returns error" do
        result = service.process
        expect(result[:success]).to be false
        expect(result[:error]).to eq("API key not configured")
      end

      it "does not run discovery" do
        expect_any_instance_of(ExchangeRates::CurrencyPairDiscoveryService).not_to receive(:process)
        service.process
      end
    end

    context "when monthly limit is exceeded" do
      let(:limit_exceeded_usage) { build(:exchange_rate_usage, requests_count: 1000) }

      before do
        allow(ExchangeRateUsage).to receive(:current).and_return(limit_exceeded_usage)
      end

      it "returns error" do
        result = service.process
        expect(result[:success]).to be false
        expect(result[:error]).to eq("Monthly limit exceeded")
      end

      it "does not make API request" do
        expect(Net::HTTP).not_to receive(:get_response)
        service.process
      end
    end

    context "when API request is successful", :vcr do
      before do
        create(:currency_pair, from_currency: "USD", to_currency: "EUR", active: true)
        create(:currency_pair, from_currency: "USD", to_currency: "GBP", active: true)

        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "returns success" do
        result = service.process
        expect(result[:success]).to be true
      end

      it "updates currency pairs with new rates" do
        service.process
        eur_pair = CurrencyPair.find_by(from_currency: "USD", to_currency: "EUR")
        expect(eur_pair.rate).to eq(0.93)
      end

      it "increments usage counter" do
        usage = ExchangeRateUsage.current
        expect {
          service.process
        }.to change { usage.reload.requests_count }.by(1)
      end

      it "returns usage percentage" do
        result = service.process
        expect(result[:usage]).to be_a(Numeric)
      end

      it "returns actual pairs updated count" do
        result = service.process
        expect(result[:rates_updated]).to eq(2) # EUR and GBP pairs
      end

      it "returns total currencies available from API" do
        result = service.process
        expect(result[:total_currencies_available]).to eq(4)
      end

      it "updates Money gem's bank" do
        service.process
        expect(Money.default_bank.get_rate("USD", "EUR")).to eq(0.93)
      end
    end

    context "when API request fails" do
      before do
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 429, body: "Rate limit exceeded")
      end

      it "returns error" do
        result = service.process
        expect(result[:success]).to be false
        expect(result[:error]).to include("API request failed")
      end

      it "does not increment usage counter" do
        usage = ExchangeRateUsage.current
        expect {
          service.process
        }.not_to change { usage.reload.requests_count }
      end
    end

    context "when network error occurs" do
      before do
        allow(Net::HTTP).to receive(:start).and_raise(SocketError.new("Network error"))
      end

      it "returns error" do
        result = service.process
        expect(result[:success]).to be false
        expect(result[:error]).to eq("Network error")
      end

      it "logs the error" do
        allow(Rails.logger).to receive(:error)
        allow(Rails.logger).to receive(:warn)
        service.process
        expect(Rails.logger).to have_received(:error).with(/Exchange rate fetch failed/).at_least(:once)
      end

      it "retries on network errors" do
        allow(Rails.logger).to receive(:warn)
        allow(Rails.logger).to receive(:error)
        allow(Net::HTTP).to receive(:start).exactly(3).times.and_raise(SocketError.new("Network error"))
        service.process
      end
    end

    context "when approaching usage threshold" do
      let(:approaching_limit_usage) {
  create(:exchange_rate_usage, month: 2.months.ago.beginning_of_month, requests_count: 699)
}

      before do
        allow(ExchangeRateUsage).to receive(:current).and_return(approaching_limit_usage)
        create(:currency_pair, from_currency: "USD", to_currency: "EUR", active: true)

        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "sends notification to admins" do
        expect_any_instance_of(ExchangeRates::UsageNotificationService).to receive(:notify_admins)
        service.process
      end
    end

    context "with cross-currency rates" do
      before do
        create(:currency_pair, from_currency: "EUR", to_currency: "GBP", active: true)

        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })
      end

      it "calculates cross rates correctly" do
        service.process
        pair = CurrencyPair.find_by(from_currency: "EUR", to_currency: "GBP")
        # EUR/GBP = GBP rate / EUR rate = 0.79 / 0.93 ≈ 0.8495
        expect(pair.rate).to be_within(0.01).of(0.85)
      end
    end

    context "with retry logic" do
      before do
        create(:currency_pair, from_currency: "USD", to_currency: "EUR", active: true)
      end

      it "retries on 5xx errors" do
        allow(Rails.logger).to receive(:warn)
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 503)
          .then.to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })

        result = service.process
        expect(result[:success]).to be true
      end

      it "retries on 429 rate limit" do
        allow(Rails.logger).to receive(:warn)
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 429)
          .then.to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })

        result = service.process
        expect(result[:success]).to be true
      end

      it "honors Retry-After header with seconds" do
        allow(Rails.logger).to receive(:warn)
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 429, headers: { "Retry-After" => "2" })
          .then.to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })

        allow(service).to receive(:sleep).with(2)
        service.process
      end

      it "gives up after max retries" do
        allow(Rails.logger).to receive(:warn)
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 503).times(3)

        result = service.process
        expect(result[:success]).to be false
        expect(result[:error]).to include("503")
      end

      it "uses exponential backoff" do
        allow(Rails.logger).to receive(:warn)
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 503)
          .then.to_return(status: 503)
          .then.to_return(status: 200, body: mock_response_body, headers: { "Content-Type" => "application/json" })

        allow(service).to receive(:sleep).with(0.5).ordered
        allow(service).to receive(:sleep).with(1.0).ordered
        service.process
      end
    end

    context "with invalid API response" do
      before do
        create(:currency_pair, from_currency: "USD", to_currency: "EUR", active: true)
      end

      it "returns error when rates is nil" do
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: { "rates" => nil }.to_json, headers: { "Content-Type" => "application/json" })

        allow(Rails.logger).to receive(:error)
        result = service.process

        expect(result[:success]).to be false
        expect(result[:error]).to include("Invalid API response")
        expect(result[:error]).to include("NilClass")
        expect(Rails.logger).to have_received(:error).with(/Invalid API response/)
      end

      it "returns error when rates is not a Hash" do
        stub_request(:get, /openexchangerates.org/)
          .to_return(
            status: 200,
            body: { "rates" => "invalid" }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        allow(Rails.logger).to receive(:error)
        result = service.process

        expect(result[:success]).to be false
        expect(result[:error]).to include("Invalid API response")
        expect(result[:error]).to include("String")
      end

      it "returns error when rates is an Array" do
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: { "rates" => [] }.to_json, headers: { "Content-Type" => "application/json" })

        allow(Rails.logger).to receive(:error)
        result = service.process

        expect(result[:success]).to be false
        expect(result[:error]).to include("Invalid API response")
        expect(result[:error]).to include("Array")
      end

      it "logs the offending payload" do
        invalid_response = { "rates" => "invalid" }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: invalid_response, headers: { "Content-Type" => "application/json" })

        allow(Rails.logger).to receive(:error)
        service.process

        expect(Rails.logger).to have_received(:error).with(/Response payload:/)
      end

      it "does not increment usage counter on invalid response" do
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: { "rates" => nil }.to_json, headers: { "Content-Type" => "application/json" })

        usage = ExchangeRateUsage.current
        expect {
          service.process
        }.not_to change { usage.reload.requests_count }
      end
    end

    context "with zero or negative rates" do
      it "skips inverse rate calculation when source rate is zero" do
        pair = create(:currency_pair, from_currency: "EUR", to_currency: "USD", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => 0.0 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(0)

        pair.reload
        expect(pair.rate).to be_nil
      end

      it "skips inverse rate calculation when source rate is negative" do
        pair = create(:currency_pair, from_currency: "EUR", to_currency: "USD", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => -0.5 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(0)

        pair.reload
        expect(pair.rate).to be_nil
      end

      it "skips cross rate calculation when from_currency rate is zero" do
        pair = create(:currency_pair, from_currency: "EUR", to_currency: "GBP", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => 0.0, "GBP" => 0.79 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(0)

        pair.reload
        expect(pair.rate).to be_nil
      end

      it "skips cross rate calculation when to_currency rate is zero" do
        pair = create(:currency_pair, from_currency: "EUR", to_currency: "GBP", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => 0.93, "GBP" => 0.0 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(0)

        pair.reload
        expect(pair.rate).to be_nil
      end

      it "skips cross rate calculation when either rate is negative" do
        pair = create(:currency_pair, from_currency: "EUR", to_currency: "GBP", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => -0.93, "GBP" => 0.79 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(0)

        pair.reload
        expect(pair.rate).to be_nil
      end

      it "processes valid rates and skips invalid ones" do
        usd_eur = create(:currency_pair, from_currency: "USD", to_currency: "EUR", active: true, rate: nil)
        eur_usd = create(:currency_pair, from_currency: "EUR", to_currency: "USD", active: true, rate: nil)
        eur_gbp = create(:currency_pair, from_currency: "EUR", to_currency: "GBP", active: true, rate: nil)

        mock_body = { "rates" => { "EUR" => 0.93, "GBP" => 0.0 } }.to_json
        stub_request(:get, /openexchangerates.org/)
          .to_return(status: 200, body: mock_body, headers: { "Content-Type" => "application/json" })

        result = service.process

        expect(result[:success]).to be true
        expect(result[:rates_updated]).to eq(2) # USD->EUR and EUR->USD, but not EUR->GBP

        usd_eur.reload
        expect(usd_eur.rate).to eq(0.93)

        eur_usd.reload
        expect(eur_usd.rate).to be_within(0.01).of(1.075) # 1 / 0.93

        eur_gbp.reload
        expect(eur_gbp.rate).to be_nil
      end
    end
  end
end
