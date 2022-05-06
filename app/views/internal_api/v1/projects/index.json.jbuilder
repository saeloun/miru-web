# frozen_string_literal: true

json.projects current_company.project_list(params[:client_id], params[:user_id], params[:billable], params[:search])
# json.projects projects do |project|
#   json.id project.id
#   json.name project.name
#   json.client do
#     json.name project.client.name
#   end
#   json.is_billable project.billable
#   json.minutes_spent project.total_hours_logged
# end
json.clients current_company_clients do |client|
  json.id client.id
  json.name client.name
end
json.team_members current_company_users do |user|
  json.id user.id
  json.user_name "#{user.first_name} #{user.last_name}"
end
