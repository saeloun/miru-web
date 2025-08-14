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
FactoryBot.define do
  factory :leave_type do
    leave
    name { "Annual Leaves" }
    color { LeaveType.colors.keys.sample }
    icon { LeaveType.icons.keys.sample }
    allocation_period { LeaveType.allocation_periods.keys.sample }
    allocation_frequency { LeaveType.allocation_frequencies.keys.sample }
    allocation_value { rand(1..10) }
    carry_forward_days { rand(0..5) }
  end
end
