# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::Exports::DownloadService do
  describe "#process" do
    let(:company) { create(:company) }

    it "sanitizes spreadsheet formula prefixes in CSV exports" do
      allow(Analytics::QueryService).to receive(:process).and_return(
        {
          "summary" => {
            "team_size" => 1,
            "total_hours" => 1,
            "billable_hours" => 1,
            "utilization_rate" => 100,
            "average_hourly_rate" => 100
          },
          "members" => [
            {
              "user_name" => "=cmd",
              "total_hours" => 1,
              "billable_hours" => 1,
              "non_billable_hours" => 0,
              "utilization_rate" => 100,
              "average_hourly_rate" => 100
            }
          ]
        }
      )

      csv = described_class.new(
        report_type: "team_productivity",
        format: "csv",
        company: company,
        filters: { from: Date.current, to: Date.current }
      ).process

      expect(csv).to include("'=cmd")
    end
  end
end
