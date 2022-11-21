# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.reports reports do |client|
  json.client client
  json.entries client.timesheet_entries do |entry|
    json.extract! entry, :id, :work_date, :duration, :note, :bill_status
    json.project entry.project
    json.user entry.user
  end
end
json.filter_options do
  json.clients filter_options[:clients] do |client|
    json.name client.name
    json.id client.id
  end
  json.team_members filter_options[:team_members] do |team_member|
   json.name team_member.full_name
   json.id team_member.id
 end
  json.currency filter_options[:currency]
end
