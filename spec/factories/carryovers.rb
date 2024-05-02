# frozen_string_literal: true

FactoryBot.define do
  factory :carryover do
    user
    company
    leave_type
    from_year { 2023 }
    to_year { 2024 }
    total_leave_balance { 10000 } # in minutes
    duration { 2400 } # in minutes
    discarded_at { "2024-04-29 19:59:39" }
  end
end
