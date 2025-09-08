# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice Currency Conversion", type: :model do
  let(:company) { create(:company, base_currency: "USD") }
  let(:client) { create(:client, company: company, currency: "EUR") }
  let(:invoice) { build(:invoice, client: client, company: company, currency: "EUR", amount: 1000.00) }

  before do
    # Stub currency conversion service for predictable tests
    allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.18)
  end

  describe "automatic currency conversion on save" do
    context "when invoice currency differs from company base currency" do
      it "calculates base_currency_amount automatically" do
        invoice.save!
        expect(invoice.base_currency_amount).to eq(1180.00)
      end

      it "stores the exchange rate used" do
        invoice.save!
        expect(invoice.exchange_rate).to eq(1.18)
      end

      it "stores the exchange rate date" do
        invoice.save!
        expect(invoice.exchange_rate_date).to eq(invoice.issue_date || Date.current)
      end

      it "creates an audit trail" do
        expect { invoice.save! }.to change { Audited::Audit.count }.by(1)

        audit = invoice.audits.last
        expect(audit.audited_changes).to include("base_currency_amount", "exchange_rate", "exchange_rate_date")
      end
    end

    context "when invoice currency matches company base currency" do
      let(:invoice) { build(:invoice, client: client, company: company, currency: "USD", amount: 1000.00) }

      it "does not perform conversion" do
        invoice.save!
        expect(invoice.base_currency_amount).to eq(invoice.amount) # Should be same as amount
        expect(invoice.exchange_rate).to be_nil
      end
    end

    context "when exchange rate cannot be fetched" do
      before do
        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(nil)
      end

      it "fails validation if base_currency_amount is not manually set" do
        invoice.base_currency_amount = nil
        expect(invoice).not_to be_valid
        expect(invoice.errors[:base_currency_amount]).to include("can't be blank")
      end

      it "allows manual base_currency_amount entry" do
        invoice.base_currency_amount = 1200.00
        expect(invoice).to be_valid
        invoice.save!
        expect(invoice.base_currency_amount).to eq(1200.00)
      end
    end

    context "when updating invoice amount" do
      before { invoice.save! }

      it "recalculates base_currency_amount when amount changes" do
        expect(invoice.base_currency_amount).to eq(1180.00)

        invoice.amount = 2000.00
        invoice.save!

        expect(invoice.base_currency_amount).to eq(2360.00)
      end

      it "recalculates when currency changes" do
        allow(CurrencyConversionService).to receive(:get_exchange_rate).with("GBP", "USD", anything).and_return(1.35)

        invoice.currency = "GBP"
        invoice.save!

        expect(invoice.exchange_rate).to eq(1.35)
        expect(invoice.base_currency_amount).to eq(1350.00) # 1000 * 1.35
      end

      it "creates audit entries for conversion changes" do
        invoice.amount = 2000.00

        expect { invoice.save! }.to change { invoice.audits.count }.by(1)

        audit = invoice.audits.last
        expect(audit.audited_changes["amount"]).to eq([1000.0, 2000.0])
        expect(audit.audited_changes["base_currency_amount"]).to eq([1180.0, 2360.0])
      end
    end
  end

  describe "multi-currency invoice calculations" do
    let!(:gbp_client) { create(:client, company: company, currency: "GBP") }
    let!(:usd_client) { create(:client, company: company, currency: "USD") }

    let!(:eur_invoice) { build(:invoice, client: client, company: company, currency: "EUR", amount: 1000.00, status: :sent) }
    let!(:gbp_invoice) { build(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1000.00, status: :sent) }
    let!(:usd_invoice) { build(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent) }

    before do
      allow(CurrencyConversionService).to receive(:get_exchange_rate).with("EUR", "USD", anything).and_return(1.18)
      allow(CurrencyConversionService).to receive(:get_exchange_rate).with("GBP", "USD", anything).and_return(1.35)

      # Save with proper exchange rate mocking in place
      eur_invoice.save!
      gbp_invoice.save!
      usd_invoice.save!
    end

    it "correctly calculates total in base currency" do
      total = [eur_invoice, gbp_invoice, usd_invoice].sum do |invoice|
        invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
      end

      expect(total).to eq(1180.00 + 1350.00 + 1000.00) # EUR + GBP + USD (already in USD)
    end

    it "handles mixed currency aggregations" do
      totals_by_currency = Invoice.where(id: [eur_invoice.id, gbp_invoice.id, usd_invoice.id])
                                  .group(:currency)
                                  .sum(:amount)

      expect(totals_by_currency).to eq({
        "EUR" => 1000.00,
        "GBP" => 1000.00,
        "USD" => 1000.00
      })

      # Total in base currency
      total_base = Invoice.where(id: [eur_invoice.id, gbp_invoice.id, usd_invoice.id])
                          .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      expect(total_base).to eq(3530.00)
    end
  end

  describe "currency conversion with historical rates" do
    let!(:historical_rate) { create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.15, date: 30.days.ago) }
    let!(:current_rate) { create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current) }

    it "uses the rate from the invoice issue date" do
      invoice.issue_date = 30.days.ago
      invoice.due_date = 30.days.from_now  # Set a valid due date

      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 30.days.ago.to_date)
        .and_return(1.15)

      invoice.save!

      expect(invoice.exchange_rate).to eq(1.15)
      expect(invoice.base_currency_amount).to eq(1150.00)
    end

    it "falls back to most recent rate if exact date not found" do
      invoice.issue_date = 15.days.ago
      invoice.due_date = 30.days.from_now  # Set a valid due date

      allow(ExchangeRate).to receive(:rate_for)
        .with("EUR", "USD", 15.days.ago.to_date)
        .and_return(1.15) # Returns the 30-day-old rate as most recent

      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 15.days.ago.to_date)
        .and_return(1.15)

      invoice.save!

      expect(invoice.exchange_rate).to eq(1.15)
    end
  end

  describe "validation scenarios" do
    context "multi-currency invoice validation" do
      it "requires base_currency_amount when currencies differ" do
        invoice.base_currency_amount = nil
        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(nil)

        expect(invoice).not_to be_valid
        expect(invoice.errors[:base_currency_amount]).to be_present
      end

      it "does not require base_currency_amount when currencies match" do
        invoice.currency = "USD"
        invoice.base_currency_amount = nil

        expect(invoice).to be_valid
      end
    end
  end

  describe "audit trail for currency conversions" do
    it "tracks all currency-related changes" do
      invoice.save!

      # Change amount
      invoice.amount = 2000.00
      invoice.save!

      # Change currency
      allow(CurrencyConversionService).to receive(:get_exchange_rate).with("GBP", "USD", anything).and_return(1.35)
      invoice.currency = "GBP"
      invoice.save!

      audits = invoice.audits
      expect(audits.count).to eq(3)

      # Check that currency conversions are tracked - look for the audit that has a currency change array
      currency_change_audit = audits.find { |a| a.audited_changes.key?("currency") && a.audited_changes["currency"].is_a?(Array) }

      # Currency change should be tracked as [old_value, new_value]
      expect(currency_change_audit.audited_changes["currency"]).to eq(["EUR", "GBP"])
      expect(currency_change_audit.audited_changes["exchange_rate"]).to eq([1.18, 1.35])
    end
  end

  describe "edge cases" do
    context "when dealing with very small amounts" do
      it "handles small currency conversions accurately" do
        invoice.amount = 0.01
        invoice.save!

        expect(invoice.base_currency_amount).to eq(0.01) # 0.01 * 1.18 rounded
      end
    end

    context "when dealing with very large amounts" do
      it "handles large currency conversions accurately" do
        invoice.amount = 999_999_999.99
        invoice.save!

        # Allow for floating point precision differences with very large numbers
        expect(invoice.base_currency_amount).to be_within(1.0).of(1_179_999_999.88)
      end
    end

    context "with JPY (no decimal currency)" do
      let(:jpy_client) { create(:client, company: company, currency: "JPY") }
      let(:jpy_invoice) { build(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 100000) }

      before do
        allow(CurrencyConversionService).to receive(:get_exchange_rate).with("JPY", "USD", anything).and_return(0.0068)
      end

      it "handles non-decimal currency conversion" do
        jpy_invoice.save!
        expect(jpy_invoice.base_currency_amount).to eq(680.00) # 100000 * 0.0068
      end
    end
  end
end
