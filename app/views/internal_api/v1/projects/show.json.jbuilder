# frozen_string_literal: true

json.project_details do
  json.id project.id
  json.name project.name
  json.is_billable project.billable
  json.client do
    json.name project.client.name
  end
  project_team_member_details = json.members project.project_team_member_details(params[:time_frame])
  json.total_minutes_logged (project_team_member_details.map { |user_details| user_details[:minutes_logged] }).sum
  # TODO: Don't call project.overdue_and_outstanding_amounts in views directly
  json.overdue_and_outstanding_amounts project.overdue_and_outstanding_amounts
end
