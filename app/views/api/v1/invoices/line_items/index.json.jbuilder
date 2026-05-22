# frozen_string_literal: true

json.filter_options do
  json.team_members filter_options[:team_members] do |user|
    json.label user.full_name
    json.value user.id
  end
end

json.new_line_item_entries new_line_item_entries do |entry|
  json.selection_id entry[:selection_id]
  json.timesheet_entry_id entry[:timesheet_entry_id]
  json.linked_timesheet_entry_ids entry[:linked_timesheet_entry_ids]
  json.user_id entry[:user_id]
  json.project_id entry[:project_id]
  json.project_name entry[:project_name]
  json.first_name entry[:first_name]
  json.last_name entry[:last_name]
  json.name entry[:name]
  json.description entry[:description]
  json.date entry[:date]
  json.date_range entry[:date_range]
  json.quantity entry[:quantity]
  json.rate entry[:rate]
  json.entry_count entry[:entry_count]
end

json.total_new_line_items total_new_line_items
