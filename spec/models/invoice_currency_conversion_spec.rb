# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoice, type: :model do
  describe "currency conversion" do
    let(:company) { create(:company, base_currency: "USD") }
    let(:client) { create(:client, company:, currency: "EUR") }

    describe "callbacks" do
      it { is_expected.to callback(:calculate_base_currency_amount).before(:validation) }
    end

    describe "#calculate_base_currency_amount" do
      context "when invoice currency matches company base currency" do
        let(:invoice) { build(:invoice, company:, client:, currency: "USD", amount: 100) }

        it "does not calculate base_currency_amount" do
          invoice.valid?
          expect(invoice.base_currency_amount).to eq(100)
        end
      end

      context "when invoice currency differs from company base currency" do
        before do
          create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
        end

        let(:invoice) { build(:invoice, company:, client:, currency: "EUR", amount: 100) }

        it "calculates base_currency_amount automatically" do
          invoice.valid?
          expect(invoice.base_currency_amount).to eq(108.0)
        end

        it "uses CurrencyConversionService" do
          allow(CurrencyConversionService).to receive(:new).with(
            amount: 100,
            from_currency: "EUR",
            to_currency: "USD"
          ).and_call_original

          invoice.valid?

          expect(CurrencyConversionService).to have_received(:new).with(
            amount: 100,
            from_currency: "EUR",
            to_currency: "USD"
          )
        end

        it "updates base_currency_amount when amount changes" do
          invoice.save!
          invoice.amount = 200
          invoice.valid?
          expect(invoice.base_currency_amount).to eq(216.0)
        end

        it "updates base_currency_amount when currency changes" do
          create(:currency_pair, from_currency: "GBP", to_currency: "USD", rate: 1.27, active: true)
          invoice.save!
          invoice.currency = "GBP"
          invoice.valid?
          expect(invoice.base_currency_amount).to eq(127.0)
        end
      end

      context "when amount is nil" do
        let(:invoice) { build(:invoice, company:, client:, currency: "EUR", amount: nil) }

        it "does not calculate base_currency_amount" do
          expect(CurrencyConversionService).not_to receive(:new)
          invoice.valid?
        end
      end

      context "when currency is blank" do
        let(:invoice) { build(:invoice, company:, client:, currency: nil, amount: 100) }

        it "does not calculate base_currency_amount" do
          expect(CurrencyConversionService).not_to receive(:new)
          invoice.valid?
        end
      end

      context "when company is nil" do
        let(:invoice) { build(:invoice, company: nil, client:, currency: "EUR", amount: 100) }

        it "does not calculate base_currency_amount" do
          expect(CurrencyConversionService).not_to receive(:new)
          invoice.valid?
        end
      end
    end

    describe "validation" do
      context "when currency differs from base currency" do
        before do
          create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
        end

        it "requires base_currency_amount" do
          invoice = build(:invoice, company:, client:, currency: "EUR", amount: 100)
          invoice.base_currency_amount = nil
          invoice.valid?
          # base_currency_amount should be calculated automatically
          expect(invoice.base_currency_amount).not_to be_nil
        end

        it "allows invoice to be saved with foreign currency" do
          invoice = build(:invoice, company:, client:, currency: "EUR", amount: 600)
          expect(invoice).to be_valid
          expect { invoice.save! }.not_to raise_error
        end
      end

      context "when currency matches base currency" do
        it "does not require base_currency_amount" do
          invoice = build(:invoice, company:, client:, currency: "USD", amount: 100)
          invoice.base_currency_amount = nil
          expect(invoice).to be_valid
        end
      end
    end

    describe "#same_currency?" do
      let(:invoice) { build(:invoice, company:, client:) }

      context "when invoice currency is set" do
        it "returns true when currencies match" do
          invoice.currency = "USD"
          expect(invoice.send(:same_currency?)).to be true
        end

        it "returns false when currencies differ" do
          invoice.currency = "EUR"
          expect(invoice.send(:same_currency?)).to be false
        end
      end

      context "when invoice currency is not set" do
        it "uses client currency" do
          invoice.currency = nil
          client.update(currency: "USD")
          expect(invoice.send(:same_currency?)).to be true
        end

        it "returns false when client currency differs" do
          invoice.currency = nil
          client.update(currency: "EUR")
          expect(invoice.send(:same_currency?)).to be false
        end
      end
    end

    describe "integration test" do
      before do
        create(:currency_pair, from_currency: "EUR", to_currency: "USD", rate: 1.08, active: true)
      end

      it "creates invoice with automatic currency conversion" do
        invoice = create(
          :invoice,
          company:,
          client:,
          currency: "EUR",
          amount: 600,
          issue_date: Date.today,
          due_date: Date.today + 30.days
        )

        expect(invoice.persisted?).to be true
        expect(invoice.amount).to eq(600)
        expect(invoice.currency).to eq("EUR")
        expect(invoice.base_currency_amount).to eq(648.0)
      end

      it "handles invoice updates with currency changes" do
        invoice = create(
          :invoice,
          company:,
          client:,
          currency: "EUR",
          amount: 600
        )

        create(:currency_pair, from_currency: "GBP", to_currency: "USD", rate: 1.27, active: true)

        invoice.update!(currency: "GBP", amount: 500)

        expect(invoice.currency).to eq("GBP")
        expect(invoice.amount).to eq(500)
        expect(invoice.base_currency_amount).to eq(635.0)
      end
    end
  end
end
