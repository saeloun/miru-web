# frozen_string_literal: true

class ClientsPresenter
  attr_reader :clients, :is_admin, :current_user, :current_company

  def initialize(clients, current_company, current_user, is_admin)
    @clients = clients
    @current_user = current_user
    @is_admin = is_admin
    @current_company = current_company
  end

  def client_name_to_projects
    projects = {}
    if is_admin
      clients.each { |client| projects[client.name] = client.projects.kept }
    else
      employee_projects = current_user.projects.kept.joins(:client).where(clients: { company_id: current_company.id })
      clients.each { |client| projects[client.name] = client.projects.kept & employee_projects }
    end
    projects
  end
end
