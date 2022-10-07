# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.projects current_company.project_list(params[:client_id], policy(Project).index_all? ? nil : current_user.id, params[:billable], params[:search])
json.clients current_company_clients do |client|
  json.id client.id
  json.name client.name
end
json.team_members current_company_users do |user|
  json.id user.id
  json.user_name "#{user.first_name} #{user.last_name}"
end
