# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.projects projects.map do |project|
  json.id project.id
  json.name project.name
  json.isBillable project.billable
  json.client_name project.client.name
  json.minutes_spent project.minutes_spent
end
json.clients clients do |client|
  json.id client.id
  json.name client.name
end