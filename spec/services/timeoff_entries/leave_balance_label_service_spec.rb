# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::LeaveBalanceLabelService do
  describe ".process" do
    let(:working_hours_per_day) { 8 }

    it "returns zero label for zero balance" do
      expect(described_class.process(0, working_hours_per_day)).to eq("0 hours")
    end

    it "returns hours when under one day" do
      expect(described_class.process(3, working_hours_per_day)).to eq("3 hours")
    end

    it "returns days and hours for positive balances" do
      expect(described_class.process(10, working_hours_per_day)).to eq("1 day 2 hours")
    end

    it "returns overdrawn hours when negative balance is under one day" do
      expect(described_class.process(-2, working_hours_per_day)).to eq("Overdrawn by 2 hours")
    end

    it "returns overdrawn days and hours for larger negative balances" do
      expect(described_class.process(-18, working_hours_per_day)).to eq("Overdrawn by 2 days 2 hours")
    end
  end
end
