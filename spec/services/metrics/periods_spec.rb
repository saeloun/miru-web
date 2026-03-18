# frozen_string_literal: true

require "rails_helper"

RSpec.describe Metrics::Periods do
  describe ".period_date_for" do
    let(:date) { Date.new(2026, 3, 18) }

    it "normalizes week and month period anchors" do
      expect(described_class.period_date_for(:week, date)).to eq(date.beginning_of_week)
      expect(described_class.period_date_for(:month, date)).to eq(date.beginning_of_month)
    end

    it "returns nil for all_time" do
      expect(described_class.period_date_for(:all_time, date)).to be_nil
    end
  end

  describe ".staleness_threshold" do
    it "returns the expected thresholds" do
      expect(described_class.staleness_threshold(:day)).to eq(1.hour)
      expect(described_class.staleness_threshold(:week)).to eq(6.hours)
      expect(described_class.staleness_threshold(:year)).to eq(1.week)
    end
  end

  describe ".date_range" do
    let(:date) { Date.new(2026, 3, 18) }

    it "returns the full month range" do
      expect(described_class.date_range(:month, date)).to eq(date.beginning_of_month..date.end_of_month)
    end

    it "returns nil for all_time" do
      expect(described_class.date_range(:all_time, date)).to be_nil
    end
  end
end
