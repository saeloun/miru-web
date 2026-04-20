# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::QueryService do
  describe "#process" do
    let(:company) { create(:company) }

    it "uses the analytics cache store" do
      allow(Analytics::CacheStore).to receive(:fetch).and_yield
      allow(Analytics::RevenueForecastService).to receive(:process).and_return({ horizon: 3, historical_periods: [], forecast_periods: [] })

      result = described_class.new(report_type: :revenue_forecast, company:, filters: { horizon: 3 }).process

      expect(Analytics::CacheStore).to have_received(:fetch)
      expect(Analytics::RevenueForecastService).to have_received(:process).with(company:, horizon: 3, client_ids: nil)
      expect(result).to include("horizon" => 3)
    end

    it "routes comparison queries through the comparison service" do
      allow(Analytics::CacheStore).to receive(:fetch).and_yield
      allow(Analytics::ComparativeAnalysisService).to receive(:process).and_return({ metrics: {} })

      described_class.new(
        report_type: :comparison,
        company: company,
        filters: { from: Date.new(2026, 4, 1), to: Date.new(2026, 4, 18), user_ids: [1], client_ids: [2], project_ids: [3] }
      ).process

      expect(Analytics::ComparativeAnalysisService).to have_received(:process).with(
        company: company,
        from: Date.new(2026, 4, 1),
        to: Date.new(2026, 4, 18),
        user_ids: [1],
        client_ids: [2],
        project_ids: [3]
      )
    end
  end

  describe "#refresh!" do
    let(:company) { create(:company) }

    it "writes refreshed payload to the analytics cache" do
      allow(Analytics::RevenueForecastService).to receive(:process).and_return({ horizon: 3, historical_periods: [], forecast_periods: [] })
      allow(Analytics::CacheStore).to receive(:write)

      service = described_class.new(report_type: :revenue_forecast, company:, filters: { horizon: 3 })
      service.refresh!

      expect(Analytics::CacheStore).to have_received(:write)
    end
  end
end
