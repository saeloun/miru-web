# frozen_string_literal: true

json.projects projects do |project|
  json.id project.id
  json.name project.name
  json.client_name project.client_name
end
