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
  # TODO:-Temporarily sending data for all unbilled timesheet entries even if user is not a part of the project.
  # To be fixed in a separate TimeTracking PR on priority.

  json.extract! line_item,
    :timesheet_entry_id, :user_id, :project_id, :first_name, :last_name, :description, :date, :quantity, :rate
end

# sends total number of new line item entry count
json.total_new_line_items total_new_line_items
