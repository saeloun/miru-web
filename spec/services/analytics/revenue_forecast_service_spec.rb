# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::RevenueForecastService do
  let(:company) { create(:company, base_currency: "USD") }
  let(:client) { create(:client, company:) }

  describe "#process" do
    before do
      travel_to Time.zone.local(2026, 4, 18, 12, 0, 0)

      create_invoice_and_payment(issue_date: Date.new(2026, 1, 10), amount: 100)
      create_invoice_and_payment(issue_date: Date.new(2026, 2, 10), amount: 200)
      create_invoice_and_payment(issue_date: Date.new(2026, 3, 10), amount: 300)
      create_invoice_and_payment(issue_date: Date.new(2026, 4, 10), amount: 400)

      # Draft invoices should not affect invoiced revenue.
      create(:invoice, company:, client:, issue_date: Date.new(2026, 4, 5), amount: 999, base_currency_amount: 999, status: :draft)

      # Failed payments should not affect collected revenue.
      failed_invoice = create(
        :invoice,
        company:,
        client:,
        issue_date: Date.new(2026, 4, 8),
        due_date: Date.new(2026, 4, 15),
        amount: 500,
        amount_due: 500,
        base_currency_amount: 500,
        status: :sent
      )
      create(
        :payment,
        invoice: failed_invoice,
        amount: 500,
        base_currency_amount: 500,
        transaction_date: Date.new(2026, 4, 9),
        status: :failed,
        transaction_type: :bank_transfer
      )
    end

    after { travel_back }

    it "returns 12 months of history with collected and invoiced revenue" do
      result = described_class.new(company:, horizon: 3).process

      expect(result[:currency]).to eq("USD")
      expect(result[:historical_periods].size).to eq(12)
      expect(result[:historical_periods].last(4)).to eq([
        { month: "2026-01-01", label: "Jan 2026", collected_revenue: 100.0, invoiced_revenue: 100.0 },
        { month: "2026-02-01", label: "Feb 2026", collected_revenue: 200.0, invoiced_revenue: 200.0 },
        { month: "2026-03-01", label: "Mar 2026", collected_revenue: 300.0, invoiced_revenue: 300.0 },
        { month: "2026-04-01", label: "Apr 2026", collected_revenue: 400.0, invoiced_revenue: 900.0 }
      ])
    end

    it "builds a moving average forecast for the requested horizon" do
      result = described_class.new(company:, horizon: 6).process

      expect(result[:horizon]).to eq(6)
      expect(result[:moving_average_window]).to eq(3)
      expect(result[:forecast_periods]).to eq([
        { month: "2026-05-01", label: "May 2026", forecast_revenue: 300.0 },
        { month: "2026-06-01", label: "Jun 2026", forecast_revenue: 333.33 },
        { month: "2026-07-01", label: "Jul 2026", forecast_revenue: 344.44 },
        { month: "2026-08-01", label: "Aug 2026", forecast_revenue: 325.93 },
        { month: "2026-09-01", label: "Sep 2026", forecast_revenue: 334.57 },
        { month: "2026-10-01", label: "Oct 2026", forecast_revenue: 334.98 }
      ])
    end

    it "falls back to a 3 month horizon for unsupported values" do
      result = described_class.new(company:, horizon: 9).process

      expect(result[:horizon]).to eq(3)
      expect(result[:forecast_periods].size).to eq(3)
    end
  end

  private

    def create_invoice_and_payment(issue_date:, amount:)
      invoice = create(
        :invoice,
        company:,
        client:,
        issue_date:,
        due_date: issue_date + 15.days,
        amount:,
        amount_due: 0,
        amount_paid: amount,
        base_currency_amount: amount,
        status: :paid
      )

      create(
        :payment,
        invoice:,
        amount:,
        base_currency_amount: amount,
        transaction_date: issue_date,
        status: :paid,
        transaction_type: :bank_transfer
      )
    end
end
