# frozen_string_literal: true

# sending team member list values according to client and project
json.filter_options do
  json.team_members filter_options[:team_members] do |team_member|
    json.label team_member.full_name
    json.value team_member.id
  end
end

# new line items data according to filters and search term
json.new_line_item_entries new_line_item_entries do |line_item|
  # TODO:-Temporarily checking for project member relation. To be fixed in TimeTracking.
  hourly_rate = ProjectMember.find_by(user_id: line_item.user_id, project_id: line_item.project_id)&.hourly_rate
  next unless hourly_rate

  json.timesheet_entry_id line_item.id
  json.user_id line_item.user_id
  json.project_id line_item.project_id
  json.first_name line_item.user.first_name
  json.last_name line_item.user.last_name
  json.description line_item.note
  json.date line_item.work_date
  json.quantity line_item.duration
  json.rate hourly_rate
end

# sends total number of new line item entry count
json.total_new_line_items total_new_line_items
