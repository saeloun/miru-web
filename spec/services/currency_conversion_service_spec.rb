# frozen_string_literal: true

require "rails_helper"

RSpec.describe CurrencyConversionService, type: :service do
  describe "#process" do
    context "when currencies are the same" do
      it "returns the original amount" do
        service = described_class.new(amount: 100, from_currency: "USD", to_currency: "USD")
        expect(service.process).to eq(100)
      end

      it "handles case-insensitive currency codes" do
        service = described_class.new(amount: 100, from_currency: "usd", to_currency: "USD")
        expect(service.process).to eq(100)
      end
    end

    context "when rate exists in database" do
      before do
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
      end

      it "uses the database rate for conversion" do
        service = described_class.new(amount: 100, from_currency: "EUR", to_currency: "USD")
        expect(service.process).to eq(108.0)
      end

      it "rounds to 2 decimal places" do
        create(:currency_pair, from_currency: "GBP", to_currency: "USD", rate: 1.27345, active: true)
        service = described_class.new(amount: 100, from_currency: "GBP", to_currency: "USD")
        expect(service.process).to eq(127.35)
      end

      it "handles case-insensitive currency codes" do
        service = described_class.new(amount: 100, from_currency: "eur", to_currency: "usd")
        expect(service.process).to eq(108.0)
      end
    end

    context "when rate does not exist in database" do
      before do
        # Configure Money gem with a test rate
        Money.default_bank.add_rate("EUR", "USD", 1.10)
      end

      it "falls back to Money gem" do
        service = described_class.new(amount: 100, from_currency: "EUR", to_currency: "USD")
        expect(service.process).to eq(110.0)
      end

      it "returns original amount if Money gem rate is unavailable" do
        service = described_class.new(amount: 100, from_currency: "XXX", to_currency: "YYY")
        expect(service.process).to eq(100)
      end

      it "logs a warning when rate is unavailable" do
        allow(Rails.logger).to receive(:warn)
        service = described_class.new(amount: 100, from_currency: "XXX", to_currency: "YYY")
        service.process
        expect(Rails.logger).to have_received(:warn).with(/Exchange rate not available/)
      end
    end

    context "with decimal amounts" do
      before do
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
      end

      it "handles decimal amounts correctly" do
        service = described_class.new(amount: 99.99, from_currency: "EUR", to_currency: "USD")
        expect(service.process).to eq(107.99)
      end

      it "handles very small amounts" do
        service = described_class.new(amount: 0.01, from_currency: "EUR", to_currency: "USD")
        expect(service.process).to eq(0.01)
      end
    end

    context "with inactive currency pairs" do
      before do
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: false)
        Money.default_bank.add_rate("EUR", "USD", 1.10)
      end

      it "does not use inactive pairs and falls back to Money gem" do
        service = described_class.new(amount: 100, from_currency: "EUR", to_currency: "USD")
        expect(service.process).to eq(110.0)
      end
    end
  end
end
