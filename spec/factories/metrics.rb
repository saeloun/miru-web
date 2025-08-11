# frozen_string_literal: true

FactoryBot.define do
  factory :metric do
    association :trackable, factory: :client
    metric_type { "hours_logged" }
    period { "week" }
    period_date { Date.current.beginning_of_week }
    data { { "total_minutes" => 0 } }
    value_sum { 0 }
    value_count { 0 }
    value_avg { 0 }
    metadata { {} }
    calculated_at { Time.current }
  end
end
