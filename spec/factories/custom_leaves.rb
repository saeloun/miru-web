# frozen_string_literal: true

FactoryBot.define do
  factory :custom_leave do
    leave
    name { "Custom Leave" }
    allocation_value { rand(1..10) }
    allocation_period { CustomLeave.allocation_periods.keys.sample }
  end
end
