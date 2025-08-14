# frozen_string_literal: true

# == Schema Information
#
# Table name: leave_types
#
#  id                   :bigint           not null, primary key
#  allocation_frequency :integer          not null
#  allocation_period    :integer          not null
#  allocation_value     :integer          not null
#  carry_forward_days   :integer          default(0), not null
#  color                :integer          not null
#  discarded_at         :datetime
#  icon                 :integer          not null
#  name                 :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  leave_id             :bigint           not null
#
# Indexes
#
#  index_leave_types_on_color_and_leave_id  (color,leave_id) UNIQUE
#  index_leave_types_on_discarded_at        (discarded_at)
#  index_leave_types_on_icon_and_leave_id   (icon,leave_id) UNIQUE
#  index_leave_types_on_leave_id            (leave_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_id => leaves.id)
#
require "rails_helper"

RSpec.describe LeaveType, type: :model do
  let(:leave) { create(:leave) }

  describe "validations" do
  it "is valid with valid attributes" do
    leave_type = build(
      :leave_type, leave:, allocation_period: "weeks", allocation_frequency: "per_year",
      allocation_value: 2)
    expect(leave_type).to be_valid
  end

  it "is not valid without a name" do
    leave_type = build(
      :leave_type, name: nil, leave:, allocation_period: "days", allocation_frequency: "per_week",
      allocation_value: 5)
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:name]).to include("can't be blank")
  end

  it "is not valid with a duplicate color within the same leave" do
    existing_leave_type = create(
      :leave_type, leave:, allocation_period: "months",
      allocation_frequency: "per_quarter", allocation_value: 1)
    leave_type = build(
      :leave_type, color: existing_leave_type.color, leave:, allocation_period: "months",
      allocation_frequency: "per_quarter", allocation_value: 1)
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:color]).to include("has already been taken for this leave")
  end

  it "is not valid with a duplicate icon within the same leave" do
    existing_leave_type = create(
      :leave_type, leave:, allocation_period: "weeks", allocation_frequency: "per_month",
      allocation_value: 2)
    leave_type = build(
      :leave_type, icon: existing_leave_type.icon, leave:, allocation_period: "weeks",
      allocation_frequency: "per_month", allocation_value: 2)
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:icon]).to include("has already been taken for this leave")
  end

  it "is not valid without an allocation value" do
    leave_type = build(
      :leave_type, allocation_value: nil, leave:, allocation_period: "days",
      allocation_frequency: "per_week")
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:allocation_value]).to include("can't be blank")
  end

  it "is not valid if allocation value is less than 1" do
    leave_type = build(
      :leave_type, allocation_value: 0, leave:, allocation_period: "days",
      allocation_frequency: "per_month")
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:allocation_value]).to include("must be greater than or equal to 1")
  end

  it "is not valid without an allocation frequency" do
    leave_type = build(
      :leave_type, allocation_frequency: nil, leave:, allocation_period: "weeks",
      allocation_value: 3)
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:allocation_frequency]).to include("can't be blank")
  end

  it "is not valid without carry forward days" do
    leave_type = build(
      :leave_type, carry_forward_days: nil, leave:, allocation_period: "months",
      allocation_frequency: "per_year", allocation_value: 2)
    expect(leave_type).not_to be_valid
    expect(leave_type.errors[:carry_forward_days]).to include("can't be blank")
  end
end
end
