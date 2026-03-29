# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metrics::ValueSummary do
  describe ".build" do
    it "extracts totals for hours logged metrics" do
      summary = described_class.build("hours_logged", {
        "total_minutes" => 180,
        "entry_count" => 3
      })

      expect(summary).to eq(
        value_sum: 180,
        value_count: 3,
        value_avg: 60
      )
    end

    it "extracts totals for client revenue metrics" do
      summary = described_class.build("client_revenue", {
        "total_revenue" => 2250.0,
        "invoice_count" => 3
      })

      expect(summary).to eq(
        value_sum: 2250.0,
        value_count: 3,
        value_avg: 750.0
      )
    end

    it "returns nil average when there is no positive summary" do
      summary = described_class.build("project_stats", {
        "total_value" => 0,
        "count" => 0
      })

      expect(summary).to eq(
        value_sum: 0,
        value_count: 0,
        value_avg: nil
      )
    end
  end
end
