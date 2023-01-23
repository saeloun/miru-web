# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.projects projects.map do |project|
  json.id project.id
  json.name project.name
  json.isBillable project.billable
  json.clientName project._client_name
  json.minutesSpent project.minutes_spent
end
json.clients clients do |client|
  json.id client.id
  json.name client.name
end
json.team_members users do |user|
  json.id user.id
  json.user_name "#{user.first_name} #{user.last_name}"
end
