# frozen_string_literal: true

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
