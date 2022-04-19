# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.project_details current_company.project_list_after_filter((params[:from]), (params[:client_filter]), (params[:user_filter]), params[:search] )
# json.projects projects do |project|
#   json.id project.id
#   json.name project.name
#   json.client do
#     json.name project.client.name
#   end
#   json.is_billable project.billable
#   json.minutes_spent project.total_hours_logged
# end
json.clients current_company.clients do |client|
  json.id client.id
  json.name client.name
end
