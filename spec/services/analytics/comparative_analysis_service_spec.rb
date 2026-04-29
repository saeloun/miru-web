# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ComparativeAnalysisService do
  describe "#process" do
    let(:company) { create(:company, base_currency: "USD", working_days: "5", working_hours: "40") }
    let(:client) { create(:client, company:) }
    let(:project) { create(:project, client:, billable: true) }
    let(:user) { create(:user, current_workspace: company) }
    let(:from) { Date.new(2026, 4, 1) }
    let(:to) { Date.new(2026, 4, 7) }

    before do
      create(:employment, company:, user:, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
      current_invoice = create(:invoice, company:, client:, issue_date: Date.new(2026, 4, 2), due_date: Date.new(2026, 4, 10), amount: 300, amount_due: 0, amount_paid: 300, base_currency_amount: 300, status: :paid)
      previous_invoice = create(:invoice, company:, client:, issue_date: Date.new(2026, 3, 25), due_date: Date.new(2026, 3, 31), amount: 200, amount_due: 0, amount_paid: 200, base_currency_amount: 200, status: :paid)

      create(:payment, invoice: current_invoice, amount: 300, base_currency_amount: 300, transaction_date: Date.new(2026, 4, 3), status: :paid, transaction_type: :bank_transfer)
      create(:payment, invoice: previous_invoice, amount: 200, base_currency_amount: 200, transaction_date: Date.new(2026, 3, 26), status: :paid, transaction_type: :bank_transfer)

      current_entry = create(:timesheet_entry, user:, project:, duration: 300, work_date: Date.new(2026, 4, 2), bill_status: :unbilled)
      previous_entry = create(:timesheet_entry, user:, project:, duration: 180, work_date: Date.new(2026, 3, 26), bill_status: :unbilled)

      create(:invoice_line_item, invoice: current_invoice, timesheet_entry: current_entry, quantity: 300, rate: 60, date: Date.new(2026, 4, 2))
      create(:invoice_line_item, invoice: previous_invoice, timesheet_entry: previous_entry, quantity: 180, rate: 50, date: Date.new(2026, 3, 26))

      create(:expense, company:, project:, date: Date.new(2026, 4, 4), amount: 120)
      create(:expense, company:, project:, date: Date.new(2026, 3, 27), amount: 80)
    end

    it "returns current-vs-previous metrics" do
      result = described_class.new(company:, from:, to:).process

      expect(result[:current_period]).to eq(from: "2026-04-01", to: "2026-04-07")
      expect(result[:previous_period]).to eq(from: "2026-03-25", to: "2026-03-31")
      expect(result[:metrics]).to include(
        collected_revenue: {
          current: 300.0,
          previous: 200.0,
          change: 100.0,
          change_percentage: 50.0
        },
        invoiced_revenue: {
          current: 300.0,
          previous: 150.0,
          change: 150.0,
          change_percentage: 100.0
        },
        total_expenses: {
          current: 120.0,
          previous: 80.0,
          change: 40.0,
          change_percentage: 50.0
        },
        billable_hours: {
          current: 5.0,
          previous: 3.0,
          change: 2.0,
          change_percentage: 66.67
        },
        utilization_rate: {
          current: 12.5,
          previous: 7.5,
          change: 5.0,
          change_percentage: 66.67
        },
        average_hourly_rate: {
          current: 60.0,
          previous: 50.0,
          change: 10.0,
          change_percentage: 20.0
        }
      )
    end
  end
end
