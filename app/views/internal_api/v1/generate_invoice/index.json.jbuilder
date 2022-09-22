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
  json.first_name line_item.user.first_name
  json.last_name line_item.user.last_name
  json.description line_item.note
  json.date line_item.work_date
  json.quantity line_item.duration
  json.rate ProjectMember.find_by(user_id: line_item.user_id).hourly_rate
end
