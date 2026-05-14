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
  json.extract! line_item,
    :selection_id, :timesheet_entry_id, :linked_timesheet_entry_ids, :user_id, :project_id,
    :project_name, :first_name, :last_name, :name, :description, :date, :date_range,
    :quantity, :rate, :entry_count
end

# sends total number of new line item entry count
json.total_new_line_items total_new_line_items
