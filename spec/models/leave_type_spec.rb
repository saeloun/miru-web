# frozen_string_literal: true

require "rails_helper"

RSpec.describe LeaveType, type: :model do
  let(:leave) { create(:leave) }

  describe "validations" do
    it "is valid with valid attributes" do
      leave_type = build(:leave_type, leave:)
      expect(leave_type).to be_valid
    end

    it "is not valid without a name" do
      leave_type = build(:leave_type, name: nil, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:name]).to include("can't be blank")
    end

    it "is not valid with a duplicate color within the same leave" do
      existing_leave_type = create(:leave_type, leave:)
      leave_type = build(:leave_type, color: existing_leave_type.color, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:color]).to include("has already been taken for this leave")
    end

    it "is not valid with a duplicate icon within the same leave" do
      existing_leave_type = create(:leave_type, leave:)
      leave_type = build(:leave_type, icon: existing_leave_type.icon, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:icon]).to include("has already been taken for this leave")
    end

    it "is not valid without a allocation value" do
      leave_type = build(:leave_type, allocation_value: nil, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:allocation_value]).to include("can't be blank")
    end

    it "is not valid if allocation value is less than 1" do
      leave_type = build(:leave_type, allocation_value: 0, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:allocation_value]).to include("must be greater than or equal to 1")
    end

    it "is not valid without a allocation frequency" do
      leave_type = build(:leave_type, allocation_frequency: nil, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:allocation_frequency]).to include("can't be blank")
    end

    it "is not valid without a carry forward days" do
      leave_type = build(:leave_type, carry_forward_days: nil, leave:)
      expect(leave_type).not_to be_valid
      expect(leave_type.errors[:carry_forward_days]).to include("can't be blank")
    end
  end

  describe "custom validations" do
    context "when validating allocation combinations" do
      it "is not valid with weekly allocation period and weekly frequency" do
        leave_type = build(:leave_type, allocation_period: "weeks", allocation_frequency: "per_week", leave:)
        expect(leave_type).not_to be_valid
        expect(leave_type.errors[:base]).to include(
          "Invalid combination: Allocation period in weeks cannot have frequency per week")
      end

      it "is not valid with monthly allocation period and weekly or monthly frequencies" do
        invalid_frequencies = ["per_week", "per_month"]
        invalid_frequencies.each do |freq|
          leave_type = build(:leave_type, allocation_period: "months", allocation_frequency: freq, leave:)
          expect(leave_type).not_to be_valid
          expect(leave_type.errors[:base]).to include(
            "Invalid combination: Allocation period in months can only have frequency per quarter or per year")
        end
      end

      it "is valid with monthly allocation period and quarterly or yearly frequencies" do
        valid_frequencies = ["per_quarter", "per_year"]
        valid_frequencies.each do |freq|
          leave_type = build(:leave_type, allocation_period: "months", allocation_frequency: freq, leave:)
          expect(leave_type).to be_valid
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
