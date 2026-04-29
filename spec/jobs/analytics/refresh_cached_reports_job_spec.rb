# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::RefreshCachedReportsJob, type: :job do
  describe "#perform" do
    let(:company) { create(:company) }
    let!(:first_report) { create(:analytics_report, company:, report_type: :revenue_forecast, filters: { "horizon" => 6 }) }
    let!(:second_report) { create(:analytics_report, company:, report_type: :expense_trends, filters: { "from" => "2026-01-01", "to" => "2026-01-31" }) }

    it "refreshes cached payloads for saved analytics reports" do
      first_service = instance_double(Analytics::QueryService, refresh!: true)
      second_service = instance_double(Analytics::QueryService, refresh!: true)

      allow(Analytics::QueryService).to receive(:new).and_return(first_service, second_service)

      described_class.perform_now

      expect(Analytics::QueryService).to have_received(:new).with(report_type: "revenue_forecast", company:, filters: { "horizon" => 6 })
      expect(Analytics::QueryService).to have_received(:new).with(report_type: "expense_trends", company:, filters: { "from" => "2026-01-01", "to" => "2026-01-31" })
      expect(first_service).to have_received(:refresh!)
      expect(second_service).to have_received(:refresh!)
    end

    it "can refresh only selected reports" do
      service = instance_double(Analytics::QueryService, refresh!: true)
      allow(Analytics::QueryService).to receive(:new).and_return(service)

      described_class.perform_now([first_report.id])

      expect(Analytics::QueryService).to have_received(:new).once
      expect(service).to have_received(:refresh!)
    end
  end
end
