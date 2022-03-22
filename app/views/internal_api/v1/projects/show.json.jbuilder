json.project_details do
  json.id @project.id
  json.name @project.name
  json.billable @project.billable
end
project_team_member_details = json.project_team_member_details @project.project_team_member_details(params[:time_frame])
json.project_total_minutes_logged (project_team_member_details.map { |user_details| user_details[:minutes_logged] }).sum

