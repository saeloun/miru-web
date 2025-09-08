# frozen_string_literal: true

json.project_details do
  json.id project.id
  json.name project.name
  json.is_billable project.billable
  json.client do
    json.id project.client_id
    json.name project.client.name
  end
  json.members team_member_details
  json.total_minutes_logged total_duration
  json.overdue_and_outstanding_amounts overdue_and_outstanding_amounts
end
