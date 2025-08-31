# frozen_string_literal: true

json.projects projects do |project|
  json.id project.id
  json.name project.name
  json.client_id project.client_id
  json.client_name project.client&.name
  json.billable project.billable
  json.description project.description
  json.status project.discarded? ? "inactive" : "active"
  json.totalHours project.timesheet_entries.sum(:duration) / 60.0
  json.teamMembers project.project_members.map { |pm| { id: pm.user_id, name: pm.user&.full_name } }
  json.created_at project.created_at
  json.updated_at project.updated_at
end

json.clients clients do |client|
  json.id client.id
  json.name client.name
end

json.total_count projects.respond_to?(:total_count) ? projects.total_count : projects.count
