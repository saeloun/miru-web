# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::TeamProductivityAnalytics do
  describe "#process" do
    let(:company) { create(:company, base_currency: "USD", working_days: "5", working_hours: "40") }
    let(:client) { create(:client, company:) }
    let(:billable_project) { create(:project, client:, billable: true) }
    let(:internal_project) { create(:project, client:, billable: false) }
    let(:first_user) { create(:user, current_workspace: company) }
    let(:second_user) { create(:user, current_workspace: company) }
    let(:period_start) { Date.new(2026, 4, 6) }
    let(:period_end) { Date.new(2026, 4, 10) }

    before do
      create(:employment, company:, user: first_user, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
      create(:employment, company:, user: second_user, joined_at: Date.new(2026, 1, 1), resigned_at: nil)

      billable_entry_one = create(
        :timesheet_entry,
        user: first_user,
        project: billable_project,
        duration: 240,
        work_date: period_start,
        bill_status: :unbilled
      )
      billable_entry_two = create(
        :timesheet_entry,
        user: first_user,
        project: billable_project,
        duration: 120,
        work_date: period_start + 1.day,
        bill_status: :unbilled
      )
      create(
        :timesheet_entry,
        user: first_user,
        project: internal_project,
        duration: 120,
        work_date: period_start + 2.days,
        bill_status: :non_billable
      )

      invoice = create(
        :invoice,
        company:,
        client:,
        issue_date: period_start,
        due_date: period_end,
        status: :sent,
        amount: 600,
        amount_due: 600,
        base_currency_amount: 600
      )
      create(:invoice_line_item, invoice:, timesheet_entry: billable_entry_one, quantity: 240, rate: 100, date: period_start)
      create(:invoice_line_item, invoice:, timesheet_entry: billable_entry_two, quantity: 120, rate: 20, date: period_start + 1.day)
    end

    it "returns team productivity summary and per-member metrics" do
      result = described_class.new(company:, from: period_start, to: period_end).process

      expect(result[:summary]).to include(
        team_size: 2,
        total_hours: 8.0,
        billable_hours: 6.0,
        non_billable_hours: 2.0,
        invoiced_revenue: 440.0,
        average_hourly_rate: 73.33,
        utilization_rate: 7.5,
        billable_ratio: 75.0
      )

      first_member = result[:members].find { |member| member[:user_id] == first_user.id }
      second_member = result[:members].find { |member| member[:user_id] == second_user.id }

      expect(first_member).to include(
        total_hours: 8.0,
        billable_hours: 6.0,
        non_billable_hours: 2.0,
        invoiced_revenue: 440.0,
        average_hourly_rate: 73.33,
        utilization_rate: 15.0,
        billable_ratio: 75.0
      )
      expect(second_member).to include(
        total_hours: 0.0,
        billable_hours: 0.0,
        non_billable_hours: 0.0,
        invoiced_revenue: 0.0,
        average_hourly_rate: 0.0,
        utilization_rate: 0.0,
        billable_ratio: 0.0
      )
    end

    it "supports filtering to selected users" do
      result = described_class.new(company:, from: period_start, to: period_end, user_ids: [first_user.id]).process

      expect(result[:summary][:team_size]).to eq(1)
      expect(result[:members].pluck(:user_id)).to eq([first_user.id])
    end
  end
end
