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
      expect(Analytics::RevenueForecastService).to have_received(:process).with(company:, horizon: 3)
      expect(result).to include("horizon" => 3)
    end
  end
end
