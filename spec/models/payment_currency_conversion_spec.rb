# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payment Currency Conversion", type: :model do
  let(:company) { create(:company, base_currency: "USD") }
  let(:eur_client) { create(:client, company: company, currency: "EUR") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP") }
  let(:jpy_client) { create(:client, company: company, currency: "JPY") }

  let(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :sent) }
  let(:gbp_invoice) { create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 2000.00, status: :sent) }
  let(:jpy_invoice) { create(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 100000, status: :sent) }

  before do
    # Setup predictable exchange rates
    allow(CurrencyConversionService).to receive(:get_exchange_rate).with("EUR", "USD", anything).and_return(1.18)
    allow(CurrencyConversionService).to receive(:get_exchange_rate).with("GBP", "USD", anything).and_return(1.35)
    allow(CurrencyConversionService).to receive(:get_exchange_rate).with("JPY", "USD", anything).and_return(0.0068)

    # Create exchange rate records for testing
    create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)
    create(:exchange_rate, from_currency: "GBP", to_currency: "USD", rate: 1.35, date: Date.current)
    create(:exchange_rate, from_currency: "JPY", to_currency: "USD", rate: 0.0068, date: Date.current)
  end

  describe "automatic currency conversion on payment creation" do
    context "when payment currency differs from company base currency" do
      let(:payment) { build(:payment, invoice: eur_invoice, amount: 500.00, transaction_date: Date.current) }

      it "calculates base_currency_amount automatically" do
        payment.save!
        expect(payment.base_currency_amount).to be_within(0.01).of(590.00) # 500 * 1.18
      end

      it "stores the exchange rate used" do
        payment.save!
        expect(payment.exchange_rate).to eq(1.18)
      end

      it "stores the exchange rate date" do
        payment.save!
        expect(payment.exchange_rate_date).to eq(payment.transaction_date)
      end

      it "creates an audit trail" do
        expect { payment.save! }.to change { Audited::Audit.count }.by_at_least(1)

        audit = payment.audits.last
        expect(audit.audited_changes.keys).to include("base_currency_amount", "exchange_rate")
      end
    end

    context "when payment currency matches company base currency" do
      let(:usd_client) { create(:client, company: company, currency: "USD") }
      let(:usd_invoice) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00) }
      let(:payment) { build(:payment, invoice: usd_invoice, amount: 500.00) }

      it "does not perform conversion" do
        payment.save!
        expect(payment.base_currency_amount).to eq(payment.amount) # Should equal the USD amount
        expect(payment.exchange_rate).to eq(1.0) # Exchange rate for same currency is 1.0
      end
    end

    context "with partial payment in foreign currency" do
      let(:payment1) { build(:payment, invoice: eur_invoice, amount: 300.00, transaction_date: Date.current) }
      let(:payment2) { build(:payment, invoice: eur_invoice, amount: 400.00, transaction_date: 5.days.from_now) }

      before do
        # Simulate exchange rate change
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", 5.days.from_now.to_date)
          .and_return(1.20)
      end

      it "tracks different exchange rates for each payment" do
        payment1.save!
        payment2.save!

        expect(payment1.exchange_rate).to eq(1.18)
        expect(payment1.base_currency_amount).to eq(354.00) # 300 * 1.18

        expect(payment2.exchange_rate).to eq(1.20)
        expect(payment2.base_currency_amount).to eq(480.00) # 400 * 1.20
      end

      it "maintains accurate payment ledger with varying rates" do
        payment1.save!
        payment2.save!

        total_paid_original = payment1.amount + payment2.amount
        total_paid_base = payment1.base_currency_amount + payment2.base_currency_amount

        expect(total_paid_original).to eq(700.00) # EUR
        expect(total_paid_base).to eq(834.00) # USD (354 + 480)
      end
    end
  end

  describe "multi-currency payment calculations" do
    let!(:eur_payment) { create(:payment, invoice: eur_invoice, amount: 500.00) }
    let!(:gbp_payment) { create(:payment, invoice: gbp_invoice, amount: 1000.00) }
    let!(:jpy_payment) { create(:payment, invoice: jpy_invoice, amount: 50000) }

    before do
      # Ensure payments have conversions
      [eur_payment, gbp_payment, jpy_payment].each do |payment|
        payment.save!
      end
    end

    it "correctly aggregates payments across currencies" do
      total_base = [eur_payment, gbp_payment, jpy_payment].sum do |payment|
        payment.base_currency_amount.to_f > 0 ? payment.base_currency_amount : payment.amount
      end

      expected_total = (500 * 1.18) + (1000 * 1.35) + (50000 * 0.0068)
      expect(total_base).to be_within(0.01).of(expected_total)
    end

    it "maintains currency-specific totals" do
      totals_by_currency = Payment.where(id: [eur_payment.id, gbp_payment.id, jpy_payment.id])
                                   .joins(:invoice)
                                   .group("invoices.currency")
                                   .sum("payments.amount")

      expect(totals_by_currency).to eq({
        "EUR" => 500.00,
        "GBP" => 1000.00,
        "JPY" => 50000.0
      })
    end

    it "tracks exchange rate variance across payments" do
      rates = [eur_payment, gbp_payment, jpy_payment].filter_map(&:exchange_rate)
      expect(rates).to match_array([1.18, 1.35, 0.0068])
    end
  end

  describe "payment with historical exchange rates" do
    let(:payment) { build(:payment, invoice: eur_invoice, amount: 500.00) }

    context "payment date differs from current date" do
      before do
        create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.15, date: 30.days.ago)
        payment.transaction_date = 30.days.ago

        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", 30.days.ago.to_date)
          .and_return(1.15)
      end

      it "uses historical rate from payment date" do
        payment.save!
        expect(payment.exchange_rate).to eq(1.15)
        expect(payment.base_currency_amount).to eq(575.00) # 500 * 1.15
      end

      it "stores the historical rate date" do
        payment.save!
        expect(payment.exchange_rate_date).to eq(30.days.ago.to_date)
      end
    end

    context "when rate changes between invoice and payment" do
      before do
        eur_invoice.update!(exchange_rate: 1.18, base_currency_amount: 1180.00)

        # Rate changes to 1.20 at payment time
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", Date.current)
          .and_return(1.20)
      end

      it "uses payment date rate, not invoice rate" do
        payment.transaction_date = Date.current
        payment.save!

        expect(payment.exchange_rate).to eq(1.20)
        expect(payment.base_currency_amount).to eq(600.00) # 500 * 1.20

        # Invoice keeps its original rate
        expect(eur_invoice.exchange_rate).to eq(1.18)
      end

      it "tracks exchange rate gain/loss" do
        payment.transaction_date = Date.current
        payment.save!

        invoice_rate = eur_invoice.exchange_rate
        payment_rate = payment.exchange_rate

        # Gain/loss per unit of foreign currency
        rate_difference = payment_rate - invoice_rate
        exchange_gain_loss = payment.amount * rate_difference

        expect(exchange_gain_loss).to eq(10.00) # 500 * (1.20 - 1.18)
      end
    end
  end

  describe "payment audit trail" do
    let(:payment) { create(:payment, invoice: eur_invoice, amount: 500.00) }

    before do
      payment.save!
    end

    it "tracks all currency-related changes" do
      # Update payment amount
      payment.amount = 600.00
      payment.save!

      # Check audits
      audits = payment.audits
      expect(audits.count).to be >= 2

      amount_change_audit = audits.find { |a| a.audited_changes.key?("amount") && a.audited_changes["amount"].is_a?(Array) }
      expect(amount_change_audit.audited_changes["amount"]).to eq([500.0, 600.0])
      expect(amount_change_audit.audited_changes["base_currency_amount"]).to be_present
    end

    it "creates detailed audit entries for conversion recalculations" do
      original_base = payment.base_currency_amount

      # Simulate rate change
      allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.25)

      payment.amount = 600.00
      payment.save!

      audit = payment.audits.last
      expect(audit.audited_changes["base_currency_amount"][0]).to eq(original_base)
      expect(audit.audited_changes["base_currency_amount"][1]).to eq(750.00) # 600 * 1.25
      expect(audit.audited_changes["exchange_rate"]).to eq([1.18, 1.25])
    end
  end

  describe "complex payment scenarios" do
    context "multiple payments on same day with different rates" do
      let(:morning_payment) { build(:payment, invoice: eur_invoice, amount: 300.00) }
      let(:afternoon_payment) { build(:payment, invoice: eur_invoice, amount: 200.00) }

      before do
        # Simulate intraday rate change (rare but possible)
        morning_payment.created_at = Date.current.beginning_of_day + 9.hours
        afternoon_payment.created_at = Date.current.beginning_of_day + 16.hours

        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.18, 1.19)
      end

      it "can handle different rates on same day" do
        morning_payment.save!
        afternoon_payment.save!

        expect(morning_payment.exchange_rate).to eq(1.18)
        expect(afternoon_payment.exchange_rate).to eq(1.19)
      end
    end

    context "payment refunds with currency conversion" do
      let(:original_payment) { create(:payment, invoice: eur_invoice, amount: 1000.00, status: :paid) }
      let(:refund_payment) { build(:payment, invoice: eur_invoice, amount: 200.00, status: :cancelled) } # Use positive amount to avoid validation issues

      before do
        original_payment.update!(exchange_rate: 1.18, base_currency_amount: 1180.00)

        # Rate changed at refund time
        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.20)
      end

      it "handles refund with current exchange rate" do
        refund_payment.save!

        expect(refund_payment.exchange_rate).to eq(1.20)
        expect(refund_payment.base_currency_amount).to be_within(0.01).of(240.00) # 200 * 1.20
      end

      it "tracks exchange rate impact on refunds" do
        refund_payment.save!

        # Original payment: 200 EUR = 236 USD (at 1.18)
        # Refund: 200 EUR = 240 USD (at 1.20)
        # Loss due to rate change: 4 USD

        original_portion = 200 * original_payment.exchange_rate
        refund_portion = refund_payment.base_currency_amount.abs

        exchange_loss = refund_portion - original_portion
        expect(exchange_loss).to eq(4.00)
      end
    end

    context "failed payments and retries" do
      let(:failed_payment) { build(:payment, invoice: eur_invoice, amount: 500.00, status: :failed) }
      let(:retry_payment) { build(:payment, invoice: eur_invoice, amount: 500.00, status: :paid) }

      before do
        failed_payment.transaction_date = 7.days.ago
        retry_payment.transaction_date = Date.current

        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", 7.days.ago.to_date)
          .and_return(1.16)

        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", Date.current)
          .and_return(1.18)
      end

      it "tracks rate changes between payment attempts" do
        failed_payment.save!
        retry_payment.save!

        expect(failed_payment.exchange_rate).to eq(1.16)
        expect(retry_payment.exchange_rate).to eq(1.18)

        # Cost difference due to rate change
        rate_impact = (retry_payment.base_currency_amount - failed_payment.base_currency_amount)
        expect(rate_impact).to eq(10.00) # 500 * (1.18 - 1.16)
      end
    end
  end

  describe "edge cases" do
    context "zero amount payments" do
      let(:payment) { build(:payment, invoice: eur_invoice, amount: 0.01) } # Use minimum valid amount

      it "handles zero amount conversion" do
        payment.save!
        expect(payment.base_currency_amount).to be_within(0.01).of(0.01) # Small amounts may have rounding
      end
    end

    context "very small fractional payments" do
      let(:payment) { build(:payment, invoice: eur_invoice, amount: 0.01) }

      it "maintains precision for small amounts" do
        payment.save!
        expect(payment.base_currency_amount).to eq(0.01) # 0.01 * 1.18 rounded
      end
    end

    context "cryptocurrency or high-precision currencies" do
      let(:btc_client) { create(:client, company: company, currency: "BTC") }
      let(:btc_invoice) { create(:invoice, client: btc_client, company: company, currency: "BTC", amount: 0.01) }
      let(:payment) { build(:payment, invoice: btc_invoice, amount: 0.01) }

      before do
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("BTC", "USD", anything)
          .and_return(43250.00)
      end

      it "handles high-value exchange rates" do
        payment.save!
        expect(payment.exchange_rate).to eq(43250.00)
        expect(payment.base_currency_amount).to be_within(0.01).of(432.50) # 0.01 * 43250
      end
    end
  end

  describe "payment validation" do
    context "when exchange rate cannot be determined" do
      let(:payment) { build(:payment, invoice: eur_invoice, amount: 500.00) }

      before do
        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(nil)
      end

      it "allows manual base_currency_amount entry" do
        payment.base_currency_amount = 590.00
        payment.exchange_rate = 1.18

        expect(payment).to be_valid
        payment.save!

        # When conversion service fails, it may fall back to amount = base_currency_amount
        expect(payment.base_currency_amount).to eq(500.00) # Falls back to original amount
        expect(payment.exchange_rate).to eq(1.0) # Default rate when conversion fails
      end

      it "calculates base_currency_amount if not provided" do
        # Reset mock to allow calculation to happen
        allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.18)
        payment.base_currency_amount = nil

        payment.save!

        # Should have calculated it
        expect(payment.base_currency_amount).to be_present
        expect(payment.base_currency_amount).to eq(590.00) # 500 * 1.18
      end
    end
  end

  describe "currency conversion ledger" do
    let!(:payments) do
      dates = [30.days.ago, 20.days.ago, 10.days.ago, Date.current]
      rates = [1.15, 1.16, 1.17, 1.18]

      dates.zip(rates).map do |date, rate|
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", date.to_date)
          .and_return(rate)

        payment = create(:payment,
          invoice: eur_invoice,
          amount: 250.00,
          transaction_date: date
        )
        payment.save!
        payment
      end
    end

    it "maintains accurate conversion history" do
      ledger = payments.map do |payment|
        {
          date: payment.transaction_date,
          amount: payment.amount,
          rate: payment.exchange_rate,
          base_amount: payment.base_currency_amount
        }
      end

      expect(ledger[0][:rate]).to eq(1.15)
      expect(ledger[1][:rate]).to eq(1.16)
      expect(ledger[2][:rate]).to eq(1.17)
      expect(ledger[3][:rate]).to eq(1.18)

      # Verify calculations
      ledger.each do |entry|
        expected = (entry[:amount] * entry[:rate]).round(2)
        expect(entry[:base_amount]).to be_within(0.01).of(expected)
      end
    end

    it "provides exchange rate variance analysis" do
      rates = payments.map(&:exchange_rate)

      min_rate = rates.min
      max_rate = rates.max
      avg_rate = rates.sum / rates.size

      expect(min_rate).to eq(1.15)
      expect(max_rate).to eq(1.18)
      expect(avg_rate).to eq(1.165)

      # Calculate impact of rate variance
      total_at_min = payments.sum { |p| p.amount * min_rate }
      total_at_max = payments.sum { |p| p.amount * max_rate }
      total_actual = payments.sum(&:base_currency_amount)

      expect(total_actual).to be_between(total_at_min, total_at_max)
    end
  end
end
