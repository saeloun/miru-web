# frozen_string_literal: true

require "rails_helper"

RSpec.describe CurrencyPair, type: :model do
  subject { build(:currency_pair) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:from_currency) }
    it { is_expected.to validate_presence_of(:to_currency) }
    it { is_expected.to validate_uniqueness_of(:from_currency).scoped_to(:to_currency) }
    it { is_expected.to validate_numericality_of(:rate).is_greater_than(0).allow_nil }
  end

  describe "Scopes" do
    let!(:active_pair) { create(:currency_pair, active: true) }
    let!(:inactive_pair) { create(:currency_pair, from_currency: "GBP", to_currency: "JPY", active: false) }

    describe ".active" do
      it "returns only active currency pairs" do
        expect(CurrencyPair.active).to include(active_pair)
        expect(CurrencyPair.active).not_to include(inactive_pair)
      end
    end
  end

  describe ".update_rate" do
    context "when currency pair exists" do
      let!(:pair) { create(:currency_pair, from_currency: "USD", to_currency: "EUR", rate: 0.85) }

      it "updates the existing rate" do
        CurrencyPair.update_rate("USD", "EUR", 0.90)
        expect(pair.reload.rate).to eq(0.90)
      end

      it "updates the last_updated_at timestamp" do
        old_time = pair.last_updated_at
        sleep 0.01 # Ensure time difference
        CurrencyPair.update_rate("USD", "EUR", 0.90)
        expect(pair.reload.last_updated_at).to be > old_time
      end
    end

    context "when currency pair does not exist" do
      it "creates a new currency pair" do
        expect {
          CurrencyPair.update_rate("USD", "JPY", 110.50)
        }.to change(CurrencyPair, :count).by(1)
      end

      it "sets the rate correctly" do
        CurrencyPair.update_rate("USD", "JPY", 110.50)
        pair = CurrencyPair.find_by(from_currency: "USD", to_currency: "JPY")
        expect(pair.rate).to eq(110.50)
      end
    end

    it "handles case-insensitive currency codes" do
      CurrencyPair.update_rate("usd", "eur", 0.90)
      pair = CurrencyPair.find_by(from_currency: "USD", to_currency: "EUR")
      expect(pair).to be_present
      expect(pair.rate).to eq(0.90)
    end
  end

  describe ".get_rate" do
    let!(:pair) { create(:currency_pair, from_currency: "USD", to_currency: "EUR", rate: 0.85) }

    it "returns the rate for an existing active pair" do
      expect(CurrencyPair.get_rate("USD", "EUR")).to eq(0.85)
    end

    it "returns nil for non-existent pair" do
      expect(CurrencyPair.get_rate("USD", "JPY")).to be_nil
    end

    it "returns nil for inactive pair" do
      pair.update(active: false)
      expect(CurrencyPair.get_rate("USD", "EUR")).to be_nil
    end

    it "handles case-insensitive currency codes" do
      expect(CurrencyPair.get_rate("usd", "eur")).to eq(0.85)
    end
  end

  describe ".configured_currencies" do
    before do
      create(:currency_pair, from_currency: "USD", to_currency: "EUR")
      create(:currency_pair, from_currency: "USD", to_currency: "GBP")
      create(:currency_pair, from_currency: "EUR", to_currency: "GBP")
      create(:currency_pair, from_currency: "JPY", to_currency: "USD", active: false)
    end

    it "returns unique list of all currencies from active pairs" do
      currencies = CurrencyPair.configured_currencies
      expect(currencies).to contain_exactly("USD", "EUR", "GBP")
    end

    it "does not include currencies from inactive pairs" do
      currencies = CurrencyPair.configured_currencies
      expect(currencies).not_to include("JPY")
    end
  end
end
