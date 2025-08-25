# frozen_string_literal: true

json.project do
  json.id project.id
  json.name project.name
  json.client_id project.client_id
  json.client_name project.client&.name
  json.billable project.billable
  json.description project.description
  json.created_at project.created_at
  json.updated_at project.updated_at
end

json.notice notice
