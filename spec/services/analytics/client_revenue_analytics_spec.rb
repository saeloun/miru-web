# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ClientRevenueAnalytics do
  describe "#process" do
    let(:company) { create(:company, base_currency: "USD") }
    let(:client_alpha) { create(:client, company:, name: "Alpha Corp") }
    let(:client_beta) { create(:client, company:, name: "Beta Labs") }
    let(:from) { Date.new(2026, 1, 1) }
    let(:to) { Date.new(2026, 2, 28) }

    before do
      alpha_invoice_one = create(:invoice, company:, client: client_alpha, issue_date: Date.new(2026, 1, 1), due_date: Date.new(2026, 1, 31), amount: 150, amount_due: 0, amount_paid: 150, base_currency_amount: 150, status: :paid)
      alpha_invoice_two = create(:invoice, company:, client: client_alpha, issue_date: Date.new(2026, 2, 1), due_date: Date.new(2026, 2, 28), amount: 200, amount_due: 0, amount_paid: 200, base_currency_amount: 200, status: :paid)
      beta_invoice = create(:invoice, company:, client: client_beta, issue_date: Date.new(2026, 2, 10), due_date: Date.new(2026, 2, 28), amount: 300, amount_due: 300, amount_paid: 0, base_currency_amount: 300, status: :sent)

      create(:payment, invoice: alpha_invoice_one, amount: 150, base_currency_amount: 150, transaction_date: Date.new(2026, 1, 10), status: :paid, transaction_type: :bank_transfer)
      create(:payment, invoice: alpha_invoice_two, amount: 200, base_currency_amount: 200, transaction_date: Date.new(2026, 2, 20), status: :paid, transaction_type: :bank_transfer)
      create(:payment, invoice: beta_invoice, amount: 300, base_currency_amount: 300, transaction_date: Date.new(2026, 2, 25), status: :failed, transaction_type: :bank_transfer)
    end

    it "returns top clients, invoice metrics, payment frequency and trends" do
      result = described_class.new(company:, from:, to:).process

      expect(result[:summary]).to include(
        client_count: 2,
        total_revenue: 650.0,
        total_collected_revenue: 350.0,
        average_invoice_amount: 216.67,
        average_payment_frequency_days: 20.5,
        average_payment_cycle_days: 7.0,
        payment_count: 2
      )

      alpha = result[:clients].find { |entry| entry[:client_id] == client_alpha.id }
      beta = result[:clients].find { |entry| entry[:client_id] == client_beta.id }

      expect(result[:top_clients].first[:client_id]).to eq(client_alpha.id)
      expect(alpha).to include(
        client_name: "Alpha Corp",
        total_revenue: 350.0,
        collected_revenue: 350.0,
        invoice_count: 2,
        payment_count: 2,
        average_invoice_amount: 175.0,
        payment_frequency_days: 41.0,
        payment_cycle_days: 14.0,
        trend_direction: "up"
      )
      expect(beta).to include(
        total_revenue: 300.0,
        collected_revenue: 0.0,
        payment_count: 0,
        payment_frequency_days: 0.0,
        payment_cycle_days: 0.0,
        trend_direction: "up"
      )
      expect(alpha[:monthly_trend].pluck(:revenue)).to eq([150.0, 200.0])
    end

    it "supports filtering to a subset of clients" do
      result = described_class.new(company:, from:, to:, client_ids: [client_beta.id]).process

      expect(result[:clients].size).to eq(1)
      expect(result[:clients].first[:client_id]).to eq(client_beta.id)
    end
  end
end
