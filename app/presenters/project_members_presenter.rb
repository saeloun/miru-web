# frozen_string_literal: true

class ProjectMembersPresenter
  attr_reader :projects

  def initialize(projects)
    @projects = projects
  end

  def project_to_member_hourly_rate
    @_project_to_member_hourly_rate ||= projects.group_by(&:id).transform_values do |project|
      project_members_hourly_rate(project.first)
    end
  end

  private

    def project_members_hourly_rate(project)
      @_project_members_hourly_rate ||= project.project_members.pluck(:user_id, :hourly_rate).to_h
    end
end
