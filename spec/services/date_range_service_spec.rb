# frozen_string_literal: true

require "rails_helper"

RSpec.describe DateRangeService do
  describe "#process" do
    it "returns the current year for an unknown timeframe" do
      range = described_class.new(timeframe: "unknown").process

      expect(range.begin.to_date).to eq(Date.current.beginning_of_year)
      expect(range.end.to_date).to eq(Date.current.end_of_year)
    end

    it "returns a parsed custom range" do
      range = described_class.new(timeframe: "custom", from: "2026-02-10", to: "2026-02-14").process

      expect(range).to eq(Date.new(2026, 2, 10)..Date.new(2026, 2, 14))
    end

    it "raises for an invalid custom date" do
      expect {
        described_class.new(timeframe: "custom", from: "bad-date", to: "2026-02-14").process
      }.to raise_error(Date::Error)
    end
  end
end
