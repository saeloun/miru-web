# frozen_string_literal: true

require "rails_helper"

RSpec.describe LeaveTypeValidatable, type: :model do
  let(:leave) { create(:leave) }

  describe "Custom Validations" do
    context "when validating allocation combinations" do
      it "is not valid with weekly allocation period and weekly frequency" do
        leave_type = build(:leave_type, allocation_period: "weeks", allocation_frequency: "per_week", leave:)
        expect(leave_type.valid?).to be false
        expect(leave_type.errors[:base]).to include(
          "Invalid combination: Allocation period in weeks cannot have frequency per week")
      end

      it "is not valid with monthly allocation period and weekly or monthly frequencies" do
        ["per_week", "per_month"].each do |freq|
          leave_type = build(:leave_type, allocation_period: "months", allocation_frequency: freq, leave:)
          expect(leave_type.valid?).to be false
          expect(leave_type.errors[:base]).to include(
            "Invalid combination: Allocation period in months can only have frequency per quarter or per year")
        end
      end

      it "is valid with monthly allocation period and quarterly or yearly frequencies" do
        ["per_quarter", "per_year"].each do |freq|
          leave_type = build(
            :leave_type, allocation_period: "months", allocation_frequency: freq, allocation_value: 2,
            leave:)
          expect(leave_type.valid?).to be true
        end
      end
    end

    context "when validating allocation values" do
      it "is not valid with an allocation value exceeding the limit for the period and frequency" do
        combinations = {
          ["days", "per_week"] => 8,
          ["weeks", "per_month"] => 6
        }
        combinations.each do |(period, freq), value|
          leave_type = build(
            :leave_type, allocation_period: period, allocation_frequency: freq,
            allocation_value: value, leave:)
          expect(leave_type).not_to be_valid
          expect(leave_type.errors[:allocation_value]).to include(
            "cannot exceed #{value - 1} #{period} for #{freq} frequency")
        end
      end

      it "is valid with an allocation value within the limit for the period and frequency" do
        combinations = {
          ["days", "per_week"] => 7,
          ["weeks", "per_month"] => 5
        }
        combinations.each do |(period, freq), value|
          leave_type = build(
            :leave_type, allocation_period: period, allocation_frequency: freq,
            allocation_value: value, leave:)
          expect(leave_type).to be_valid
        end
      end
    end

    context "when validating carry forward limits with frequency considerations" do
      it "is valid when carry_forward is less than total days in a year for days per week" do
        leave_type = build(
          :leave_type, allocation_period: "days", allocation_frequency: "per_week",
          allocation_value: 4, carry_forward_days: 5, leave:)
        expect(leave_type).to be_valid
      end

      it "is not valid when carry_forward exceeds total days for weeks per year" do
        leave_type = build(
          :leave_type, allocation_period: "weeks", allocation_frequency: "per_year",
          allocation_value: 2, carry_forward_days: 15, leave:)
        expect(leave_type).not_to be_valid
        expect(leave_type.errors[:carry_forward_days]).to include("cannot exceed the total allocated days")
      end

      it "is valid when carry_forward does not exceed total days for months per quarter" do
        leave_type = build(
          :leave_type, allocation_period: "months", allocation_frequency: "per_quarter",
          allocation_value: 1, carry_forward_days: 30, leave:)
        expect(leave_type).to be_valid
      end

      it "is not valid when carry_forward exceeds total days for months per year" do
        leave_type = build(
          :leave_type, allocation_period: "months", allocation_frequency: "per_year",
          allocation_value: 2, carry_forward_days: 63, leave:)
        expect(leave_type).not_to be_valid
        expect(leave_type.errors[:carry_forward_days]).to include("cannot exceed the total allocated days")
      end
    end
  end
end
