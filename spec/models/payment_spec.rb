# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payment, type: :model do
  describe "validations" do
    let(:payment) { build(:payment) }

    it "belongs to an invoice" do
      expect(payment.invoice).to be_present
    end

    it "requires an invoice" do
      payment.invoice = nil

      expect(payment).not_to be_valid
      expect(payment.errors[:invoice]).to be_present
    end

    it "requires a transaction date" do
      payment.transaction_date = nil

      expect(payment).not_to be_valid
      expect(payment.errors[:transaction_date]).to be_present
    end

    it "requires a transaction type" do
      payment.transaction_type = nil

      expect(payment).not_to be_valid
      expect(payment.errors[:transaction_type]).to be_present
    end

    it "requires a positive amount" do
      payment.amount = 0

      expect(payment).not_to be_valid
      expect(payment.errors[:amount]).to be_present
    end

    it "assigns a status during validation" do
      payment.status = nil
      payment.validate

      expect(payment.status).to be_present
    end
  end

  describe "callbacks" do
    let(:company) { create(:company, base_currency: "USD") }
    let(:client) { create(:client, company:, currency: "USD") }
    let(:invoice) do
      create(:invoice, company:, client:, currency: "USD", amount: 1000, amount_due: 1000, exchange_rate: 1.2)
    end

    it "defaults status to paid when the payment settles the invoice" do
      payment = build(:payment, invoice:, amount: 1000, status: nil, payment_currency: "USD")

      payment.validate

      expect(payment.status).to eq("paid")
    end

    it "defaults status to partially_paid when the payment does not settle the invoice" do
      payment = build(:payment, invoice:, amount: 400, status: nil, payment_currency: "USD")

      payment.validate

      expect(payment.status).to eq("partially_paid")
    end

    it "uses the invoice currency when payment currency is blank" do
      payment = build(:payment, invoice:, amount: 250, payment_currency: nil)

      payment.validate

      expect(payment.payment_currency).to eq("USD")
      expect(payment.base_currency_amount.to_f).to eq(250.0)
      expect(payment.exchange_rate.to_f).to eq(1.0)
    end

    it "falls back to the invoice exchange rate when a conversion rate is unavailable" do
      allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(nil)
      invoice.update!(currency: "EUR", exchange_rate: 1.25)
      payment = build(:payment, invoice:, amount: 200, payment_currency: "EUR", transaction_date: Date.current)

      payment.validate

      expect(payment.exchange_rate.to_f).to eq(1.25)
      expect(payment.base_currency_amount.to_f).to eq(250.0)
      expect(payment.exchange_rate_date).to eq(Date.current)
    end
  end

  describe "#same_currency?" do
    it "returns true when the payment currency matches the company currency" do
      payment = build(:payment)
      payment.payment_currency = payment.company.base_currency

      expect(payment.same_currency?).to eq(true)
    end
  end

  describe "#settles?" do
    it "returns true when the payment amount covers the invoice amount due" do
      invoice = create(:invoice, amount_due: 300)
      payment = build(:payment, invoice:, amount: 300)

      expect(payment.settles?(invoice)).to eq(true)
    end
  end
end
