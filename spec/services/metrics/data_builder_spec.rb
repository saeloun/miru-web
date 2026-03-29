# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metrics::DataBuilder do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  describe ".build" do
    it "builds hours logged data" do
      create(:timesheet_entry, project:, duration: 120, work_date: Date.current)
      create(:timesheet_entry, project:, duration: 60, work_date: Date.current)

      metric = build(:metric, trackable: client, metric_type: "hours_logged", period: "week", period_date: Date.current)
      data = described_class.build(metric)

      expect(data[:total_minutes]).to eq(180.0)
      expect(data[:entry_count]).to eq(2)
      expect(data[:unique_projects]).to eq(1)
    end

    it "builds client revenue data" do
      create(:invoice, client:, amount: 1000, status: "paid", issue_date: Date.current)
      create(:invoice, client:, amount: 500, status: "sent", issue_date: Date.current)

      metric = build(:metric, trackable: client, metric_type: "client_revenue", period: "month", period_date: Date.current)
      data = described_class.build(metric)

      expect(data[:total_revenue]).to eq(1500.0)
      expect(data[:total_paid]).to eq(1000.0)
      expect(data[:invoice_count]).to eq(2)
    end
  end
end
