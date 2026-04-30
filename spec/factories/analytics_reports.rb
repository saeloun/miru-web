# frozen_string_literal: true

FactoryBot.define do
  factory :analytics_report do
    company
    creator { association(:user, current_workspace: company) }
    name { "Revenue forecast snapshot" }
    report_type { :revenue_forecast }
    filters { { "from" => Date.current.beginning_of_year.iso8601, "to" => Date.current.iso8601 } }
  end
end
