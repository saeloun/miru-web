# frozen_string_literal: true

class ProjectMembersPresenter
  attr_reader :projects

  def initialize(projects)
    @projects = projects
  end

  def project_to_member_hourly_rate
    projects_members_rates = {}
    projects.each do |project|
      projects_members_rates[project.id] = project_members_hourly_rate(project)
    end

    projects_members_rates
  end

  private

    def project_members_hourly_rate(project)
      member_rates = {}
      project.project_members.each do |project_member|
        member_rates[project_member.user_id] = project_member.hourly_rate
      end

      member_rates
    end
end
