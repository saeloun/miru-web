# frozen_string_literal: true

# == Schema Information
#
# Table name: exchange_rates
#
#  id            :bigint           not null, primary key
#  date          :date             not null
#  from_currency :string           not null
#  rate          :decimal(18, 10)  not null
#  source        :string           default("manual")
#  to_currency   :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
# Indexes
#
#  idx_exchange_rates_unique                              (from_currency,to_currency,date) UNIQUE
#  index_exchange_rates_on_date                           (date)
#  index_exchange_rates_on_from_currency_and_to_currency  (from_currency,to_currency)
#
require "rails_helper"

RSpec.describe ExchangeRate, type: :model do
  describe "validations" do
    it { should validate_presence_of(:from_currency) }
    it { should validate_presence_of(:to_currency) }
    it { should validate_presence_of(:rate) }
    it { should validate_presence_of(:date) }
    it { should validate_numericality_of(:rate).is_greater_than(0) }

    it "validates uniqueness of date scoped to from_currency and to_currency" do
      create(:exchange_rate, from_currency: "EUR", to_currency: "USD", date: Date.current)
      duplicate = build(:exchange_rate, from_currency: "EUR", to_currency: "USD", date: Date.current)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:date]).to include("has already been taken")
    end
  end

  describe ".rate_for" do
    let!(:eur_usd_today) { create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current) }
    let!(:eur_usd_yesterday) { create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.17, date: 1.day.ago) }
    let!(:gbp_usd_today) { create(:exchange_rate, from_currency: "GBP", to_currency: "USD", rate: 1.35, date: Date.current) }

    context "when same currency" do
      it "returns 1.0" do
        expect(ExchangeRate.rate_for("USD", "USD")).to eq(1.0)
      end
    end

    context "when exact date match exists" do
      it "returns the rate for that date" do
        expect(ExchangeRate.rate_for("EUR", "USD", Date.current)).to eq(1.18)
      end
    end

    context "when no exact date match" do
      it "returns the most recent rate before the date" do
        expect(ExchangeRate.rate_for("EUR", "USD", 2.days.from_now)).to eq(1.18)
      end
    end

    context "when only reverse rate exists" do
      it "returns the inverse of the reverse rate" do
        expect(ExchangeRate.rate_for("USD", "EUR", Date.current)).to be_within(0.001).of(1.0 / 1.18)
      end
    end

    context "when no rate exists" do
      it "returns nil" do
        expect(ExchangeRate.rate_for("JPY", "INR", Date.current)).to be_nil
      end
    end
  end

  describe ".set_rate" do
    context "when rate doesn't exist" do
      it "creates a new rate" do
        expect {
          ExchangeRate.set_rate("EUR", "USD", 1.20, Date.current, "api")
        }.to change { ExchangeRate.count }.by(1)

        rate = ExchangeRate.last
        expect(rate.from_currency).to eq("EUR")
        expect(rate.to_currency).to eq("USD")
        expect(rate.rate).to eq(1.20)
        expect(rate.source).to eq("api")
      end
    end

    context "when rate already exists" do
      let!(:existing_rate) { create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current) }

      it "updates the existing rate" do
        expect {
          ExchangeRate.set_rate("EUR", "USD", 1.20, Date.current, "manual")
        }.not_to change { ExchangeRate.count }

        existing_rate.reload
        expect(existing_rate.rate).to eq(1.20)
        expect(existing_rate.source).to eq("manual")
      end
    end
  end
end
