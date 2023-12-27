# frozen_string_literal: true

FactoryBot.define do
  factory :timeoff_entry do
    user
    leave_type
    duration { 480 }
    note { "Did that" }
    leave_date { Date.current }
  end
end
