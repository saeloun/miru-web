# frozen_string_literal: true

class ProjectPresenter
  attr_reader :project, :time_frame

  def initialize(project, time_frame)
    @project = project
    @time_frame = time_frame
  end

  def summary
    team_member_details = project.project_team_member_details(time_frame)
    {
      team_member_details:,
      total_minutes_logged: team_member_details.map { |user_details| user_details[:minutes_logged] }.sum,
      overdue_and_outstanding_amounts: project.overdue_and_outstanding_amounts
    }
  end
end
