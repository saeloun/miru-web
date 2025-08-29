# frozen_string_literal: true

json.filter_options do
  json.team_members filter_options[:team_members] do |user|
    json.label user.full_name
    json.value user.id
  end
end

json.new_line_item_entries new_line_item_entries do |entry|
  json.timesheet_entry_id entry[:timesheet_entry_id]
  json.user_id entry[:user_id]
  json.project_id entry[:project_id]
  json.first_name entry[:first_name]
  json.last_name entry[:last_name]
  json.description entry[:description]
  json.date entry[:date]
  json.quantity entry[:quantity]
  json.rate entry[:rate]
end

json.total_new_line_items total_new_line_items