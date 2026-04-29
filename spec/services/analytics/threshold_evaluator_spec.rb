# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ThresholdEvaluator do
  let(:company) { create(:company) }

  it "returns low utilization alert" do
    allow(Analytics::TeamProductivityAnalytics).to receive(:process).and_return({ summary: { utilization_rate: 55.0, team_size: 3 } })
    allow(Analytics::ComparativeAnalysisService).to receive(:process).and_return({ metrics: { collected_revenue: { current: 1000.0, previous: 1000.0 } } })
    allow(Analytics::ExpenseTrendAnalyzer).to receive(:process).and_return({ anomalies: [] })

    alerts = described_class.new(company:).process

    expect(alerts.pluck(:type)).to include("low_utilization")
  end

  it "returns revenue drop alert" do
    allow(Analytics::TeamProductivityAnalytics).to receive(:process).and_return({ summary: { utilization_rate: 80.0, team_size: 3 } })
    allow(Analytics::ComparativeAnalysisService).to receive(:process).and_return({ metrics: { collected_revenue: { current: 600.0, previous: 1000.0, change_percentage: -40.0 } } })
    allow(Analytics::ExpenseTrendAnalyzer).to receive(:process).and_return({ anomalies: [] })

    alerts = described_class.new(company:).process

    expect(alerts.pluck(:type)).to include("revenue_drop")
  end

  it "returns expense anomaly alert" do
    allow(Analytics::TeamProductivityAnalytics).to receive(:process).and_return({ summary: { utilization_rate: 80.0, team_size: 3 } })
    allow(Analytics::ComparativeAnalysisService).to receive(:process).and_return({ metrics: { collected_revenue: { current: 1000.0, previous: 1000.0 } } })
    allow(Analytics::ExpenseTrendAnalyzer).to receive(:process).and_return({ anomalies: [{ name: "Travel" }] })

    alerts = described_class.new(company:).process

    expect(alerts.pluck(:type)).to include("expense_anomaly")
  end

  it "returns no alerts when thresholds are healthy" do
    allow(Analytics::TeamProductivityAnalytics).to receive(:process).and_return({ summary: { utilization_rate: 85.0, team_size: 3 } })
    allow(Analytics::ComparativeAnalysisService).to receive(:process).and_return({ metrics: { collected_revenue: { current: 1000.0, previous: 1000.0 } } })
    allow(Analytics::ExpenseTrendAnalyzer).to receive(:process).and_return({ anomalies: [] })

    alerts = described_class.new(company:).process

    expect(alerts).to eq([])
  end
end
