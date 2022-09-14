# frozen_string_literal: true

# sending team member list values according to client and project
json.filter_options do
  json.team_members filter_options[:team_members] do |team_member|
    json.label team_member.full_name
    json.value team_member.id
  end
end

# new line items data according to filters and search term
json.new_invoice_line_items new_line_item_entries do |line_item|
  json.id line_item.id
  json.user_id line_item.user_id
  json.project_id line_item.project_id
  json.team_member line_item.user_full_name
  json.note line_item.note
  json.work_date line_item.work_date
  json.duration line_item.duration
end
