# frozen_string_literal: true

class ClientsPresenter
  attr_reader :clients, :is_admin

  def initialize(is_admin, clients)
    @clients = clients
    @is_admin = is_admin
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
