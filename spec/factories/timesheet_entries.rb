# frozen_string_literal: true

FactoryBot.define do
  factory :timesheet_entry do
    user
    project
    duration { 480.0 } # in minutes
    note { "Did that" }
    work_date { Date.today }
    bill_status { "non_billable" }
  end
end
