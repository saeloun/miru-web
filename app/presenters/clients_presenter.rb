# frozen_string_literal: true

class ClientsPresenter
  attr_reader :clients, :current_user, :current_company

  def initialize(clients, current_company, current_user)
    @clients = clients
    @current_user = current_user
    @current_company = current_company
  end

  def group_projects_by_client_name
    projects = {}
    if is_admin
      clients.each { |client| projects[client.name] = client.projects.kept }
    else
      current_user.projects.kept.joins(:client).where(clients: { company_id: current_company.id }).select(
        "projects.id, projects.name, projects.billable, projects.description, clients.name"
      ).each { |client| projects[client.name] = client.projects.kept }
    end
    projects
  end

  private

    def is_admin
      current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end
end
