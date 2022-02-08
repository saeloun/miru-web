# frozen_string_literal: true

FactoryBot.define do
  factory :timesheet_entry do
    user
    project
    duration { 480.0 } # in minutes
    note { "Did that" }
    work_date { "2022-01-11" }
    bill_status { "non_billable" }
  end
end
