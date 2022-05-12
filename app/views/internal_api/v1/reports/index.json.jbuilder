# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.entries entries do |report|
  json.id report.id
  json.note report.note
  json.project report.project.name
  json.project_id report.project_id
  json.client report.project.client.name
  json.duration report.duration
  json.work_date report.work_date
  json.bill_status report.bill_status
  json.team_member report.user.full_name
end
json.filter_options do
  json.clients filter_options[:clients] do |client|
    json.label client.name
    json.value client.id
  end
  json.team_members filter_options[:team_members] do |team_member|
   json.label team_member.full_name
   json.value team_member.id
 end
end
