# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRates::HealthCheckService, type: :service do
  let(:service) { described_class.new }

  # Ensure ENV variable isolation across all tests
  around do |example|
    original_api_key = ENV["OPEN_EXCHANGE_RATES_APP_ID"]
    example.run
  ensure
    if original_api_key
      ENV["OPEN_EXCHANGE_RATES_APP_ID"] = original_api_key
    else
      ENV.delete("OPEN_EXCHANGE_RATES_APP_ID")
    end
  end

  describe "#check" do
    context "when system is healthy" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(
          :currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true,
          last_updated_at: 1.hour.ago)
        create(:exchange_rate_usage, requests_count: 100)
      end

      it "returns healthy status" do
        result = service.check
        expect(result[:healthy]).to be true
        expect(result[:status]).to eq(:healthy)
      end

      it "has no issues" do
        result = service.check
        expect(result[:issues]).to be_empty
      end

      it "has no warnings" do
        result = service.check
        expect(result[:warnings]).to be_empty
      end

      it "includes system details" do
        result = service.check
        expect(result[:details][:api_key_configured]).to be true
        expect(result[:details][:database_rates_count]).to eq(1)
        expect(result[:details][:usage_percentage]).to eq(10.0)
      end
    end

    context "when API key is not configured" do
      before do
        ENV.delete("OPEN_EXCHANGE_RATES_APP_ID")
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
      end

      it "returns warning status" do
        result = service.check
        expect(result[:status]).to eq(:warning)
      end

      it "includes API key warning" do
        result = service.check
        expect(result[:warnings]).to include(/API key not configured/)
      end

      it "indicates API key is not configured in details" do
        result = service.check
        expect(result[:details][:api_key_configured]).to be false
      end

      it "system is not fully healthy" do
        result = service.check
        expect(result[:healthy]).to be false
      end
    end

    context "when no currency pairs exist" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
      end

      it "includes warning about no pairs" do
        result = service.check
        expect(result[:warnings]).to include(/No active currency pairs/)
      end

      it "suggests running discover command" do
        result = service.check
        expect(result[:warnings].first).to include("exchange_rates:discover")
      end
    end

    context "when currency pairs have no rates" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: nil, active: true)
        create(:currency_pair, from_currency: "GBP", to_currency: "USD", rate: nil, active: true)
      end

      it "includes warning about missing rates" do
        result = service.check
        expect(result[:warnings]).to include(/2 currency pairs have no rates/)
      end

      it "suggests running fetch command" do
        result = service.check
        expect(result[:warnings].any? { |w| w.include?("exchange_rates:fetch") }).to be true
      end
    end

    context "when API usage is approaching limit" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(
          :currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true,
          last_updated_at: 1.hour.ago)
        create(:exchange_rate_usage, requests_count: 750)
      end

      it "includes warning about approaching limit" do
        result = service.check
        expect(result[:warnings]).to include(/API usage approaching limit/)
      end

      it "shows usage percentage in warning" do
        result = service.check
        usage_warning = result[:warnings].find { |w| w.include?("API usage approaching limit") }
        expect(usage_warning).to include("75.0%")
      end
    end

    context "when API limit is exceeded" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(:exchange_rate_usage, requests_count: 1050)
      end

      it "returns critical status" do
        result = service.check
        expect(result[:status]).to eq(:critical)
      end

      it "includes critical issue about exceeded limit" do
        result = service.check
        expect(result[:issues]).to include(/Monthly API limit exceeded/)
      end

      it "system is not healthy" do
        result = service.check
        expect(result[:healthy]).to be false
      end
    end

    context "when rates are stale" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(
          :currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true,
          last_updated_at: 3.days.ago)
      end

      it "includes warning about stale rates" do
        result = service.check
        expect(result[:warnings]).to include(/haven't been updated/)
      end

      it "suggests checking scheduled job" do
        result = service.check
        expect(result[:warnings].any? { |w| w.include?("scheduled job") }).to be true
      end
    end

    context "when rates have never been updated" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: nil, active: true, last_updated_at: nil)
      end

      it "includes warning about no updates" do
        result = service.check
        expect(result[:warnings]).to include(/No currency pairs have been updated yet/)
      end
    end

    context "with multiple issues" do
      before do
        ENV.delete("OPEN_EXCHANGE_RATES_APP_ID")
        create(:exchange_rate_usage, requests_count: 1050)
      end

      it "includes all warnings and issues" do
        result = service.check
        expect(result[:warnings].size).to be > 0
        expect(result[:issues].size).to be > 0
      end

      it "returns critical status when issues exist" do
        result = service.check
        expect(result[:status]).to eq(:critical)
      end
    end

    context "when checking details section" do
      before do
        ENV["OPEN_EXCHANGE_RATES_APP_ID"] = "test_key"
        create(
          :currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true,
          last_updated_at: 1.hour.ago)
        create(
          :currency_pair, from_currency: "GBP", to_currency: "USD", rate: 1.27, active: true,
          last_updated_at: 1.hour.ago)
        create(:exchange_rate_usage, requests_count: 250)

        # Ensure fallback rates are available in Money gem
        Money.default_bank.add_rate("EUR", "USD", 1.08)
        Money.default_bank.add_rate("USD", "EUR", 0.93)
        Money.default_bank.add_rate("GBP", "USD", 1.27)
        Money.default_bank.add_rate("USD", "GBP", 0.79)
      end

      it "includes database rates count" do
        result = service.check
        expect(result[:details][:database_rates_count]).to eq(2)
      end

      it "includes fallback rates count" do
        result = service.check
        expect(result[:details][:fallback_rates_available]).to be > 0
      end

      it "includes usage percentage" do
        result = service.check
        expect(result[:details][:usage_percentage]).to eq(25.0)
      end

      it "includes last update time" do
        result = service.check
        expect(result[:details][:last_update]).to be_within(1.minute).of(1.hour.ago)
      end
    end
  end
end
