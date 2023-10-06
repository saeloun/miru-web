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
end
