
# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.timeoff_entries timeoff_entries do |timeoff_entry|
  json.id timeoff_entry.id
  json.duration timeoff_entry.duration
  json.leave_date CompanyDateFormattingService.new(timeoff_entry.leave_date, company: current_company).process
  json.leave_type timeoff_entry.leave_type
end

json.employees employees
json.leave_balance leave_balance
json.total_timeoff_entries_duration total_timeoff_entries_duration
