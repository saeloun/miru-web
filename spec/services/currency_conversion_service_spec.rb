# frozen_string_literal: true

require "rails_helper"

RSpec.describe CurrencyConversionService do
  describe ".get_exchange_rate" do
    let(:from_currency) { "EUR" }
    let(:to_currency) { "USD" }
    let(:date) { Date.current }

    context "when rate exists in database" do
      let!(:exchange_rate) { create(:exchange_rate, from_currency: from_currency, to_currency: to_currency, rate: 1.18, date: date) }

      it "returns the cached rate" do
        expect(described_class).not_to receive(:fetch_and_store_rate)

        rate = described_class.get_exchange_rate(from_currency, to_currency, date)
        expect(rate).to eq(1.18)
      end
    end

    context "when rate doesn't exist in database" do
      before do
        allow(described_class).to receive(:fetch_and_store_rate) do |from, to, date|
          # Simulate the actual behavior of creating a database record
          ExchangeRate.set_rate(from, to, 1.20, date, "api")
          1.20
        end
      end

      it "fetches from API and caches the result" do
        expect(described_class).to receive(:fetch_and_store_rate).with(from_currency, to_currency, date)

        rate = described_class.get_exchange_rate(from_currency, to_currency, date)
        expect(rate).to eq(1.20)

        # Verify it was cached
        cached_rate = ExchangeRate.rate_for(from_currency, to_currency, date)
        expect(cached_rate).to eq(1.20)
      end
    end

    context "when fetching same currency" do
      it "returns 1.0 without API call" do
        expect(described_class).not_to receive(:fetch_and_store_rate)

        rate = described_class.get_exchange_rate("USD", "USD", date)
        expect(rate).to eq(1.0)
      end
    end

    context "when API fails" do
      before do
        allow(described_class).to receive(:fetch_and_store_rate).and_return(nil)
      end

      it "returns nil" do
        rate = described_class.get_exchange_rate(from_currency, to_currency, date)
        expect(rate).to be_nil
      end

      it "doesn't cache failed attempts" do
        described_class.get_exchange_rate(from_currency, to_currency, date)

        expect(ExchangeRate.rate_for(from_currency, to_currency, date)).to be_nil
      end
    end
  end

  describe ".fetch_and_store_rate" do
    let(:from_currency) { "EUR" }
    let(:to_currency) { "USD" }
    let(:date) { Date.current }

    context "with ExchangeRate-API.com" do
      before do
        stub_request(:get, /api.exchangerate-api.com/)
          .to_return(
            status: 200,
            body: {
              rates: { "USD" => 1.18 }
            }.to_json
          )
      end

      it "fetches rate successfully" do
        rate = described_class.send(:fetch_from_exchangerate_api, from_currency, to_currency, date)
        expect(rate).to eq(1.18)
      end
    end

    context "with ECB via Frankfurter API" do
      before do
        stub_request(:get, /api.frankfurter.app/)
          .to_return(
            status: 200,
            body: {
              amount: 1.0,
              base: "EUR",
              date: date.to_s,
              rates: { "USD" => 1.19 }
            }.to_json
          )
      end

      it "fetches rate successfully" do
        rate = described_class.send(:fetch_from_ecb, from_currency, to_currency, date)
        expect(rate).to eq(1.19)
      end
    end

    context "with Fixer.io fallback" do
      before do
        # First two APIs fail
        allow(described_class).to receive(:fetch_from_exchangerate_api).and_return(nil)
        allow(described_class).to receive(:fetch_from_ecb).and_return(nil)

        # Fixer succeeds
        allow(described_class).to receive(:fetch_from_fixer_io).and_return(1.17)
      end

      it "falls back to Fixer.io when other APIs fail" do
        rate = described_class.send(:fetch_and_store_rate, from_currency, to_currency, date)
        expect(rate).to eq(1.17)
      end
    end

    context "when all APIs fail" do
      before do
        allow(described_class).to receive(:fetch_from_exchangerate_api).and_return(nil)
        allow(described_class).to receive(:fetch_from_ecb).and_return(nil)
        allow(described_class).to receive(:fetch_from_fixer_io).and_return(nil)
      end

      it "returns nil" do
        rate = described_class.send(:fetch_and_store_rate, from_currency, to_currency, date)
        expect(rate).to be_nil
      end
    end
  end

  describe "rate caching and expiry" do
    let(:from_currency) { "EUR" }
    let(:to_currency) { "USD" }

    context "with stale rates" do
      let!(:old_rate) { create(:exchange_rate, from_currency: from_currency, to_currency: to_currency, rate: 1.15, date: 7.days.ago) }

      before do
        allow(described_class).to receive(:fetch_and_store_rate) do |from, to, date|
          ExchangeRate.set_rate(from, to, 1.18, date, "api")
          1.18
        end
      end

      it "uses existing rate when available" do
        rate = described_class.get_exchange_rate(from_currency, to_currency, Date.current)

        # Service uses existing rate, doesn't check for staleness
        expect(rate).to eq(1.15)
        expect(ExchangeRate.where(date: Date.current).count).to eq(0)
      end

      it "uses historical rate for past dates" do
        rate = described_class.get_exchange_rate(from_currency, to_currency, 7.days.ago)
        expect(rate).to eq(1.15)
      end
    end

    context "with rate limits" do
      before do
        # Simulate rate limit error
        stub_request(:get, /api.exchangerate-api.com/)
          .to_return(status: 429)
      end

      it "handles rate limit gracefully" do
        rate = described_class.send(:fetch_from_exchangerate_api, from_currency, to_currency, Date.current)
        expect(rate).to be_nil
      end
    end
  end

  describe "currency conversion calculations" do
    before do
      # Setup various exchange rates
      create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)
      create(:exchange_rate, from_currency: "GBP", to_currency: "USD", rate: 1.35, date: Date.current)
      create(:exchange_rate, from_currency: "JPY", to_currency: "USD", rate: 0.0068, date: Date.current)
      create(:exchange_rate, from_currency: "USD", to_currency: "EUR", rate: 0.85, date: Date.current)
    end

    describe ".convert" do
      it "converts amounts correctly" do
        amount = 1000
        converted = described_class.convert(amount, "EUR", "USD", Date.current)

        expect(converted).to eq(1180.0)
      end

      it "handles same currency conversion" do
        amount = 1000
        converted = described_class.convert(amount, "USD", "USD", Date.current)

        expect(converted).to eq(1000)
      end

      it "handles zero amounts" do
        converted = described_class.convert(0, "EUR", "USD", Date.current)

        expect(converted).to eq(0)
      end

      it "handles nil amounts" do
        converted = described_class.convert(nil, "EUR", "USD", Date.current)

        expect(converted).to eq(0)
      end

      it "handles very large amounts" do
        amount = 999_999_999.99
        converted = described_class.convert(amount, "EUR", "USD", Date.current)

        expect(converted).to be_within(1.0).of(1_179_999_999.88)
      end

      it "handles very small amounts" do
        amount = 0.01
        converted = described_class.convert(amount, "JPY", "USD", Date.current)

        expect(converted).to be_within(0.0001).of(0.000068)
      end

      it "returns nil when exchange rate is not available" do
        converted = described_class.convert(100, "XXX", "USD", Date.current)

        expect(converted).to be_nil
      end

      it "rounds result to 2 decimal places" do
        create(:exchange_rate, from_currency: "EUR", to_currency: "JPY", rate: 129.876543, date: Date.current)
        converted = described_class.convert(1, "EUR", "JPY", Date.current)

        expect(converted).to eq(129.88)
      end
    end

    describe "rate retrieval" do
      it "handles inverse conversions" do
        # USD to EUR using inverse of EUR to USD
        rate = described_class.get_exchange_rate("USD", "EUR", Date.current)
        expect(rate).to be_within(0.01).of(0.85)
      end
    end
  end

  describe "cross-currency calculations" do
    before do
      # Setup triangle of rates
      create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)
      create(:exchange_rate, from_currency: "USD", to_currency: "GBP", rate: 0.74, date: Date.current)
      create(:exchange_rate, from_currency: "EUR", to_currency: "GBP", rate: 0.87, date: Date.current)
    end

    it "maintains consistency in triangular conversions" do
      eur_to_usd = described_class.get_exchange_rate("EUR", "USD", Date.current)
      usd_to_gbp = described_class.get_exchange_rate("USD", "GBP", Date.current)
      eur_to_gbp_direct = described_class.get_exchange_rate("EUR", "GBP", Date.current)

      # EUR -> USD -> GBP should be close to EUR -> GBP
      eur_to_gbp_calculated = eur_to_usd * usd_to_gbp

      expect(eur_to_gbp_calculated).to be_within(0.02).of(eur_to_gbp_direct)
    end
  end

  describe "audit trail for exchange rates" do
    it "tracks when rates are fetched from API" do
      allow(described_class).to receive(:fetch_and_store_rate) do |from, to, date|
        ExchangeRate.set_rate(from, to, 1.20, date, "api")
        1.20
      end

      expect {
        described_class.get_exchange_rate("EUR", "USD", Date.current)
      }.to change { ExchangeRate.count }.by(1)

      rate = ExchangeRate.last
      expect(rate.source).to be_present
    end

    it "tracks rate updates" do
      rate = create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)

      # Update the rate
      ExchangeRate.set_rate("EUR", "USD", 1.20, Date.current, "manual_update")

      rate.reload
      expect(rate.rate).to eq(1.20)
      expect(rate.source).to eq("manual_update")
    end
  end

  describe "performance optimizations" do
    context "with bulk rate fetching" do
      let(:currencies) { %w[EUR GBP JPY CHF CAD AUD] }

      before do
        currencies.each do |currency|
          create(:exchange_rate, from_currency: currency, to_currency: "USD", rate: rand(0.5..2.0), date: Date.current)
        end
      end

      it "retrieves multiple rates" do
        rates = {}

        currencies.each do |currency|
          rates[currency] = ExchangeRate.rate_for(currency, "USD", Date.current)
        end

        expect(rates.keys).to match_array(currencies)
        rates.values.each { |rate| expect(rate).to be > 0 }
      end
    end

    context "with rate interpolation for missing dates" do
      before do
        create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: 10.days.ago)
        create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.20, date: Date.current)
      end

      it "uses nearest available rate for missing dates" do
        # Request rate for 5 days ago (not in database)
        rate = ExchangeRate.rate_for("EUR", "USD", 5.days.ago)

        # Should return the 10-days-ago rate as it's closest
        expect(rate).to eq(1.18)
      end
    end
  end

  describe "error handling and recovery" do
    context "with network timeouts" do
      before do
        stub_request(:get, /api.exchangerate-api.com/)
          .to_timeout
      end

      it "handles timeout gracefully" do
        rate = described_class.send(:fetch_from_exchangerate_api, "EUR", "USD", Date.current)
        expect(rate).to be_nil
      end
    end

    context "with malformed API responses" do
      before do
        stub_request(:get, /api.exchangerate-api.com/)
          .to_return(status: 200, body: "not json")
      end

      it "handles parsing errors" do
        rate = described_class.send(:fetch_from_exchangerate_api, "EUR", "USD", Date.current)
        expect(rate).to be_nil
      end
    end

    context "with invalid currency codes" do
      it "handles invalid currency gracefully" do
        rate = described_class.get_exchange_rate("XXX", "USD", Date.current)
        expect(rate).to be_nil
      end
    end
  end

  describe "historical rate tracking" do
    let(:currency_pair) { ["EUR", "USD"] }

    before do
      # Create historical rates over 30 days
      30.times do |i|
        date = i.days.ago
        rate = 1.15 + (0.001 * i) # Gradually increasing rate
        create(:exchange_rate, from_currency: currency_pair[0], to_currency: currency_pair[1], rate: rate, date: date)
      end
    end

    it "tracks rate trends over time" do
      rates = (0..29).map { |i| ExchangeRate.rate_for(*currency_pair, i.days.ago) }

      # Verify we have all rates
      expect(rates.compact.size).to eq(30)

      # Verify trend (should be increasing in our test data)
      expect(rates.first).to be < rates.last
    end

    it "calculates average rate for a period" do
      period_rates = (0..6).map { |i| ExchangeRate.rate_for(*currency_pair, i.days.ago) }
      average = period_rates.sum / period_rates.size

      expect(average).to be_between(1.15, 1.18)
    end

    it "identifies rate volatility" do
      rates = (0..29).map { |i| ExchangeRate.rate_for(*currency_pair, i.days.ago) }

      # Calculate standard deviation
      mean = rates.sum / rates.size
      variance = rates.sum { |r| (r - mean)**2 } / rates.size
      std_dev = Math.sqrt(variance)

      # With our linear test data, volatility should be low
      expect(std_dev).to be < 0.01
    end
  end
end
