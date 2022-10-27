# frozen_string_literal: true

json.projects searched_projects do |project|
  json.id project.id
  json.name project.name
  json.client_name project.client_name
end

json.total_searched_projects total_searched_projects
