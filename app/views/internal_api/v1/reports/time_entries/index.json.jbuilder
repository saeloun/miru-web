# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.group_by_total_duration group_by_total_duration
json.reports reports do |grouped_report|
  json.label grouped_report[:label]
  json.id grouped_report[:id]
  json.entries grouped_report[:entries] do |report|
    json.id report.id
    json.note report.note
    json.project report.project_name
    json.project_id report.project_id
    json.client report.client_name
    json.duration report.duration
    json.work_date CompanyDateFormattingService.new(
      report.work_date,
      company: current_company,
      es_date_presence: true)
      .process
    json.bill_status report.bill_status
    json.team_member report.user_name
    json.client_logo client_logos[report.client_id]
  end
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
  json.projects filter_options[:projects] do |project|
    json.label project["name"]
    json.value project["id"]
  end
end

json.pagy pagination_details
