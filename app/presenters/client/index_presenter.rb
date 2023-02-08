# frozen_string_literal: true

class Client::IndexPresenter
  attr_reader :clients, :current_user, :current_company

  def initialize(clients, current_company, current_user)
    @clients = clients
    @current_user = current_user
    @current_company = current_company
  end

  def projects_grouped_by_client_name
    projects = {}
    if is_admin
      clients.each { |client| projects[client.name] = client.projects.kept }
    else
      employee_projects = current_user.projects.kept.joins(:client).where(clients: { company_id: current_company.id })
      clients.each { |client| projects[client.name] = client.projects.kept & employee_projects }
    end
    projects
  end

  private

    def is_admin
      current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end
end
